export interface RestClientResponse<TData> {
  data: TData;
  headers: Headers;
  status: number;
}

type RestSearchParams = Record<string, string | number | undefined>;

export interface RestClient {
  request<TData>(path: string, searchParams?: RestSearchParams): Promise<RestClientResponse<TData>>;
}

function buildRequestUrl(path: string, searchParams?: RestSearchParams): URL {
  const url = new URL(`https://api.github.com${path}`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined) {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

export function createGitHubRestClient(token: string): RestClient {
  return {
    async request<TData>(path: string, searchParams?: RestSearchParams): Promise<RestClientResponse<TData>> {
      const url = buildRequestUrl(path, searchParams);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'github-profile-crt-generator'
        }
      });

      const payload = (await response.json()) as TData;

      if (!response.ok) {
        const errorPayload = payload as { message?: string };
        throw new Error(`REST ${response.status}: ${errorPayload.message ?? JSON.stringify(payload)}`);
      }

      return {
        data: payload,
        headers: response.headers,
        status: response.status
      };
    }
  };
}
