import { getStoreDailyReports } from '../../data/stores';
import { getPersistentStoreData, listLiveFeed } from '../liveActivity/liveActivityStore';
import { listDemoAppointments } from '../../utils/appointmentManager';
import { getStoreInventory } from '../inventory/storeInventorySync';

const makePattern = /\b(?:acura|audi|bmw|buick|cadillac|chevrolet|chevy|chrysler|dodge|ford|genesis|gmc|honda|hyundai|infiniti|jaguar|jeep|kia|lexus|lincoln|mazda|mercedes|mitsubishi|nissan|porsche|ram|subaru|tesla|toyota|volkswagen|volvo)(?=\b|\d)/i;
const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

export function answerDemoInsight(storeId: string, prompt: string): string {
  const query = prompt.trim().toLowerCase();
  const data = getPersistentStoreData(storeId);
  if (/\b(report|reports)\b/.test(query)) {
    const report = getStoreDailyReports(storeId)[0];
    return report ? `Latest demo report (${report.displayDate}): ${report.leadsMtd} leads, ${report.appointmentsMtd} appointments, and ${report.carsDelivered} vehicles delivered month to date.` : 'This store has no report snapshots yet.';
  }
  if (makePattern.test(query) || /\b(inventory|vehicles?|cars?|vin|stock)\b/.test(query)) {
    const units = getStoreInventory(storeId).units;
    if (!units.length) return 'This store has no inventory yet. Open Inventory in the workspace menu to add vehicles, then try the search again.';
    const make = makePattern.exec(query);
    const term = make ? query.slice(make.index).replace(/\s+(?:in|at|on|for|available|please|under|with)\b.*$/, '')
      : query.match(/\b(?:vin|stock(?: number)?)\s*[:#]?\s*([a-z0-9-]+\d[a-z0-9-]*)\b/)?.[1] ?? '';
    const needle = normalize(term);
    const matches = needle ? units.filter((unit) => normalize(unit.vehicle).includes(needle) || normalize(unit.vin).includes(needle)) : units;
    if (!matches.length) return `I found no inventory matches for ${term}.`;
    return `${matches.length} ${matches.length === 1 ? 'vehicle' : 'vehicles'} in demo inventory:\n${matches.slice(0, 10).map((unit) => `• ${unit.vehicle} · $${unit.price.toLocaleString()} · ${unit.status.replaceAll('_', ' ').toLowerCase()}`).join('\n')}`;
  }
  if (/\b(kpis?|agents?|team|staff)\b/.test(query)) {
    return data.staff.length ? `Demo team KPIs:\n${data.staff.slice(0, 8).map((member) => `• ${member.name} (${member.role}) · target ${member.kpiTarget ?? 'not set'}`).join('\n')}` : 'This store has no team KPI records yet.';
  }
  if (/\b(activities|activity)\b/.test(query)) {
    const activity = listLiveFeed(storeId).slice(0, 5);
    return activity.length ? `Recent demo activity:\n${activity.map((item) => `• ${item.title} · ${item.agentName}`).join('\n')}` : 'This store has no recent activity yet.';
  }
  if (/\b(leads?|appointments?|pipeline|schedule)\b/.test(query)) {
    return `This demo store has ${data.leads.length} leads and ${listDemoAppointments(storeId).length} appointments.`;
  }
  return 'I can look up vehicles, reports, appointment and lead counts, team KPIs, and recent activity in this demo workspace.';
}
