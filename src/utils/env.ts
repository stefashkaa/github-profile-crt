export type EnvSource = Record<string, string | undefined>;

function firstDefined(env: EnvSource, names: string[]): string | undefined {
  for (const name of names) {
    const value = env[name];
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

export function stringEnv(env: EnvSource, names: string[], fallback: string): string {
  return firstDefined(env, names) ?? fallback;
}

export function numberEnv(env: EnvSource, names: string[], fallback: number): number {
  const value = Number(firstDefined(env, names));
  return Number.isFinite(value) ? value : fallback;
}

export function integerEnv(env: EnvSource, names: string[], fallback: number): number {
  const raw = firstDefined(env, names);
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(value) ? value : fallback;
}

export function booleanEnv(env: EnvSource, names: string[], fallback: boolean): boolean {
  const raw = firstDefined(env, names);

  if (raw === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export function optionalStringEnv(env: EnvSource, names: string[]): string | undefined {
  return firstDefined(env, names);
}
