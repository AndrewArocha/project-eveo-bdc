import { useId, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';

export interface WalkInCustomer {
  id: string;
  name: string;
  customerId?: string;
  leadId?: string;
  phone?: string;
}

export default function WalkInCustomerSearch({ value, customers, busy, onChange, onSelect, onCreate }: {
  value: string;
  customers: WalkInCustomer[];
  busy: boolean;
  onChange: (name: string) => void;
  onSelect: (customer: WalkInCustomer) => void;
  onCreate: () => void;
}) {
  const labelId = useId();
  const resultsId = useId();
  const dropdown = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const query = value.trim().toLowerCase();
  const matches = customers.filter(({ name, phone }) => `${name} ${phone ?? ''}`.toLowerCase().includes(query));

  return <div onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }} onKeyDown={(event) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      input.current?.focus();
      setOpen(false);
    }
  }}>
    <label id={labelId} htmlFor={`${resultsId}-input`} className="mb-3 block text-base font-semibold text-white">What’s the name of the customer?</label>
    <div className="overflow-hidden rounded-xl border border-white/15 bg-[#101620] focus-within:border-orange-500/70">
      <div className="flex items-center gap-2 px-3">
        <Search size={16} aria-hidden="true" className="text-gray-400" />
        <input ref={input} id={`${resultsId}-input`} value={value} maxLength={120} autoComplete="off" disabled={busy}
          onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onChange={(event) => { onChange(event.target.value); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.preventDefault();
            if (event.key === 'ArrowDown' && open) {
              event.preventDefault();
              dropdown.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
            }
          }}
          aria-controls={open ? resultsId : undefined} placeholder="Search customer name" className="min-h-11 w-full bg-transparent text-base text-white outline-none placeholder:text-gray-500 sm:text-sm" />
      </div>
      {open && <div ref={dropdown} id={resultsId} role="group" aria-labelledby={labelId} className="border-t border-white/10">
        <div className="max-h-[min(25rem,calc(90dvh-16rem))] overflow-y-auto overscroll-contain">
          {matches.map((customer) => <button key={customer.id} type="button" disabled={busy}
            onClick={() => { onSelect(customer); setOpen(false); }}
            className="flex h-10 w-full items-center justify-between gap-2 px-4 text-left text-sm text-white hover:bg-white/10 focus-visible:bg-white/10">
            <span className="truncate">{customer.name}</span>
            {customer.phone && <span className="shrink-0 text-xs text-gray-400">{customer.phone}</span>}
          </button>)}
          {matches.length === 0 && <p className="px-4 py-2.5 text-sm text-gray-400">No matching customers</p>}
        </div>
        <button type="button" disabled={busy || query.length < 2} onClick={onCreate} className="flex min-h-10 w-full items-center gap-2 border-t border-white/10 px-4 text-left text-sm font-semibold text-orange-400 hover:bg-white/10 disabled:opacity-50">
          <Plus size={16} aria-hidden="true" /> {busy ? 'Creating lead…' : 'Create New Lead'}
        </button>
      </div>}
    </div>
  </div>;
}
