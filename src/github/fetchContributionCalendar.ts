import type { ContributionCalendar } from "../model/calendar";
import type { GraphQlClient } from "./graphqlClient";
import { contributionCalendarQuery } from "./query";

interface ContributionCalendarQueryResponse {
  user: {
    contributionsCollection: {
      contributionCalendar: ContributionCalendar;
    };
  } | null;
}

export async function fetchContributionCalendar(
  client: GraphQlClient,
  username: string
): Promise<ContributionCalendar> {
  const data = await client.request<ContributionCalendarQueryResponse>(
    contributionCalendarQuery,
    { login: username }
  );

  if (!data.user) {
    throw new Error(`GitHub user \"${username}\" was not found`);
  }

  return data.user.contributionsCollection.contributionCalendar;
}
