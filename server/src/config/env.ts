import 'dotenv/config';
import { DEFAULT_PORT, DEFAULT_TOKEN_EXPIRY } from '../constants/api.js';

function parseTrustProxy(value: string | undefined): boolean | number {
  if (!value || value === '0' || value.toLowerCase() === 'false') return false;
  if (value.toLowerCase() === 'true') return true;
  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 ? hops : false;
}

export const env = {
  port: Number(process.env.PORT) || DEFAULT_PORT,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: process.env.MONGODB_URI?.trim() ?? '',
  jwtSecret: process.env.JWT_SECRET?.trim() ?? '',
  integrationEncryptionKey: process.env.INTEGRATION_ENCRYPTION_KEY?.trim() ?? '',
  openAiApiKey: process.env.OPENAI_API_KEY?.trim() ?? '',
  openAiModel: process.env.OPENAI_MODEL?.trim() || 'gpt-5-mini',
  platformAdminEmails: (process.env.PLATFORM_ADMIN_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || DEFAULT_TOKEN_EXPIRY,
  clientOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
};
