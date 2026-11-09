import type { InsightChatMessage } from '../../hooks/useInsightsSuite';

export const conversationLifetime = 8 * 60 * 60 * 1000;
const history = new Map<string, InsightConversation[]>();

export interface InsightConversation {
  id: string;
  title: string;
  expiresAt: number;
  messages: InsightChatMessage[];
}

export function readConversations(scope: string) {
  const current = history.get(scope) ?? [];
  const remaining = current.filter((thread) => thread.expiresAt > Date.now());
  if (remaining.length) history.set(scope, remaining);
  else history.delete(scope);
  return remaining;
}

export function saveConversation(scope: string, thread: InsightConversation) {
  const current = readConversations(scope);
  if (thread.expiresAt <= Date.now()) return current;
  const next = [{ ...thread, messages: thread.messages.slice(-80) }, ...current.filter(({ id }) => id !== thread.id)].slice(0, 30);
  history.set(scope, next);
  return next;
}

export function clearConversations(demoOnly = false) {
  for (const scope of history.keys()) if (!demoOnly || scope.startsWith('demo:')) history.delete(scope);
}

if (typeof window !== 'undefined') {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('eveo_insights_thread_v3_')) localStorage.removeItem(key);
    }
  } catch { /* Browser storage may be unavailable. */ }
  window.setInterval(() => { for (const scope of history.keys()) readConversations(scope); }, 60_000);
}
