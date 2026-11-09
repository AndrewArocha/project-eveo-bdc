import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { InventoryVehicle } from '../models/InventoryVehicle.js';
import { Store } from '../models/Store.js';
import { AppError } from '../utils/AppError.js';
import { recordActivityEventSafely } from './activityEventService.js';

const MAX_PAGE_BYTES = 2_000_000;
const MAX_PAGES = 6;
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{11,17}$/i;
const VEHICLE_TYPES = /vehicle|automobile|car|product/i;

interface ParsedVehicle {
  vin: string;
  stockNumber: string;
  vehicle: string;
  make: string;
  model: string;
  trim: string;
  modelYear: number | null;
  mileage: number | null;
  price: number;
  condition: 'NEW' | 'USED' | 'CERTIFIED_PRE_OWNED';
  photos: string[];
}

function isPrivateIpv4(value: string) {
  const parts = value.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || b === 2)) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) || (a === 203 && b === 0);
}

function isPublicIp(address: string) {
  const version = isIP(address);
  if (version === 4) return !isPrivateIpv4(address);
  if (version !== 6) return false;
  const ip = address.toLowerCase();
  if (ip === '::' || ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || /^fe[89ab]/.test(ip)) return false;
  if (ip.startsWith('::ffff:')) return isPublicIp(ip.slice(7));
  return true;
}

async function assertPublicHttpsUrl(target: URL) {
  if (target.protocol !== 'https:' || target.username || target.password || (target.port && target.port !== '443')) {
    throw new AppError(422, 'Website inventory sync requires a public HTTPS dealership website.', 'INVENTORY_SOURCE_INVALID');
  }
  const hostname = target.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new AppError(422, 'The dealership website must use a public domain.', 'INVENTORY_SOURCE_INVALID');
  }
  const addresses = isIP(hostname) ? [{ address: hostname }] : await lookup(hostname, { all: true, verbatim: true }).catch(() => []);
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicIp(address))) {
    throw new AppError(422, 'The dealership website must resolve to a public address.', 'INVENTORY_SOURCE_INVALID');
  }
}

async function fetchPage(target: URL): Promise<string> {
  await assertPublicHttpsUrl(target);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(target, {
      method: 'GET', redirect: 'error', signal: controller.signal,
      headers: { accept: 'text/html,application/ld+json;q=0.9', 'user-agent': 'EVEO-Inventory-Importer/1.0' },
    });
    if (response.status === 401 || response.status === 403) {
      throw new AppError(502, `The dealership website denied EVEO's automated inventory read (HTTP ${response.status}). EVEO is signed in; the source site blocks automated access. Connect a public inventory feed in Data Integrations or ask the website provider to allow the EVEO importer.`, 'INVENTORY_SOURCE_BLOCKED');
    }
    if (!response.ok) throw new AppError(502, `The dealership website returned HTTP ${response.status}.`, 'INVENTORY_SOURCE_HTTP_ERROR');
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html') && !type.includes('application/ld+json')) {
      throw new AppError(422, 'The dealership website did not return a supported HTML inventory page.', 'INVENTORY_SOURCE_UNSUPPORTED');
    }
    const reader = response.body?.getReader();
    if (!reader) return '';
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_PAGE_BYTES) {
        await reader.cancel();
        throw new AppError(413, 'The dealership website page is too large to import safely.', 'INVENTORY_SOURCE_TOO_LARGE');
      }
      chunks.push(value);
    }
    return new TextDecoder().decode(Buffer.concat(chunks));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(502, 'EVEO could not read the dealership website. Check the URL or use an inventory feed.', 'INVENTORY_SOURCE_UNAVAILABLE');
  } finally {
    clearTimeout(timeout);
  }
}

function scriptJsonLd(html: string): unknown[] {
  const results: unknown[] = [];
  const scripts = html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scripts) {
    const text = match[1]?.trim();
    if (!text || text.length > MAX_PAGE_BYTES) continue;
    try { results.push(JSON.parse(text) as unknown); } catch { /* Ignore invalid third-party JSON-LD blocks. */ }
  }
  return results;
}

function textValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (Array.isArray(value)) return textValue(value[0]);
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    return textValue(record.name ?? record.value ?? record['@id']);
  }
  return '';
}

function numberValue(value: unknown): number | null {
  const numeric = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function vehicleNode(node: unknown): ParsedVehicle | null {
  if (Array.isArray(node)) return node.map(vehicleNode).find((item): item is ParsedVehicle => Boolean(item)) ?? null;
  if (typeof node !== 'object' || node === null) return null;
  const record = node as Record<string, unknown>;
  const type = textValue(record['@type']);
  if (!VEHICLE_TYPES.test(type)) return null;
  const additional = Array.isArray(record.additionalProperty) ? record.additionalProperty : [];
  const additionalValue = (key: string) => {
    const item = additional.find((entry) => typeof entry === 'object' && entry !== null &&
      textValue((entry as Record<string, unknown>).name).toLowerCase() === key.toLowerCase());
    return item && typeof item === 'object' ? (item as Record<string, unknown>).value : undefined;
  };
  const vin = (textValue(record.vehicleIdentificationNumber ?? record.vin ?? record.vehicleID ?? additionalValue('VIN'))).replace(/\s/g, '').toUpperCase();
  if (!VIN_PATTERN.test(vin)) return null;
  const brand = textValue(record.brand ?? record.manufacturer);
  const model = textValue(record.model);
  const trim = textValue(record.vehicleConfiguration ?? record.trim);
  const yearFromName = Number(textValue(record.name).match(/\b(19\d{2}|20\d{2})\b/)?.[0]);
  const modelYear = numberValue(record.vehicleModelDate ?? record.modelDate ?? record.productionDate) ??
    (Number.isInteger(yearFromName) && yearFromName > 0 ? yearFromName : null);
  const mileage = numberValue(record.mileageFromOdometer && typeof record.mileageFromOdometer === 'object'
    ? (record.mileageFromOdometer as Record<string, unknown>).value : record.mileage);
  const offerValue = Array.isArray(record.offers) ? record.offers[0] : record.offers;
  const offers = typeof offerValue === 'object' && offerValue !== null ? offerValue as Record<string, unknown> : {};
  const price = numberValue(offers.price ?? record.price) ?? 0;
  const conditionText = textValue(record.itemCondition).toLowerCase();
  const condition: ParsedVehicle['condition'] = /newcondition/.test(conditionText) ? 'NEW'
    : /certified/.test(conditionText) ? 'CERTIFIED_PRE_OWNED' : 'USED';
  const name = textValue(record.name);
  const vehicle = name || [modelYear, brand, model, trim].filter(Boolean).join(' ');
  if (!vehicle) return null;
  const imageValue = record.image;
  const photos = (Array.isArray(imageValue) ? imageValue : [imageValue]).map(textValue).filter((url) => /^https:\/\//i.test(url)).slice(0, 12);
  return { vin, stockNumber: textValue(record.sku ?? record.mpn ?? additionalValue('stock number')), vehicle, make: brand, model, trim, modelYear, mileage, price, condition, photos };
}

function walkStructuredData(value: unknown, output: ParsedVehicle[]) {
  if (Array.isArray(value)) { value.forEach((item) => walkStructuredData(item, output)); return; }
  if (typeof value !== 'object' || value === null) return;
  const node = value as Record<string, unknown>;
  const parsed = vehicleNode(node);
  if (parsed) output.push(parsed);
  for (const [key, child] of Object.entries(node)) {
    if (key === '@context' || key === '@type') continue;
    walkStructuredData(child, output);
  }
}

function inventoryLinks(html: string, base: URL): URL[] {
  const candidates: URL[] = [];
  const anchors = html.matchAll(/\bhref\s*=\s*(["'])(.*?)\1/gi);
  for (const match of anchors) {
    const raw = match[2];
    if (!raw || !/(inventory|vehicles|used-cars|new-cars|pre-owned)/i.test(raw)) continue;
    try {
      const target = new URL(raw, base);
      if (target.protocol === 'https:' && target.hostname === base.hostname && !candidates.some((item) => item.href === target.href)) candidates.push(target);
    } catch { /* Ignore malformed or non-URL links. */ }
  }
  return candidates.slice(0, MAX_PAGES - 1);
}

export async function syncWebsiteInventory(storeId: string, dealerAccountId: string, userId: string) {
  const store = await Store.findOne({ _id: storeId, dealerAccountId, active: true }).select('name website').lean();
  if (!store) throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  if (!store.website) throw new AppError(422, 'Add the dealership website in store settings before syncing inventory.', 'STORE_WEBSITE_REQUIRED');

  let sourceUrl: URL;
  try { sourceUrl = new URL(store.website); } catch { throw new AppError(422, 'The dealership website URL is invalid.', 'INVENTORY_SOURCE_INVALID'); }
  const pages = [sourceUrl];
  const html = await fetchPage(sourceUrl);
  pages.push(...inventoryLinks(html, sourceUrl));
  const parsed: ParsedVehicle[] = [];
  const seen = new Set<string>();
  for (const page of pages) {
    const content = page.href === sourceUrl.href ? html : await fetchPage(page);
    const pageVehicles: ParsedVehicle[] = [];
    scriptJsonLd(content).forEach((block) => walkStructuredData(block, pageVehicles));
    pageVehicles.forEach((vehicle) => {
      if (!seen.has(vehicle.vin)) { seen.add(vehicle.vin); parsed.push(vehicle); }
    });
  }
  if (parsed.length === 0) {
    throw new AppError(422, 'No vehicle records with VINs were found in the website structured data. Connect a vAuto/CRM feed or ask EVEO to configure this site.', 'INVENTORY_FEED_UNSUPPORTED');
  }

  const source = `Dealership website · ${sourceUrl.hostname}`;
  let created = 0;
  let observed = 0;
  let skipped = 0;
  for (const vehicle of parsed) {
    const existing = await InventoryVehicle.findOne({ dealerAccountId, vin: vehicle.vin });
    if (existing) {
      if (existing.storeId.toString() !== storeId) { skipped += 1; continue; }
      existing.sourceObservations.push({
        source, observedBy: userId, observedAt: new Date(),
        values: { stockNumber: vehicle.stockNumber, vehicle: vehicle.vehicle, make: vehicle.make, model: vehicle.model, trim: vehicle.trim, modelYear: vehicle.modelYear, mileage: vehicle.mileage, price: vehicle.price, condition: vehicle.condition, status: 'READY_FOR_SALE' },
      });
      for (const [field, observedValue] of Object.entries({ stockNumber: vehicle.stockNumber, vehicle: vehicle.vehicle, make: vehicle.make, model: vehicle.model, trim: vehicle.trim, modelYear: vehicle.modelYear, mileage: vehicle.mileage, price: vehicle.price, condition: vehicle.condition, status: 'READY_FOR_SALE' })) {
        const currentValue = (existing as unknown as Record<string, unknown>)[field];
        if (observedValue === '' || observedValue === null || observedValue === undefined || String(currentValue ?? '') === String(observedValue)) continue;
        const hasOpen = existing.discrepancies.some((item) => item.status === 'open' && item.field === field && String(item.observedValue) === String(observedValue));
        if (!hasOpen) existing.discrepancies.push({ field: field as never, currentValue, observedValue, source, status: 'open' });
      }
      await existing.save();
      observed += 1;
      continue;
    }
    try {
      await InventoryVehicle.create({
        dealerAccountId, storeId, ...vehicle, status: 'READY_FOR_SALE',
        sourceObservations: [{ source, observedBy: userId, observedAt: new Date(), values: { ...vehicle, status: 'READY_FOR_SALE' } }],
      });
      created += 1;
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) skipped += 1;
      else throw error;
    }
  }

  await recordActivityEventSafely({
    dealerAccountId, storeId, userId, category: 'inventory', title: `Website inventory sync completed · ${store.name}`,
    description: `${created} new vehicles, ${observed} existing records observed, ${skipped} skipped.`, entityType: 'inventory_sync', entityId: storeId,
  });
  return { source: sourceUrl.hostname, parsed: parsed.length, created, observed, skipped };
}
