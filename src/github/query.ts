export const contributionCalendarQuery = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          firstDay
          contributionDays {
            date
            contributionCount
            contributionLevel
            weekday
            color
          }
        }
        months {
          firstDay
          name
          year
        }
      }
    }
  }
}
`;

export const profileInsightsQuery = `
query($login: String!, $repositoryLimit: Int!, $languageLimit: Int!) {
  user(login: $login) {
    contributionsCollection {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      commitContributionsByRepository(maxRepositories: $repositoryLimit) {
        contributions(first: 1) {
          totalCount
        }
        repository {
          nameWithOwner
          primaryLanguage {
            name
            color
          }
          languages(first: $languageLimit, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      }
    }
  }
}
`;
