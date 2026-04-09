import type { RestClient } from './restClient';

export type LoginAccountType = 'user' | 'organization';

interface UserLookupResponse {
  type: string;
}

export async function fetchLoginAccountType(client: RestClient, login: string): Promise<LoginAccountType> {
  let data: UserLookupResponse;

  try {
    const response = await client.request<UserLookupResponse>(`/users/${encodeURIComponent(login)}`);
    data = response.data;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REST 404:')) {
      throw new Error(`GitHub login "${login}" was not found. Check GITHUB_USER.`, { cause: error });
    }

    throw error;
  }

  const type = data.type.trim().toLowerCase();

  if (type === 'organization') {
    return 'organization';
  }

  return 'user';
}
