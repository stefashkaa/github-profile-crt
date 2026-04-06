export interface GraphQlClient {
  request<TResponse>(query: string, variables?: Record<string, unknown>): Promise<TResponse>;
}

interface GraphQlError {
  message: string;
}

interface GraphQlEnvelope<TData> {
  data?: TData;
  errors?: GraphQlError[];
}

export function createGitHubGraphQlClient(token: string): GraphQlClient {
  return {
    async request<TResponse>(query: string, variables: Record<string, unknown> = {}): Promise<TResponse> {
      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "github-profile-crt-generator"
        },
        body: JSON.stringify({ query, variables })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`GraphQL ${response.status}: ${text}`);
      }

      const json = (await response.json()) as GraphQlEnvelope<TResponse>;

      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors.map((error) => error.message).join(" | "));
      }

      if (!json.data) {
        throw new Error("GitHub GraphQL returned an empty data payload");
      }

      return json.data;
    }
  };
}
