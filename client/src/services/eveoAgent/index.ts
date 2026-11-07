import { mockEveoAgent } from './mockEveoAgent';

export type {
  EveoAgentInsightContext,
  EveoAgentRequest,
  EveoAgentResponse,
  EveoAgentService,
} from './types';

/**
 * Single frontend dependency for the Insights experience.
 * Swap this adapter for an authenticated HTTP implementation when the server
 * agent orchestrator is ready; the page and hook should not need to change.
 */
export const eveoAgent = mockEveoAgent;
export const EVE_AGENT_MODE: 'preview' | 'live' = 'preview';
