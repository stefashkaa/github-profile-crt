export type EnvSource = Record<string, string | undefined>;

function readEnv(env: EnvSource, name: string): string | undefined {
  return env[name];
}

export function stringEnv(env: EnvSource, name: string, fallback: string): string {
  return readEnv(env, name) ?? fallback;
}

export function numberEnv(env: EnvSource, name: string, fallback: number): number {
  const value = Number(readEnv(env, name));
  return Number.isFinite(value) ? value : fallback;
}

export function integerEnv(env: EnvSource, name: string, fallback: number): number {
  const raw = readEnv(env, name);
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(value) ? value : fallback;
}

export function booleanEnv(env: EnvSource, name: string, fallback: boolean): boolean {
  const raw = readEnv(env, name);

  if (raw === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

export function optionalStringEnv(env: EnvSource, name: string): string | undefined {
  return readEnv(env, name);
}
