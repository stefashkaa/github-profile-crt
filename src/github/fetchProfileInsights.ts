import type { ProfileInsights } from "../model/insights";
import type { GraphQlClient } from "./graphqlClient";
import { profileInsightsQuery } from "./query";

const DEFAULT_REPOSITORY_LIMIT = 80;
const DEFAULT_LANGUAGE_LIMIT_PER_REPOSITORY = 8;
const MAX_LANGUAGE_SLICES = 5;

interface ProfileInsightsQueryResponse {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      totalIssueContributions: number;
      totalPullRequestContributions: number;
      totalPullRequestReviewContributions: number;
      commitContributionsByRepository: Array<{
        contributions: {
          totalCount: number;
        };
        repository: {
          nameWithOwner: string;
          primaryLanguage: {
            name: string;
            color: string | null;
          } | null;
          languages: {
            edges: Array<{
              size: number;
              node: {
                name: string;
                color: string | null;
              };
            }> | null;
          } | null;
        } | null;
      }> | null;
    };
  } | null;
}

function fallbackLanguageColor(name: string): string {
  let hash = 0;

  for (const char of name) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

export async function fetchProfileInsights(
  client: GraphQlClient,
  username: string,
  from: string,
  to: string
): Promise<ProfileInsights> {
  const data = await client.request<ProfileInsightsQueryResponse>(
    profileInsightsQuery,
    {
      login: username,
      from,
      to,
      repositoryLimit: DEFAULT_REPOSITORY_LIMIT,
      languageLimit: DEFAULT_LANGUAGE_LIMIT_PER_REPOSITORY
    }
  );

  if (!data.user) {
    throw new Error(`GitHub user "${username}" was not found`);
  }

  const languageMap = new Map<string, { size: number; color: string }>();

  for (const entry of data.user.contributionsCollection.commitContributionsByRepository ?? []) {
    const repository = entry.repository;
    const contributionWeight = entry.contributions.totalCount;

    if (!repository || contributionWeight <= 0) {
      continue;
    }

    const languageEdges = repository.languages?.edges ?? [];

    if (languageEdges.length === 0) {
      const fallbackLanguage = repository.primaryLanguage?.name ?? "Other";
      const fallbackColor = repository.primaryLanguage?.color ?? fallbackLanguageColor(fallbackLanguage);
      const current = languageMap.get(fallbackLanguage);

      if (!current) {
        languageMap.set(fallbackLanguage, { size: contributionWeight, color: fallbackColor });
      } else {
        current.size += contributionWeight;
      }

      continue;
    }

    const totalRepoLanguageSize = languageEdges.reduce((sum, edge) => sum + Math.max(0, edge.size), 0);
    const fallbackShare = totalRepoLanguageSize <= 0 ? 1 / languageEdges.length : 0;

    for (const edge of languageEdges) {
      const name = edge.node.name;
      const share = totalRepoLanguageSize > 0 ? edge.size / totalRepoLanguageSize : fallbackShare;
      const weightedSize = contributionWeight * share;
      const color = edge.node.color ?? fallbackLanguageColor(name);
      const current = languageMap.get(name);

      if (!current) {
        languageMap.set(name, { size: weightedSize, color });
        continue;
      }

      current.size += weightedSize;
      if (!current.color && color) {
        current.color = color;
      }
    }
  }

  const sortedLanguages = [...languageMap.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((left, right) => right.size - left.size);
  const totalLanguageSize = sortedLanguages.reduce((sum, language) => sum + language.size, 0);

  if (sortedLanguages.length > MAX_LANGUAGE_SLICES) {
    const top = sortedLanguages.slice(0, MAX_LANGUAGE_SLICES - 1);
    const otherSize = sortedLanguages
      .slice(MAX_LANGUAGE_SLICES - 1)
      .reduce((sum, language) => sum + language.size, 0);
    sortedLanguages.length = 0;
    sortedLanguages.push(...top, { name: "Other", size: otherSize, color: "#8b949e" });
  }

  return {
    activity: {
      commits: data.user.contributionsCollection.totalCommitContributions,
      pullRequests: data.user.contributionsCollection.totalPullRequestContributions,
      issues: data.user.contributionsCollection.totalIssueContributions,
      reviews: data.user.contributionsCollection.totalPullRequestReviewContributions
    },
    languages: sortedLanguages.map((language) => ({
      name: language.name,
      color: language.color,
      size: language.size,
      percentage: totalLanguageSize > 0 ? language.size / totalLanguageSize : 0
    })),
    totalLanguageSize
  };
}
