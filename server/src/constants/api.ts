export const API_PREFIX = '/api';
export const DEFAULT_PORT = 3001;
export const DEFAULT_TOKEN_EXPIRY = '12h';
export const PASSWORD_MIN_LENGTH = 12;
export const DATABASE_MAX_POOL_SIZE = 10;

export const API_MESSAGES = {
  notFound: 'The requested resource was not found.',
  internalError: 'An unexpected error occurred.',
  databaseUnavailable: 'The database is not configured or available.',
  invalidCredentials: 'Email or password is incorrect.',
  unauthorized: 'A valid sign-in is required.',
  forbidden: 'You do not have access to this resource.',
} as const;
