import type { ContributionCalendar, ContributionLevel, ContributionMonth, ContributionWeek } from '../model/calendar';
import type { ProfileInsights } from '../model/insights';
import { clamp } from '../utils/math';
import { addLanguageWeight, collapseLanguageBuckets, DEFAULT_MAX_LANGUAGE_SLICES } from './languageAggregation';
import type { RestClient } from './restClient';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_ORG_REPOSITORY_LIMIT = 80;
const COMMIT_ACTIVITY_CONCURRENCY = 8;
const COMMIT_ACTIVITY_MAX_ATTEMPTS = 3;
const COMMIT_ACTIVITY_RETRY_DELAY_MS = 450;
const COMMIT_LIST_PER_PAGE = 100;
const COMMIT_LIST_MAX_PAGES = 30;

interface OrganizationRepository {
  name: string;
  language: string | null;
  archived: boolean;
  disabled: boolean;
  fork: boolean;
}

interface CommitActivityWeek {
  total: number;
  week: number;
  days: number[];
}

interface RepoCommitListItem {
  commit: {
    author: {
      date: string | null;
    } | null;
    committer: {
      date: string | null;
    } | null;
  } | null;
}

interface RepoContributionSnapshot {
  dayCounts: Map<string, number>;
  total: number;
}

interface SearchIssuesResponse {
  total_count: number;
}

function utcDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcWeek(date: Date): Date {
  const dayStart = startOfUtcDay(date);
  const weekday = dayStart.getUTCDay();
  dayStart.setUTCDate(dayStart.getUTCDate() - weekday);
  return dayStart;
}

function monthName(monthIndex: number): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIndex]!;
}

function levelForCount(count: number, maxCount: number): ContributionLevel {
  if (count <= 0 || maxCount <= 0) {
    return 'NONE';
  }

  const ratio = count / maxCount;

  if (ratio <= 0.25) {
    return 'FIRST_QUARTILE';
  }

  if (ratio <= 0.5) {
    return 'SECOND_QUARTILE';
  }

  if (ratio <= 0.75) {
    return 'THIRD_QUARTILE';
  }

  return 'FOURTH_QUARTILE';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRestStatusError(error: unknown, status: number): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.startsWith(`REST ${status}:`);
}

function addDayCount(dayCounts: Map<string, number>, dayKey: string, contributionCount: number): void {
  if (contributionCount <= 0) {
    return;
  }

  dayCounts.set(dayKey, (dayCounts.get(dayKey) ?? 0) + contributionCount);
}

function countTotalContributions(dayCounts: Map<string, number>): number {
  let total = 0;

  for (const contributionCount of dayCounts.values()) {
    total += contributionCount;
  }

  return total;
}

function maxDayContribution(dayCounts: Map<string, number>): number {
  let maxContribution = 0;

  for (const contributionCount of dayCounts.values()) {
    if (contributionCount > maxContribution) {
      maxContribution = contributionCount;
    }
  }

  return maxContribution;
}

async function mapWithConcurrency<TInput, TResult>(
  items: TInput[],
  concurrency: number,
  mapper: (item: TInput, index: number) => Promise<TResult>
): Promise<TResult[]> {
  if (items.length === 0) {
    return [];
  }

  const results: TResult[] = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const currentIndex = nextIndex;
      if (currentIndex >= items.length) {
        return;
      }

      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]!, currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
}

async function fetchOrganizationRepositories(
  client: RestClient,
  orgLogin: string,
  includePrivateContributions: boolean
): Promise<OrganizationRepository[]> {
  const repositories: OrganizationRepository[] = [];
  const perPage = 100;
  let page = 1;

  while (repositories.length < DEFAULT_ORG_REPOSITORY_LIMIT) {
    const { data } = await client.request<OrganizationRepository[]>(`/orgs/${encodeURIComponent(orgLogin)}/repos`, {
      type: includePrivateContributions ? 'all' : 'public',
      sort: 'pushed',
      per_page: perPage,
      page
    });

    if (data.length === 0) {
      break;
    }

    const eligible = data.filter((repository) => !repository.archived && !repository.disabled && !repository.fork);
    repositories.push(...eligible);

    if (data.length < perPage) {
      break;
    }

    page += 1;
  }

  return repositories.slice(0, DEFAULT_ORG_REPOSITORY_LIMIT);
}

async function fetchRepoCommitActivity(
  client: RestClient,
  orgLogin: string,
  repositoryName: string
): Promise<CommitActivityWeek[] | null> {
  for (let attempt = 1; attempt <= COMMIT_ACTIVITY_MAX_ATTEMPTS; attempt += 1) {
    const response = await client.request<CommitActivityWeek[] | { message?: string }>(
      `/repos/${encodeURIComponent(orgLogin)}/${encodeURIComponent(repositoryName)}/stats/commit_activity`
    );

    if (response.status === 200 && Array.isArray(response.data)) {
      return response.data;
    }

    if (response.status === 202 && attempt < COMMIT_ACTIVITY_MAX_ATTEMPTS) {
      await sleep(COMMIT_ACTIVITY_RETRY_DELAY_MS * attempt);
      continue;
    }

    return null;
  }

  return null;
}

function mapCommitActivityToSnapshot(
  weeks: CommitActivityWeek[],
  fromIsoDay: string,
  toIsoDay: string
): RepoContributionSnapshot {
  const dayCounts = new Map<string, number>();

  for (const week of weeks) {
    const weekStart = week.week * 1000;

    for (let dayIndex = 0; dayIndex < week.days.length; dayIndex += 1) {
      const contributionCount = Math.max(0, week.days[dayIndex] ?? 0);
      if (contributionCount <= 0) {
        continue;
      }

      const dayDate = new Date(weekStart + dayIndex * DAY_MS);
      const dayKey = utcDateOnly(dayDate);

      if (dayKey < fromIsoDay || dayKey > toIsoDay) {
        continue;
      }

      addDayCount(dayCounts, dayKey, contributionCount);
    }
  }

  return {
    dayCounts,
    total: countTotalContributions(dayCounts)
  };
}

async function fetchRepoCommitListSnapshot(
  client: RestClient,
  orgLogin: string,
  repositoryName: string,
  fromIsoDay: string,
  toIsoDay: string
): Promise<RepoContributionSnapshot> {
  const dayCounts = new Map<string, number>();

  for (let page = 1; page <= COMMIT_LIST_MAX_PAGES; page += 1) {
    let response;

    try {
      response = await client.request<RepoCommitListItem[]>(
        `/repos/${encodeURIComponent(orgLogin)}/${encodeURIComponent(repositoryName)}/commits`,
        {
          since: `${fromIsoDay}T00:00:00.000Z`,
          until: `${toIsoDay}T23:59:59.999Z`,
          per_page: COMMIT_LIST_PER_PAGE,
          page
        }
      );
    } catch (error) {
      if (
        isRestStatusError(error, 403) ||
        isRestStatusError(error, 409) ||
        isRestStatusError(error, 422) ||
        isRestStatusError(error, 404)
      ) {
        return {
          dayCounts: new Map(),
          total: 0
        };
      }

      throw error;
    }

    const commits = response.data;
    if (commits.length === 0) {
      break;
    }

    for (const commit of commits) {
      const commitDate = commit.commit?.author?.date ?? commit.commit?.committer?.date;
      if (!commitDate) {
        continue;
      }

      const dayKey = commitDate.slice(0, 10);
      if (dayKey < fromIsoDay || dayKey > toIsoDay) {
        continue;
      }

      addDayCount(dayCounts, dayKey, 1);
    }

    const linkHeader = response.headers.get('link') ?? '';
    const hasNextPage = linkHeader.includes('rel="next"');
    if (!hasNextPage) {
      break;
    }
  }

  return {
    dayCounts,
    total: countTotalContributions(dayCounts)
  };
}

async function fetchRepositoryContributionSnapshot(
  client: RestClient,
  orgLogin: string,
  repositoryName: string,
  fromIsoDay: string,
  toIsoDay: string
): Promise<RepoContributionSnapshot> {
  const commitActivity = await fetchRepoCommitActivity(client, orgLogin, repositoryName);
  if (commitActivity && commitActivity.length > 0) {
    return mapCommitActivityToSnapshot(commitActivity, fromIsoDay, toIsoDay);
  }

  return fetchRepoCommitListSnapshot(client, orgLogin, repositoryName, fromIsoDay, toIsoDay);
}

function buildMonths(fromDay: Date, toDay: Date): ContributionMonth[] {
  const months: ContributionMonth[] = [];
  const cursor = new Date(Date.UTC(fromDay.getUTCFullYear(), fromDay.getUTCMonth(), 1));
  const end = new Date(Date.UTC(toDay.getUTCFullYear(), toDay.getUTCMonth(), 1));

  while (cursor.getTime() <= end.getTime()) {
    months.push({
      firstDay: cursor.toISOString(),
      name: monthName(cursor.getUTCMonth()),
      year: cursor.getUTCFullYear()
    });

    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return months;
}

function buildContributionWeeks(
  fromDay: Date,
  toDay: Date,
  fromIsoDay: string,
  toIsoDay: string,
  aggregatedDayCounts: Map<string, number>,
  maxDayCount: number
): ContributionWeek[] {
  const firstWeek = startOfUtcWeek(fromDay);
  const lastWeek = startOfUtcWeek(toDay);
  const weeks: ContributionWeek[] = [];

  for (let weekStartMs = firstWeek.getTime(); weekStartMs <= lastWeek.getTime(); weekStartMs += 7 * DAY_MS) {
    const weekStartDate = new Date(weekStartMs);
    const contributionDays = Array.from({ length: 7 }, (_, dayIndex) => {
      const dayDate = new Date(weekStartMs + dayIndex * DAY_MS);
      const dayKey = utcDateOnly(dayDate);
      const inWindow = dayKey >= fromIsoDay && dayKey <= toIsoDay;
      const contributionCount = inWindow ? (aggregatedDayCounts.get(dayKey) ?? 0) : 0;

      return {
        date: `${dayKey}T00:00:00.000Z`,
        contributionCount,
        contributionLevel: levelForCount(contributionCount, maxDayCount),
        weekday: dayDate.getUTCDay(),
        color: '#9be9a8'
      };
    });

    weeks.push({
      firstDay: weekStartDate.toISOString(),
      contributionDays
    });
  }

  return weeks;
}

async function fetchIssueSearchCount(client: RestClient, query: string): Promise<number> {
  try {
    const { data } = await client.request<SearchIssuesResponse>('/search/issues', {
      q: query,
      per_page: 1
    });

    return Math.max(0, data.total_count ?? 0);
  } catch {
    return 0;
  }
}

export async function fetchOrganizationData(
  client: RestClient,
  orgLogin: string,
  from: string,
  to: string,
  includeInsights: boolean,
  includePrivateContributions: boolean
): Promise<{ calendar: ContributionCalendar; insights: ProfileInsights | null }> {
  const fromDay = startOfUtcDay(new Date(from));
  const toDay = startOfUtcDay(new Date(to));
  const fromIsoDay = utcDateOnly(fromDay);
  const toIsoDay = utcDateOnly(toDay);

  const repositories = await fetchOrganizationRepositories(client, orgLogin, includePrivateContributions);

  const commitActivityByRepo = await mapWithConcurrency(
    repositories,
    COMMIT_ACTIVITY_CONCURRENCY,
    async (repository) => ({
      repository,
      snapshot: await fetchRepositoryContributionSnapshot(client, orgLogin, repository.name, fromIsoDay, toIsoDay)
    })
  );

  const aggregatedDayCounts = new Map<string, number>();
  const languageBuckets = new Map<string, { name: string; size: number; color: string }>();

  for (const entry of commitActivityByRepo) {
    if (entry.snapshot.total <= 0) {
      continue;
    }

    for (const [dayKey, contributionCount] of entry.snapshot.dayCounts.entries()) {
      addDayCount(aggregatedDayCounts, dayKey, contributionCount);
    }

    if (includeInsights) {
      addLanguageWeight(languageBuckets, entry.repository.language ?? 'Other', entry.snapshot.total);
    }
  }

  const maxDayCount = maxDayContribution(aggregatedDayCounts);
  const weeks = buildContributionWeeks(fromDay, toDay, fromIsoDay, toIsoDay, aggregatedDayCounts, maxDayCount);

  const totalContributions = countTotalContributions(aggregatedDayCounts);

  const calendar: ContributionCalendar = {
    totalContributions,
    weeks,
    months: buildMonths(fromDay, toDay)
  };

  if (!includeInsights) {
    return {
      calendar,
      insights: null
    };
  }

  const languages = collapseLanguageBuckets(languageBuckets, DEFAULT_MAX_LANGUAGE_SLICES);
  const totalLanguageSize = languages.reduce((sum, language) => sum + language.size, 0);

  const fromDateForSearch = fromIsoDay;
  const toDateForSearch = toIsoDay;
  const pullRequests = await fetchIssueSearchCount(
    client,
    `org:${orgLogin} is:pr created:${fromDateForSearch}..${toDateForSearch}`
  );
  const issues = await fetchIssueSearchCount(
    client,
    `org:${orgLogin} is:issue created:${fromDateForSearch}..${toDateForSearch}`
  );

  const insights: ProfileInsights = {
    activity: {
      commits: totalContributions,
      pullRequests,
      issues,
      reviews: 0
    },
    languages: languages.map((language) => ({
      name: language.name,
      color: language.color,
      size: language.size,
      percentage: totalLanguageSize > 0 ? clamp(language.size / totalLanguageSize, 0, 1) : 0
    })),
    totalLanguageSize
  };

  return {
    calendar,
    insights
  };
}
