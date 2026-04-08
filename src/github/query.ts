export const contributionCalendarQuery = `
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
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
query($login: String!, $from: DateTime!, $to: DateTime!, $repositoryLimit: Int!, $languageLimit: Int!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
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
