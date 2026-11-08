// src/pages/Admin/AdminPortal.tsx
import { useEffect, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Users, Settings, Copy, ExternalLink, LoaderCircle, UserPlus } from 'lucide-react';
import { ApiError, apiRequest, type ApiEmployeeRole, type ApiTeamMember, type ApiUserInvitation } from '../../services/apiClient';
import { teamRepository } from '../../services/team/teamRepository';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';

import StoreRegistryManager from '../../components/Admin/StoreRegistryManager';
import IntegrationConnectionsPanel from '../../components/Admin/IntegrationConnectionsPanel';

type Tab = 'billing' | 'team' | 'settings';

export default function AdminPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const { registeredStores, activeStoreId } = useStoreAppearance();
  const [teamStoreId, setTeamStoreId] = useState('');
  const [teamMembers, setTeamMembers] = useState<ApiTeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<ApiUserInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ApiEmployeeRole>('sales');
  const [assignedStoreIds, setAssignedStoreIds] = useState<string[]>([]);
  const [inviteLink, setInviteLink] = useState('');
  const [teamError, setTeamError] = useState('');
  const [teamFeedback, setTeamFeedback] = useState('');
  const [teamBusy, setTeamBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const [account, setAccount] = useState<{ businessName: string; subscriptionStatus: 'pending_payment' | 'trial' | 'active' | 'past_due' | 'cancelled'; trialEndsAt?: string | null } | null>(null);
  const [billingError, setBillingError] = useState('');

  useEffect(() => {
    if (!teamStoreId && registeredStores[0]) {
      setTeamStoreId(registeredStores[0].id);
      setAssignedStoreIds([registeredStores[0].id]);
    }
  }, [teamStoreId, registeredStores]);

  useEffect(() => {
    let active = true;
    apiRequest<{ businessName: string; subscriptionStatus: 'pending_payment' | 'trial' | 'active' | 'past_due' | 'cancelled'; trialEndsAt?: string | null }>('/account/onboarding')
      .then((result) => { if (active) setAccount(result); })
      .catch((cause) => { if (active) setBillingError(cause instanceof ApiError ? cause.message : 'Membership status could not be loaded.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!teamStoreId) return;
    let active = true;
    setTeamBusy(true);
    setTeamError('');
    Promise.all([teamRepository.listMembers(teamStoreId), teamRepository.listInvitations(teamStoreId)])
      .then(([members, invitations]) => {
        if (!active) return;
        setTeamMembers(members);
        setPendingInvitations(invitations);
      })
      .catch((cause) => {
        if (active) setTeamError(cause instanceof ApiError ? cause.message : 'Could not load dealership users.');
      })
      .finally(() => { if (active) setTeamBusy(false); });
    return () => { active = false; };
  }, [teamStoreId]);

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTeamError('');
    setTeamFeedback('');
    if (assignedStoreIds.length === 0) {
      setTeamError('Assign the employee to at least one store.');
      return;
    }
    setTeamBusy(true);
    try {
      const invitation = await teamRepository.invite({ email: inviteEmail.trim(), role: inviteRole, storeIds: assignedStoreIds });
      setInviteLink(`${window.location.origin}/invite?token=${encodeURIComponent(invitation.token || '')}`);
      setTeamFeedback(`Invitation created for ${invitation.email}. It expires ${new Date(invitation.expiresAt).toLocaleDateString()}.`);
      setInviteEmail('');
      const [members, invitations] = await Promise.all([teamRepository.listMembers(teamStoreId), teamRepository.listInvitations(teamStoreId)]);
      setTeamMembers(members);
      setPendingInvitations(invitations);
    } catch (cause) {
      setTeamError(cause instanceof ApiError ? cause.message : 'Could not create the invitation.');
    } finally {
      setTeamBusy(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setTeamError('Clipboard access was blocked. Select and copy the invitation link.');
    }
  };

  const handleRevokeInvite = async (invitation: ApiUserInvitation) => {
    setTeamError('');
    setTeamFeedback('');
    try {
      await teamRepository.revokeInvitation(invitation.id);
      setPendingInvitations((current) => current.filter((item) => item.id !== invitation.id));
      setTeamFeedback(`Invitation for ${invitation.email} was revoked.`);
    } catch (cause) {
      setTeamError(cause instanceof ApiError ? cause.message : 'Could not revoke this invitation.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#05080c] text-white pt-24 sm:pt-28 pb-16 px-4 sm:px-6 overflow-x-hidden">

      {/* Page Header */}
      <div className="max-w-5xl mx-auto mb-6 sm:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 block mb-1">
            Master Control
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">Store Administration</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-1 font-medium">Manage store details, team access, and membership status.</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/hub')}
            className="min-h-11 px-4 sm:px-5 py-2.5 bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 group outline-none cursor-pointer"
          >
            <span>Workspace</span>
            <ExternalLink size={15} className="text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">

        {/* Sidebar Navigation */}
        <div className="md:col-span-1 grid grid-cols-3 md:flex md:flex-col gap-1.5 md:gap-2 p-1.5 md:p-0 rounded-2xl bg-[#0a0f16] md:bg-transparent border border-white/10 md:border-transparent h-fit">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 md:px-4 py-2.5 md:py-3 rounded-xl font-bold transition-all text-xs md:text-sm outline-none cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#0a0f16] text-white border border-orange-500/35 shadow-lg'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Settings size={17} className={activeTab === 'settings' ? 'text-orange-500 shrink-0' : 'shrink-0'} />
            <span>Store Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 md:px-4 py-2.5 md:py-3 rounded-xl font-bold transition-all text-xs md:text-sm outline-none cursor-pointer ${
              activeTab === 'team'
                ? 'bg-[#0a0f16] text-white border border-orange-500/35 shadow-lg'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Users size={17} className={activeTab === 'team' ? 'text-orange-500 shrink-0' : 'shrink-0'} />
            <span>Team</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 md:px-4 py-2.5 md:py-3 rounded-xl font-bold transition-all text-xs md:text-sm outline-none cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-[#0a0f16] text-white border border-orange-500/35 shadow-lg'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <CreditCard size={17} className={activeTab === 'billing' ? 'text-orange-500 shrink-0' : 'shrink-0'} />
            <span>Billing</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 min-w-0">
          <AnimatePresence mode="wait">

            {/* --- TAB: BILLING OVERVIEW --- */}
            {activeTab === 'billing' && (
              <motion.div key="billing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="p-5 sm:p-6 rounded-2xl bg-[#0a0f16] border border-white/10 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Current Subscription</span>
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-6 border-b border-white/10 mb-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">{account ? ({ pending_payment: 'Membership not activated', trial: 'Trial active', active: 'Membership active', past_due: 'Payment needs attention', cancelled: 'Membership cancelled' } as const)[account.subscriptionStatus] : 'Checking membership'}</h2>
                      <p className="text-xs sm:text-sm text-orange-400 font-medium">{account?.subscriptionStatus === 'trial' && account.trialEndsAt ? `Trial ends ${new Date(account.trialEndsAt).toLocaleDateString()}` : account?.subscriptionStatus === 'pending_payment' ? 'No payment method or workspace trial was started.' : account?.subscriptionStatus === 'active' ? 'Your membership is active.' : account?.subscriptionStatus === 'past_due' ? 'Update billing through secure membership support.' : account?.subscriptionStatus === 'cancelled' ? 'This account has no active membership.' : 'Membership status loads from your dealership account.'}</p>
                    </div>
                    {billingError && <p role="alert" className="text-xs text-red-400">{billingError}</p>}
                  </div>
                  <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs leading-relaxed text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">Dealership applications do not start a trial or collect payment. Secure checkout and membership activation are not connected in this deployment yet.</p>
                </div>
              </motion.div>
            )}

            {/* --- TAB: TEAM MANAGEMENT --- */}
            {activeTab === 'team' && (
              <motion.div key="team" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <section className="rounded-2xl border border-white/10 bg-[#0a0f16] p-5 shadow-lg sm:p-6">
                  <div className="mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Employee onboarding</span>
                    <h3 className="mt-1 text-base font-bold text-white sm:text-lg">Invite a dealership employee</h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-400">Invitations are single-use, expire after seven days, and only grant access to the selected stores. Email delivery is not configured yet; share the generated link through an approved channel.</p>
                  </div>
                  <form onSubmit={(event) => void handleInvite(event)} className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="employee-email" className="mb-1.5 ml-1 block text-xs font-semibold text-gray-400">Work email</label>
                      <input id="employee-email" type="email" required value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} className="min-h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-orange-500" />
                    </div>
                    <div>
                      <label htmlFor="employee-role" className="mb-1.5 ml-1 block text-xs font-semibold text-gray-400">Role</label>
                      <select id="employee-role" value={inviteRole} onChange={(event) => setInviteRole(event.target.value as ApiEmployeeRole)} className="min-h-11 w-full rounded-xl border border-white/10 bg-[#111821] px-3.5 py-2.5 text-sm text-white outline-none focus:border-orange-500">
                        <option value="manager">Manager</option>
                        <option value="bdc">BDC</option>
                        <option value="sales">Sales</option>
                      </select>
                    </div>
                    <fieldset className="space-y-2 sm:col-span-2">
                      <legend className="mb-1 ml-1 text-xs font-semibold text-gray-400">Store access</legend>
                      {registeredStores.length === 0 ? <p className="text-xs text-gray-500">Add a store before inviting employees.</p> : registeredStores.map((store) => (
                        <label key={store.id} className="flex min-h-10 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-gray-300">
                          <input type="checkbox" checked={assignedStoreIds.includes(store.id)} onChange={(event) => setAssignedStoreIds((current) => event.target.checked ? [...new Set([...current, store.id])] : current.filter((id) => id !== store.id))} className="accent-orange-500" />
                          <span>{store.name} <span className="text-[10px] uppercase tracking-widest text-gray-500">{store.code}</span></span>
                        </label>
                      ))}
                    </fieldset>
                    {(teamError || teamFeedback) && <p role={teamError ? 'alert' : 'status'} className={`text-xs sm:col-span-2 ${teamError ? 'text-red-400' : 'text-emerald-400'}`}>{teamError || teamFeedback}</p>}
                    <button type="submit" disabled={teamBusy || registeredStores.length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60 sm:col-span-2 sm:justify-self-start">
                      {teamBusy ? <LoaderCircle size={15} className="animate-spin" /> : <UserPlus size={15} />}{teamBusy ? 'Working…' : 'Create invitation'}
                    </button>
                  </form>
                  {inviteLink && (
                    <div className="mt-5 space-y-3 rounded-xl border border-orange-500/25 bg-orange-500/5 p-4">
                      <p className="text-xs font-semibold text-orange-300">Copy this one-time invitation link. The raw token will not be shown again after leaving this page.</p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input aria-label="Invitation link" readOnly value={inviteLink} className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-gray-300" />
                        <button type="button" onClick={() => void handleCopyInvite()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-xs font-bold text-white"><Copy size={14} />{copied ? 'Copied' : 'Copy link'}</button>
                      </div>
                    </div>
                  )}
                </section>

                <div className="rounded-2xl border border-white/10 bg-[#0a0f16] p-5 shadow-lg sm:p-6">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Team members</h3>
                      <p className="mt-1 text-xs text-gray-500">Users with access to the selected store.</p>
                    </div>
                    <label className="text-xs text-gray-400">Store
                      <select value={teamStoreId} onChange={(event) => setTeamStoreId(event.target.value)} className="ml-2 min-h-10 rounded-lg border border-white/10 bg-[#111821] px-3 text-xs text-white">
                        {registeredStores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
                      </select>
                    </label>
                  </div>
                  {teamBusy && teamMembers.length === 0 ? <p className="flex items-center gap-2 py-5 text-xs text-gray-400"><LoaderCircle size={14} className="animate-spin" /> Loading team…</p> : teamMembers.length === 0 ? <p className="py-5 text-xs text-gray-500">No active team members were found for this store.</p> : (
                    <div className="divide-y divide-white/5">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white">{member.name}</p>
                            <p className="mt-1 truncate text-xs text-gray-400">{member.email}</p>
                          </div>
                          <span className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${member.role === 'owner' ? 'bg-orange-500/10 text-orange-400' : 'bg-white/5 text-gray-300'}`}>{member.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {pendingInvitations.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-[#0a0f16] p-5 shadow-lg sm:p-6">
                    <h3 className="mb-3 text-sm font-bold text-white">Pending invitations</h3>
                    <div className="divide-y divide-white/5">
                      {pendingInvitations.map((invitation) => (
                        <div key={invitation.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                          <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{invitation.email}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">{invitation.role} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</p></div>
                          <button type="button" onClick={() => void handleRevokeInvite(invitation)} className="min-h-10 rounded-lg border border-red-500/20 px-3 text-xs font-bold text-red-300 transition hover:bg-red-500/10">Revoke</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* --- TAB: STORE PROFILE --- */}
            {activeTab === 'settings' && (
              <>
                <StoreRegistryManager />
                <IntegrationConnectionsPanel storeId={activeStoreId} />
              </>
            )}

          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
