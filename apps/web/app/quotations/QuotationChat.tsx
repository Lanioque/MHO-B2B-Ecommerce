'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  quotationId: string;
  author: string;
  message: string;
  createdAt: string | Date;
}

interface QuotationSummary {
  id: string;
  number: string;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  notes?: string | null;
  branchId?: string | null;
}

export function QuotationChat({ quotationId, open, onOpenChange, inline }: { quotationId: string; open?: boolean; onOpenChange?: (v: boolean) => void; inline?: boolean; }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [quote, setQuote] = useState<QuotationSummary | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [branchManagerName, setBranchManagerName] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [resMsgs, resQuote] = await Promise.all([
        fetch(`/api/quotations/${quotationId}/messages`, { cache: 'no-store' }),
        fetch(`/api/quotations/${quotationId}`, { cache: 'no-store' }),
      ]);
      const jsonMsgs = await resMsgs.json();
      const jsonQuote = await resQuote.json();
      if (resMsgs.ok) setMessages(jsonMsgs.messages || []);
      if (resQuote.ok) setQuote({
        id: jsonQuote.quotation?.id,
        number: jsonQuote.quotation?.number,
        status: jsonQuote.quotation?.status,
        createdAt: jsonQuote.quotation?.createdAt,
        updatedAt: jsonQuote.quotation?.updatedAt,
        notes: jsonQuote.quotation?.notes,
        branchId: jsonQuote.quotation?.branchId,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inline || open) {
      load();
      const id = setInterval(load, 5000);
      return () => clearInterval(id);
    }
  }, [open, inline]);

  // Fetch current user and branch manager details for better labels
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const meRes = await fetch('/api/me', { cache: 'no-store' });
        if (meRes.ok) {
          const me = await meRes.json();
          setCurrentUserName(me.user?.name || me.user?.email || null);
        }
        if (quote?.branchId) {
          const brRes = await fetch(`/api/branches/${quote.branchId}`, { cache: 'no-store' });
          if (brRes.ok) {
            const br = await brRes.json();
            setBranchManagerName(br.branch?.managerName || br.branch?.name || null);
          }
        }
      } catch {}
    };
    fetchMeta();
  }, [quote?.branchId]);

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setInput('');
    const res = await fetch(`/api/quotations/${quotationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content }),
    });
    if (res.ok) load();
  };

  const activities = useMemo(() => {
    const events: Array<{ id: string; when: Date; type: 'system' | 'message'; author?: string; text: string }> = [];
    if (quote) {
      events.push({ id: 'created', when: new Date(quote.createdAt), type: 'system', text: `Quotation ${quote.number} created` });
      if (quote.updatedAt && new Date(quote.updatedAt).getTime() !== new Date(quote.createdAt).getTime()) {
        events.push({ id: 'updated', when: new Date(quote.updatedAt), type: 'system', text: `Status updated to ${quote.status}` });
      }
      if (quote.notes) {
        const hasEstimate = /ZohoEstimateId:/i.test(quote.notes);
        if (hasEstimate) {
          events.push({ id: 'estimate', when: new Date(quote.updatedAt), type: 'system', text: 'Estimate created in Zoho' });
        }
      }
    }
    // Merge message timestamps as activity
    for (const m of messages) {
      events.push({ id: `msg-${m.id}`, when: new Date(m.createdAt), type: 'message', author: m.author, text: m.message });
    }
    // Sort by time
    return events.sort((a, b) => a.when.getTime() - b.when.getTime());
  }, [quote, messages]);

  if (inline) {
    return (
      <div className="border-t bg-white sticky bottom-0">
        <div className="max-w-5xl mx-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Conversation & Activity</div>
            {quote && (
              <div className="text-xs text-gray-500">Status: {quote.status}</div>
            )}
          </div>
          <div className="h-64 overflow-y-auto border rounded p-3 bg-white">
            {loading && <div className="text-sm text-gray-500">Loading…</div>}
            {!loading && activities.length === 0 && (
              <div className="text-sm text-gray-500">No messages yet.</div>
            )}
            <div className="space-y-4">
              {activities.map((ev) => {
                const isUser = ev.type === 'message' && ev.author !== 'SYSTEM' && ev.author !== 'SELLER';
                const isSeller = ev.type === 'message' && ev.author === 'SELLER';
                const bubbleBase = 'px-3 py-2 rounded-lg shadow-sm max-w-[80%] whitespace-pre-wrap break-words';
                return (
                  <div key={ev.id} className="flex items-start gap-2">
                    {/* Avatar / marker */}
                    <div className={`h-7 w-7 flex items-center justify-center rounded-full text-[10px] font-semibold select-none ${
                      ev.type === 'system' ? 'bg-gray-200 text-gray-700' : isSeller ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {ev.type === 'system' ? 'i' : (ev.author || '?').slice(0, 2).toUpperCase()}
                    </div>
                    {/* Bubble */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-wide text-gray-500">
                          {ev.type === 'system' ? 'Activity' : (ev.author === 'CUSTOMER' ? (currentUserName ? 'You' : (branchManagerName || 'Customer')) : (ev.author || 'Message'))}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {ev.when.toLocaleString()}
                        </span>
                      </div>
                      <div className={`${bubbleBase} mt-1 ${
                        ev.type === 'system'
                          ? 'bg-gray-50 border border-gray-200 text-gray-700'
                          : isSeller
                          ? 'bg-indigo-50 border border-indigo-100 text-indigo-900'
                          : 'bg-emerald-50 border border-emerald-100 text-emerald-900'
                      }`}>
                        {ev.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message…" onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
            <Button onClick={send} className="bg-gradient-to-r from-blue-600 to-indigo-600">Send</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={!!open} onOpenChange={onOpenChange!}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chat about quotation</DialogTitle>
        </DialogHeader>
        <div className="h-64 overflow-y-auto border rounded p-3 bg-white">
          {loading && <div className="text-sm text-gray-500">Loading…</div>}
          {!loading && messages.length === 0 && (
            <div className="text-sm text-gray-500">No messages yet.</div>
          )}
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="font-medium mr-2">[{m.author}]</span>
                <span>{m.message}</span>
                <div className="text-[10px] text-gray-500">{new Date(m.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message…" onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
          <Button onClick={send}>Send</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


