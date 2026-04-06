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
