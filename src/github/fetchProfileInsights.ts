import type { ProfileInsights } from '../model/insights';
import type { GraphQlClient } from './graphqlClient';
import { addLanguageWeight, collapseLanguageBuckets, DEFAULT_MAX_LANGUAGE_SLICES } from './languageAggregation';
import { profileInsightsQuery } from './query';

const DEFAULT_REPOSITORY_LIMIT = 80;
const DEFAULT_LANGUAGE_LIMIT_PER_REPOSITORY = 8;

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

export async function fetchProfileInsights(
  client: GraphQlClient,
  username: string,
  from: string,
  to: string
): Promise<ProfileInsights> {
  const data = await client.request<ProfileInsightsQueryResponse>(profileInsightsQuery, {
    login: username,
    from,
    to,
    repositoryLimit: DEFAULT_REPOSITORY_LIMIT,
    languageLimit: DEFAULT_LANGUAGE_LIMIT_PER_REPOSITORY
  });

  if (!data.user) {
    throw new Error(`GitHub user "${username}" was not found`);
  }

  const languageBuckets = new Map<string, { name: string; size: number; color: string }>();

  for (const entry of data.user.contributionsCollection.commitContributionsByRepository ?? []) {
    const repository = entry.repository;
    const contributionWeight = entry.contributions.totalCount;

    if (!repository || contributionWeight <= 0) {
      continue;
    }

    const languageEdges = repository.languages?.edges ?? [];

    if (languageEdges.length === 0) {
      const fallbackLanguage = repository.primaryLanguage?.name ?? 'Other';
      addLanguageWeight(languageBuckets, fallbackLanguage, contributionWeight, repository.primaryLanguage?.color);

      continue;
    }

    const totalRepoLanguageSize = languageEdges.reduce((sum, edge) => sum + Math.max(0, edge.size), 0);
    const fallbackShare = totalRepoLanguageSize <= 0 ? 1 / languageEdges.length : 0;

    for (const edge of languageEdges) {
      const name = edge.node.name;
      const share = totalRepoLanguageSize > 0 ? edge.size / totalRepoLanguageSize : fallbackShare;
      const weightedSize = contributionWeight * share;
      addLanguageWeight(languageBuckets, name, weightedSize, edge.node.color);
    }
  }

  const sortedLanguages = collapseLanguageBuckets(languageBuckets, DEFAULT_MAX_LANGUAGE_SLICES);
  const totalLanguageSize = sortedLanguages.reduce((sum, language) => sum + language.size, 0);

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
