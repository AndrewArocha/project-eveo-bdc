export interface EveoAgentInsightContext {
  title: string;
  summary: string;
  draftMessage?: string;
  actionLabel?: string;
  targetCount?: number;
}

export interface EveoAgentRequest {
  prompt: string;
  storeId: string;
  user: {
    name: string;
    role: string;
  };
  selectedInsight?: EveoAgentInsightContext;
}

export interface EveoAgentResponse {
  mode: 'preview' | 'live';
  content: string;
  draftSnippet?: string;
  actionLabel?: string;
}

export interface EveoAgentService {
  respond(request: EveoAgentRequest): Promise<EveoAgentResponse>;
}
