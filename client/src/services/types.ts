export type {
  EveoAgentInsightContext,
  EveoAgentRequest,
  EveoAgentResponse,
  EveoAgentService,
} from './eveoAgent/types';

/**
 * Single frontend dependency for the Insights experience.
 * Swap this adapter for an authenticated HTTP implementation when the server
 * agent orchestrator is ready; the page and hook should not need to change.
 */
export { eveoAgent, EVE_AGENT_MODE } from './eveoAgent/index';
