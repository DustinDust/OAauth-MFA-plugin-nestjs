export const MONGO_URI = 'MONGO_URI';

export const REDIS_HOST = 'REDIS_HOST';
export const REDIS_PORT = 'REDIS_PORT';
export const REDIS_PASSWORD = 'REDIS_PASSWORD';
export const REDIS_AUTH_CONFIG_KEY = 'REDIS_AUTH_CONFIG_KEY';

export const POSTGRES_PASSWORD = 'POSTGRES_PASSWORD';
export const POSTGRES_HOST = 'POSTGRES_HOST';
export const POSTGRES_PORT = 'PORT';
export const POSTGRES_DB = 'POSTGRES_DB';
export const POSTGRES_USER = 'POSTGRES_USER';

export const JWT_SECRET = 'JWT_SECRET';

export const TWO_FACTOR_AUTHENTICATOR_APP_NAME =
  'TWO_FACTOR_AUTHENTICATOR_APP_NAME';

export function getConfigToken(prefix: string, s: string) {
  if (s.startsWith('_')) {
    return `${prefix}${s}`;
  } else {
    if (prefix.length > 0) {
      return `${prefix}_${s}`;
    } else {
      return s;
    }
  }
}
