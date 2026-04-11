export type EnvSource = Record<string, string | undefined>;

const BOOLEAN_TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const BOOLEAN_FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

function readEnv(env: EnvSource, name: string): string | undefined {
  return env[name];
}

function readEnvTrimmed(env: EnvSource, name: string): string | undefined {
  const value = readEnv(env, name);
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function stringEnv(env: EnvSource, name: string, fallback: string): string {
  return readEnvTrimmed(env, name) ?? fallback;
}

export function numberEnv(env: EnvSource, name: string, fallback: number): number {
  const value = Number(readEnvTrimmed(env, name));
  return Number.isFinite(value) ? value : fallback;
}

export function integerEnv(env: EnvSource, name: string, fallback: number): number {
  const raw = readEnvTrimmed(env, name);
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(value) ? value : fallback;
}

export function booleanEnv(env: EnvSource, name: string, fallback: boolean): boolean {
  const raw = readEnvTrimmed(env, name);

  if (raw === undefined) {
    return fallback;
  }

  const normalized = raw.toLowerCase();
  if (BOOLEAN_TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (BOOLEAN_FALSE_VALUES.has(normalized)) {
    return false;
  }

  return fallback;
}

export function optionalStringEnv(env: EnvSource, name: string): string | undefined {
  return readEnvTrimmed(env, name);
}
