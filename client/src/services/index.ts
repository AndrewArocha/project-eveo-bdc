import type { EveoAgentRequest, EveoAgentResponse, EveoAgentService } from './types';

/**
 * Client-only E.V.E. preview adapter.
 * Replace this adapter with an authenticated API client when the server-side
 * agent orchestrator and its authorized tools are implemented.
 */
export const mockEveoAgent: EveoAgentService = {
  async respond(request: EveoAgentRequest): Promise<EveoAgentResponse> {
    const capability = getCapabilityHint(request.prompt);
    const insight = request.selectedInsight;

    const contextLine = insight
      ? `\n\nThe selected demonstration card, “${insight.title}”, currently contains this sample context: ${insight.summary}\n\nThis is local preview content, not a verified live dealership finding.`
      : '';

    const actionLine = insight?.draftMessage
      ? `\n\nI can show a draft preview for review. Nothing will be sent, scheduled, or written to a CRM record in this client-only stage.`
      : `\n\nNo dealership operation has been performed. When the server tools are ready, I will be able to retrieve authorized records and return evidence-backed results.`;

    return {
      mode: 'preview',
      content: `${request.user.name.split(' ')[0]}, I received your request about ${capability}. E.V.E. is currently in local preview mode: there is no OpenAI reasoning service or server-side dealership tool connected yet.${contextLine}${actionLine}`,
      draftSnippet: insight?.draftMessage,
      actionLabel: insight?.draftMessage ? 'Review draft preview' : undefined,
    };
  },
};

function getCapabilityHint(prompt: string): string {
  const text = prompt.toLowerCase();
  if (/inventory|vehicle|vin|stock|available|lot/.test(text)) return 'inventory lookup';
  if (/pending|deal|desk|f&i|finance/.test(text)) return 'pending-deal review';
  if (/sla|handoff|wait|response time/.test(text)) return 'showroom SLA analysis';
  if (/staff|headcount|personnel|agent|performance|kpi/.test(text)) return 'staffing and performance analysis';
  if (/campaign|marketing|instagram|facebook|social/.test(text)) return 'marketing campaign preparation';
  if (/sms|email|message|whatsapp|reply|draft/.test(text)) return 'customer communication drafting';
  if (/plan|action plan|strategy/.test(text)) return 'action-plan preparation';
  return 'your requested task';
}
export { apiOperationalRepository } from './operational/apiOperationalRepository';
export type { ApiLead, ApiAppointment, CreateLeadInput, CreateAppointmentInput, LeadStatus, AppointmentStatus } from './operational/apiOperationalRepository';
