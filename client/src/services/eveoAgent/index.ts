import { apiRequest } from '../apiClient';
import type { EveoAgentService, EveoAgentResponse } from './types';

export type {
  EveoAgentInsightContext,
  EveoAgentRequest,
  EveoAgentResponse,
  EveoAgentService,
} from './types';

/**
 * Single frontend dependency for Insights. Requests are authenticated and run
 * against the server, which returns live dealership evidence and deterministic
 * recommendations even when optional AI wording is unavailable.
 */
export const eveoAgent: EveoAgentService = {
  async respond(request) {
    try {
      return await apiRequest<EveoAgentResponse>('/eve/respond', {
        method: 'POST',
        body: JSON.stringify({ storeId: request.storeId, prompt: request.prompt }),
      });
    } catch (error) {
      return { mode: 'preview', content: error instanceof Error ? error.message : 'E.V.E. could not reach the server. Try again.' };
    }
  },
};
export const EVE_AGENT_MODE: 'preview' | 'live' = 'live';
