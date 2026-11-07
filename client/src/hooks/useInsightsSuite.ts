// src/hooks/useInsightsSuite.ts
import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  EVEO_GLOBAL_TEAM,
  CURRENT_USER,
  type StoreData,
  type UserRole,
} from '../data/mockDatabase';
import {
  getPersistentStoreData,
  fetchStorePipelineAsync,
  publishLiveActivityAsync,
} from '../services/liveActivity/liveActivityStore';
import { eveoAgent } from '../services/eveoAgent';

export type InsightCategory = 'churn' | 'inventory' | 'staff' | 'sla';

export interface InsightCardSchema {
  id: string;
  storeId: string;
  category: InsightCategory;
  title: string;
  metricValue: string;
  metricSublabel: string;
  metricBadge: string;
  summary: string;
  promptTemplate: string;
  actionLabel: string;
  hasWarningPoint?: boolean;
  actionPayload: {
    type: 'sms_campaign' | 'schedule_adjust' | 'crm_flag';
    targetCount: number;
    draftMessage?: string;
  };
}

export interface InsightChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  draftSnippet?: string;
  actionLabel?: string;
  /** Local preview acknowledgment only; this is not an external operation. */
  actionReviewed?: boolean;
  /** Legacy key from the earlier mock UI; retained only for migration. */
  actionExecuted?: boolean;
  mode?: 'preview' | 'live';
}

export interface HubMascotDigest {
  mood: 'happy' | 'curious' | 'chill' | 'alert';
  title: string;
  body: string;
  speechTitle: string;
  speechBody: string;
  hasMajorChanges: boolean;
  bulletActions: Array<{
    label: string;
    route: string;
    onClick?: () => void;
  }>;
}

export interface ResolvedInsightUser {
  fullName: string;
  firstName: string;
  role: string;
  roleBadge: string;
  greetingText: string;
  inputPlaceholder: string;
  faqs: string[];
}

const INSIGHTS_THREAD_PREFIX = 'eveo_insights_thread_v2_';

function readInsightThread(key: string): InsightChatMessage[] {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as InsightChatMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((message) => ({
      ...message,
      mode: message.role === 'assistant' ? (message.mode || 'preview') : message.mode,
      actionReviewed: message.actionReviewed ?? message.actionExecuted ?? false,
    }));
  } catch {
    return [];
  }
}

export function useInsightsSuite(storeId: string, roleOverride?: UserRole | string) {
  const [store, setStore] = useState<StoreData>(() => getPersistentStoreData(storeId));
  const [isLoading, setIsLoading] = useState(false);

  const effectiveRole =
    roleOverride || localStorage.getItem('eveo_role') || 'super_admin';

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    void fetchStorePipelineAsync(storeId).then((data: StoreData) => {
      if (!mounted) return;
      setStore(data);
      setIsLoading(false);
    });

    const handlePipelineSync = () => {
      setStore(getPersistentStoreData(storeId));
    };
    window.addEventListener('eveo:pipeline-updated', handlePipelineSync);
    return () => {
      mounted = false;
      window.removeEventListener('eveo:pipeline-updated', handlePipelineSync);
    };
  }, [storeId]);

  const firstLead = store?.leads?.[0]?.name || 'Sarah Connor';
  const firstLeadVehicle = store?.leads?.[0]?.vehicle || '2024 Tesla Model 3';
  const firstPending = store?.pending?.[0]?.name || 'Cody Fisher';
  const firstPendingVehicle = store?.pending?.[0]?.vehicle || '2023 Tesla Model Y';
  const firstHandoffVehicle = store?.handoffs?.[0]?.vehicle || '2024 Kia Telluride';
  const firstSalesRep =
    store?.staff?.find((s) => s.role === 'sales')?.name || 'Sarah J.';

  // Cross-reference database to resolve exact user identity & role-tailored FAQs
  const activeUser = useMemo<ResolvedInsightUser>(() => {
    const normalizedRole = String(effectiveRole).toLowerCase();

    if (normalizedRole === 'bdc') {
      const bdcUser =
        EVEO_GLOBAL_TEAM.find(
          (u) => u.role === 'bdc' && (!u.assignedStoreIds || u.assignedStoreIds.includes(storeId))
        ) || EVEO_GLOBAL_TEAM[0];
      const firstName = bdcUser.name.split(' ')[0];
      return {
        fullName: bdcUser.name,
        firstName,
        role: 'bdc',
        roleBadge: 'EVEO BDC Specialist',
        greetingText: `Hey ${firstName}. I can help you verify inventory, prioritize unconfirmed appointments, and prepare customer follow-ups. Ask me to inspect a vehicle, review a lead, or draft a response.`,
        inputPlaceholder: `Ask E.V.E. about stock availability, what to tell ${firstLead}, or to draft an SMS/email...`,
        faqs: [
          `Is the ${firstLeadVehicle} available on the lot right now?`,
          `What should I tell ${firstLead} if they ask for our best out-the-door price?`,
          `Draft a warm confirmation SMS for today's unconfirmed appointments.`,
        ],
      };
    }

    if (normalizedRole === 'sales') {
      const salesUser =
        store?.staff?.find((s) => s.role === 'sales') || store?.staff?.[0];
      const fullName = salesUser?.name || 'Sarah J.';
      const firstName = fullName.split(' ')[0];
      return {
        fullName,
        firstName,
        role: 'sales',
        roleBadge: 'Showroom Sales Specialist',
        greetingText: `Hey ${firstName}. I can help review the currently loaded pending-deal and appointment queues, compare available inventory, and prepare deal-desk questions. What should we look at first?`,
        inputPlaceholder: `Ask E.V.E. to desk a deal, check inventory specs, or follow up on ${firstPending}...`,
        faqs: [
          `Help me desk a payment & trade-in structure on the ${firstPendingVehicle}.`,
          `Which comparable SUVs do we have ready for immediate delivery today?`,
          `What is holding up ${firstPending}'s pending deal in F&I?`,
        ],
      };
    }

    if (normalizedRole === 'manager') {
      const mgrUser = store?.staff?.find((s) => s.role === 'manager');
      const fullName = mgrUser?.name || 'David G.';
      const firstName = fullName.split(' ')[0];
      return {
        fullName,
        firstName,
        role: 'manager',
        roleBadge: 'Floor & Desk Manager',
        greetingText: `Hey ${firstName}. I can help you investigate showroom handoffs, review BDC-to-floor pacing, and identify which SLA questions need attention. Where should we start?`,
        inputPlaceholder: `Ask E.V.E. about floor SLAs, rep KPI pacing, or marketing outreach performance...`,
        faqs: [
          `Audit today's showroom SLA wait times and rep response speed.`,
          `Why is ${firstSalesRep} pacing behind monthly show-to-close target?`,
          `How is our multi-channel outreach converting into confirmed appointments today?`,
        ],
      };
    }

    if (normalizedRole === 'owner') {
      const ownerUser = EVEO_GLOBAL_TEAM.find((u) => u.role === 'owner');
      const fullName = ownerUser?.name || 'Richard Hammond';
      const firstName = fullName.split(' ')[0];
      return {
        fullName,
        firstName,
        role: 'owner',
        roleBadge: 'Dealership Principal / Owner',
        greetingText: `Hey ${firstName}. I can help assemble an executive review of gross, lead-source performance, and staffing capacity. Those analyses will become evidence-backed once the corresponding server data sources are connected.`,
        inputPlaceholder: `Ask E.V.E. about store profitability, lead spend ROI, or staffing capacity...`,
        faqs: [
          `How much front and back gross have we generated this month vs. target?`,
          `How much are we spending on leads vs. how many are actually converting to deliveries?`,
          `Is our current floor and BDC headcount sufficient for our monthly lead volume?`,
        ],
      };
    }

    // Default: Super Admin (Andres)
    const firstName = CURRENT_USER.split(' ')[0];
    return {
      fullName: CURRENT_USER,
      firstName,
      role: 'super_admin',
      roleBadge: 'Super Admin',
      greetingText: `Hey ${firstName}. I can help you examine EVEO-wide BDC capacity, store SLA health, and cross-store conversion. Start with a recommended audit or ask me anything. This preview currently uses local development data.`,
      inputPlaceholder: `Ask E.V.E. to audit cross-store BDC capacity, SLA discrepancies, or pipeline health...`,
      faqs: [
        `Compare today's BDC contact-to-appointment ratio against 8-hour shift capacity.`,
        `Audit showroom SLA wait times across active floor handoffs.`,
        `Draft an executive summary of today's pipeline velocity.`,
      ],
    };
  }, [
    effectiveRole,
    storeId,
    firstLead,
    firstLeadVehicle,
    firstPending,
    firstPendingVehicle,
    firstSalesRep,
    store.staff,
  ]);

  // Role-Tailored Hub-Style Insight Cards (4 distinct cards per role)
  const cards = useMemo<InsightCardSchema[]>(() => {
    const r = activeUser.role;

    if (r === 'bdc') {
      return [
        {
          id: `bdc-inv-${storeId}`,
          storeId,
          category: 'inventory',
          title: 'Lot Availability',
          metricValue: '109',
          metricSublabel: 'Units Ready for Sale',
          metricBadge: '109 Ready',
          summary: `${firstLeadVehicle} and 108 frontline units are inspected and ready for same-day test drives.`,
          promptTemplate: `Check lot availability and key talking points for the ${firstLeadVehicle} for ${firstLead}.`,
          actionLabel: 'Prepare lot sheet preview',
          hasWarningPoint: false,
          actionPayload: {
            type: 'sms_campaign',
            targetCount: 1,
            draftMessage: `Hi ${firstLead}, I just confirmed the ${firstLeadVehicle} is clean, pulled up front, and ready for your visit. Does 2:00 PM or 4:30 PM work better for you today?`,
          },
        },
        {
          id: `bdc-rebuttal-${storeId}`,
          storeId,
          category: 'churn',
          title: 'Customer Rebuttals',
          metricValue: `${store.leads.length}`,
          metricSublabel: 'Price & Trade Inquiries',
          metricBadge: `${store.leads.length} Active`,
          summary: `${firstLead} asked for internet pricing and trade-in range before booking an appointment.`,
          promptTemplate: `Give me the best BDC rebuttal to pivot ${firstLead} from a price-only question into a showroom appraisal appointment.`,
          actionLabel: 'Review BDC pivot script',
          hasWarningPoint: false,
          actionPayload: {
            type: 'sms_campaign',
            targetCount: 1,
            draftMessage: `Hi ${firstLead}, because trade values can swing by $1,500+ in person, our desk manager authorized an extra trade-in bonus if we can inspect your vehicle for 15 mins today.`,
          },
        },
        {
          id: `bdc-draft-${storeId}`,
          storeId,
          category: 'sla',
          title: 'Confirmations',
          metricValue: `${store.appointments.length}`,
          metricSublabel: 'Appts Needing Confirm',
          metricBadge: `${store.appointments.length} Appts`,
          summary: `${store.appointments.length} scheduled visits today need SMS/call confirmation to lock in 100% daily KPI.`,
          promptTemplate: `Draft a high-response confirmation SMS and email sequence for today's ${store.appointments.length} appointments.`,
          actionLabel: 'Prepare confirmation SMS',
          hasWarningPoint: true,
          actionPayload: {
            type: 'sms_campaign',
            targetCount: store.appointments.length,
            draftMessage: `Hi! Confirming your VIP appointment today. Your vehicle is pulled up front—reply YES to confirm your arrival time.`,
          },
        },
        {
          id: `bdc-pacing-${storeId}`,
          storeId,
          category: 'staff',
          title: 'Daily Call KPI',
          metricValue: '96%',
          metricSublabel: 'Goal: 100 Outbound',
          metricBadge: '96% KPI',
          summary: `You are 4 outbound touches away from hitting 100% daily BDC pacing with zero missed SLA alerts.`,
          promptTemplate: `Show me the 4 highest-priority leads to call right now to hit 100% daily KPI.`,
          actionLabel: 'Review call priorities',
          hasWarningPoint: false,
          actionPayload: {
            type: 'crm_flag',
            targetCount: 4,
          },
        },
      ];
    }

    if (r === 'sales') {
      return [
        {
          id: `sales-desk-${storeId}`,
          storeId,
          category: 'churn',
          title: 'Deal Desking',
          metricValue: `${store.pending.length}`,
          metricSublabel: 'Active Pencil / Quotes',
          metricBadge: `${store.pending.length} Desked`,
          summary: `${firstPending} is comparing 60 vs 72-month payment options on the ${firstPendingVehicle} with $3,500 down.`,
          promptTemplate: `Help me structure a pencil on the ${firstPendingVehicle} for ${firstPending} that protects front-end gross while hitting their monthly payment goal.`,
          actionLabel: 'Prepare payment pencil preview',
          hasWarningPoint: false,
          actionPayload: {
            type: 'crm_flag',
            targetCount: 1,
          },
        },
        {
          id: `sales-inv-${storeId}`,
          storeId,
          category: 'inventory',
          title: 'Stock Switcher',
          metricValue: '8',
          metricSublabel: 'High-Margin Matches',
          metricBadge: '8 Units',
          summary: `8 frontline units match your active showroom buyers with higher front-end gross and lower days-in-stock.`,
          promptTemplate: `Show me the best alternative units in stock to switch a payment-sensitive buyer onto today.`,
          actionLabel: 'Review comparable inventory',
          hasWarningPoint: false,
          actionPayload: {
            type: 'crm_flag',
            targetCount: 8,
          },
        },
        {
          id: `sales-pending-${storeId}`,
          storeId,
          category: 'sla',
          title: 'Pending F&I',
          metricValue: `${store.pending.length}`,
          metricSublabel: 'Awaiting Stips / Delivery',
          metricBadge: `${store.pending.length} Pending`,
          summary: `${firstPending} (${firstPendingVehicle}) only needs proof of insurance and final F&I sign-off to deliver today.`,
          promptTemplate: `Draft a quick text to ${firstPending} to collect their insurance binder so we can deliver the ${firstPendingVehicle} today.`,
          actionLabel: 'Prepare buyer-stip checklist',
          hasWarningPoint: true,
          actionPayload: {
            type: 'sms_campaign',
            targetCount: store.pending.length,
          },
        },
        {
          id: `sales-ups-${storeId}`,
          storeId,
          category: 'staff',
          title: 'Showroom Ups',
          metricValue: `${store.handoffs.length}`,
          metricSublabel: 'Lobby Queue (<4m SLA)',
          metricBadge: `${store.handoffs.length} Waiting`,
          summary: `${store.handoffs.length} customers are in the showroom lobby right now. Claim within 4 minutes to keep exclusivity.`,
          promptTemplate: `Brief me on the ${store.handoffs.length} customers waiting in the showroom lobby and their trade-in notes.`,
          actionLabel: 'Prepare showroom handoff notes',
          hasWarningPoint: true,
          actionPayload: {
            type: 'crm_flag',
            targetCount: store.handoffs.length,
          },
        },
      ];
    }

    if (r === 'owner') {
      return [
        {
          id: `own-gross-${storeId}`,
          storeId,
          category: 'inventory',
          title: 'Store Revenue',
          metricValue: '$68.4k',
          metricSublabel: 'MTD Front + Back Gross',
          metricBadge: '+18% MoM',
          summary: `Delivered ${store.sold.length} finalized deals in current batch with $3,120 average combined gross per unit.`,
          promptTemplate: `Give me an executive breakdown of our store's MTD gross profit, unit pacing, and F&I reserve performance.`,
          actionLabel: 'Prepare gross-performance review',
          hasWarningPoint: false,
          actionPayload: {
            type: 'crm_flag',
            targetCount: store.sold.length,
          },
        },
        {
          id: `own-roi-${storeId}`,
          storeId,
          category: 'churn',
          title: 'Lead Spend ROI',
          metricValue: '3.8x',
          metricSublabel: 'Ad Spend to Sold Gross',
          metricBadge: '2.5% Close',
          summary: `Spending $14,200/mo across Meta, CarGurus & AutoTrader; Walk-in QR and Instagram DM yield the lowest cost-per-sale.`,
          promptTemplate: `Compare our monthly marketing spend per lead source against actual delivered deals and recommend budget reallocations.`,
          actionLabel: 'Review advertising spend',
          hasWarningPoint: true,
          actionPayload: {
            type: 'crm_flag',
            targetCount: 4,
          },
        },
        {
          id: `own-staff-${storeId}`,
          storeId,
          category: 'staff',
          title: 'Staff Sufficiency',
          metricValue: `${store.staff.length}`,
          metricSublabel: 'Active Floor Headcount',
          metricBadge: '92% Utilized',
          summary: `Current team of ${store.staff.length} floor staff + EVEO BDC covers 900+ monthly leads; 2PM–5PM Saturday needs 1 extra closer.`,
          promptTemplate: `Evaluate whether our current sales and BDC headcount is sufficient for our lead volume or if we need roster changes.`,
          actionLabel: 'Review staffing model',
          hasWarningPoint: true,
          actionPayload: {
            type: 'schedule_adjust',
            targetCount: store.staff.length,
          },
        },
        {
          id: `own-turn-${storeId}`,
          storeId,
          category: 'sla',
          title: 'Inventory Turn',
          metricValue: '21%',
          metricSublabel: '23 Sold / 109 In Stock',
          metricBadge: '21% Turn',
          summary: `21% inventory-to-delivery ratio across 109 ready-for-sale units; 6 units over 60 days old need price action.`,
          promptTemplate: `Identify the aging units holding back our inventory turn rate and recommend a liquidation strategy.`,
          actionLabel: 'Review aging inventory',
          hasWarningPoint: true,
          actionPayload: {
            type: 'crm_flag',
            targetCount: 6,
          },
        },
      ];
    }

    // Manager & Super Admin Cards (SLAs, KPI Pacing, Outreach Velocity, Matchmaker)
    return [
      {
        id: `mgr-sla-${storeId}`,
        storeId,
        category: 'sla',
        title: 'SLA Compliance',
        metricValue: `${store.handoffs.length}`,
        metricSublabel: 'Active Floor Timers (<4m)',
        metricBadge: `${store.handoffs.length} Handoffs`,
        summary: `Showroom lobby has ${store.handoffs.length} active handoffs. Enforcing the 4-minute claim clock protects show-to-close ratio.`,
        promptTemplate: `Audit showroom SLA wait times and identify any rep breaches today.`,
        actionLabel: 'Prepare floor SLA audit',
        hasWarningPoint: true,
        actionPayload: {
          type: 'crm_flag',
          targetCount: Math.max(1, store.handoffs.length),
        },
      },
      {
        id: `mgr-kpi-${storeId}`,
        storeId,
        category: 'staff',
        title: 'KPI & Shift Pacing',
        metricValue: '10%',
        metricSublabel: 'Live Contact → Appt Rate',
        metricBadge: '50 Contacts',
        summary: `Out of 214 dials today, 50 leads answered (23% contact) and 5 booked appointments (1-in-10 live conversion).`,
        promptTemplate: `Analyze today's 214 calls, 50 live contacts, and 5 appointments against 8-hour shift physics and recommend how to increase appointments without burning out reps.`,
        actionLabel: 'Review KPI pacing',
        hasWarningPoint: true,
        actionPayload: {
          type: 'schedule_adjust',
          targetCount: 5,
        },
      },
      {
        id: `mgr-outreach-${storeId}`,
        storeId,
        category: 'churn',
        title: 'Outreach Velocity',
        metricValue: `${store.leads.length}`,
        metricSublabel: 'High-Intent Pipeline',
        metricBadge: `${store.leads.length} Leads`,
        summary: `${firstLead} and active buyers are in the 48-hour follow-up window; video walkarounds lift response rate by 34%.`,
        promptTemplate: `Review our outbound SMS/email outreach velocity and launch a walkaround campaign for ${firstLead}.`,
        actionLabel: 'Prepare outreach campaign',
        hasWarningPoint: false,
        actionPayload: {
          type: 'sms_campaign',
          targetCount: Math.max(1, store.leads.length),
        },
      },
      {
        id: `mgr-match-${storeId}`,
        storeId,
        category: 'inventory',
        title: 'Aged Matchmaker',
        metricValue: '8',
        metricSublabel: 'Archived Lead Matches',
        metricBadge: '8 Matches',
        summary: `Cross-referenced 60+ day inventory (${firstHandoffVehicle}) with 90-day archived CRM leads to surface 8 warm buyers.`,
        promptTemplate: `Show me the 8 archived leads matched to our aging ${firstHandoffVehicle} stock and assign them to the floor.`,
        actionLabel: 'Review suggested lead matches',
        hasWarningPoint: false,
        actionPayload: {
          type: 'sms_campaign',
          targetCount: 8,
        },
      },
    ];
  }, [
    activeUser.role,
    storeId,
    firstLead,
    firstLeadVehicle,
    firstPending,
    firstPendingVehicle,
    firstHandoffVehicle,
    store.leads.length,
    store.appointments.length,
    store.pending.length,
    store.handoffs.length,
    store.sold.length,
    store.staff.length,
  ]);

  const hubDigest = useMemo<HubMascotDigest>(() => {
    const title = `Hey ${activeUser.firstName} • ${store.leads.length} Active Leads`;
    const body = activeUser.greetingText;
    return {
      mood: store.handoffs.length > 0 ? 'alert' : 'happy',
      title,
      body,
      speechTitle: title,
      speechBody: body,
      hasMajorChanges: store.handoffs.length > 0 || store.leads.length > 0,
      bulletActions: [
        { label: activeUser.faqs[0], route: '/app/insights' },
        { label: activeUser.faqs[1], route: '/app/insights' },
      ],
    };
  }, [activeUser, store.leads.length, store.handoffs.length]);

  const threadStorageKey = `${INSIGHTS_THREAD_PREFIX}${storeId}_${activeUser.role}`;

  const [messages, setMessages] = useState<InsightChatMessage[]>(() =>
    readInsightThread(threadStorageKey)
  );

  useEffect(() => {
    setMessages(readInsightThread(threadStorageKey));
  }, [threadStorageKey]);

  const saveThread = useCallback(
    (nextMessages: InsightChatMessage[]) => {
      setMessages(nextMessages);
      try {
        localStorage.setItem(threadStorageKey, JSON.stringify(nextMessages));
      } catch {
        // Ignore storage lock
      }
    },
    [threadStorageKey]
  );

  const sendPrompt = useCallback(
    async (promptText: string, matchedCard?: InsightCardSchema) => {
      const trimmed = promptText.trim();
      if (!trimmed) return;

      const userMsg: InsightChatMessage = {
        id: `usr_${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: 'Just now',
      };

      const optimistic = [...messages, userMsg];
      saveThread(optimistic);
      setIsLoading(true);

      try {
        const replyCard = matchedCard;
        const response = await eveoAgent.respond({
          prompt: trimmed,
          storeId,
          user: { name: activeUser.fullName, role: activeUser.roleBadge },
          selectedInsight: replyCard
            ? {
                title: replyCard.title,
                summary: replyCard.summary,
                draftMessage: replyCard.actionPayload.draftMessage,
                actionLabel: replyCard.actionLabel,
                targetCount: replyCard.actionPayload.targetCount,
              }
            : undefined,
        });

        const aiMsg: InsightChatMessage = {
          id: `ai_${Date.now() + 1}`,
          role: 'assistant',
          content: response.content,
          timestamp: 'Just now',
          draftSnippet: response.draftSnippet,
          actionLabel: response.actionLabel,
          actionReviewed: false,
          mode: response.mode,
        };

        saveThread([...optimistic, aiMsg]);
      } catch {
        const errorMsg: InsightChatMessage = {
          id: `ai_${Date.now() + 1}`,
          role: 'assistant',
          content: 'I could not prepare that preview. No dealership data was changed and no external action was performed. Please try again.',
          timestamp: 'Just now',
          mode: 'preview',
        };
        saveThread([...optimistic, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, saveThread, activeUser.fullName, activeUser.roleBadge, storeId]
  );

  const markPreviewReviewed = useCallback(
    async (messageId: string) => {
      const targetMsg = messages.find((m) => m.id === messageId);
      const updated = messages.map((m) =>
        m.id === messageId ? { ...m, actionReviewed: true } : m
      );
      saveThread(updated);

      if (targetMsg) {
        await publishLiveActivityAsync(storeId, {
          agentName: 'E.V.E.',
          isAiAgent: true,
          priority: 1,
          category: 'ai_high_intent',
          title: `Draft reviewed • ${targetMsg.actionLabel || 'E.V.E. suggestion'}`,
          detail: `Client preview only. No SMS, email, CRM record, appointment, or inventory operation was executed.\n\n${targetMsg.draftSnippet || targetMsg.content}`,
          route: '/app/insights',
        });
      }
    },
    [messages, saveThread, storeId]
  );

  const clearThread = useCallback(() => {
    saveThread([]);
  }, [saveThread]);

  return {
    activeUser,
    cards,
    hubDigest,
    messages,
    isLoading,
    sendPrompt,
    markPreviewReviewed,
    clearThread,
  };
}