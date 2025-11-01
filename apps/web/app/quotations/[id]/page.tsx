'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle } from 'lucide-react';
import { QuotationChat } from '../QuotationChat';

interface QuotationItem {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  product: { id: string; name: string; sku: string; categoryName?: string | null };
}

interface Quotation {
  id: string;
  number: string;
  totalCents: number;
  currency: string;
  status: string;
  validUntil?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { firstName?: string | null; lastName?: string | null; email: string } | null;
  items: QuotationItem[];
}

export default function QuotationDetailPage() {
  const router = useRouter();
  const routeParams = useParams();
  const id = (routeParams?.id as string) || '';
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!id) return;
      const res = await fetch(`/api/quotations/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load quotation');
      setQuotation(json.quotation);
    } catch (e: any) {
      setError(e.message || 'Failed to load quotation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const formatCurrency = (cents: number, currency = 'AED') => new Intl.NumberFormat('en-AE', { style: 'currency', currency }).format(cents / 100);

  const approve = async () => {
    setWorking(true);
    try {
      await fetch(`/api/quotations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'APPROVED' }) });
      await load();
    } finally { setWorking(false); }
  };

  const createOrderFromQuote = async () => {
    setWorking(true);
    try {
      const res = await fetch(`/api/quotations/${id}/orders`, { method: 'POST' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to create order from quote');
      }
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setWorking(false);
    }
  };

  const initiatePayment = async (paymentOption: 'pay_now' | 'buy_now_pay_later') => {
    if (!customerEmail) {
      setError('Please provide your email address');
      return;
    }

    setWorking(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/quotations/${id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentOption,
          customerEmail,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to initiate payment');
      }

      const data = await res.json();
      
      // Redirect to payment URL (for pay_now) or success page (for buy_now_pay_later)
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setError('No payment URL received');
        setWorking(false);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to initiate payment');
      setWorking(false);
    }
  };

  const openPdf = async () => {
    const res = await fetch(`/api/quotations/${id}/pdf`);
    const json = await res.json();
    if (res.ok && json.pdfUrl) window.open(json.pdfUrl, '_blank');
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-60" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Items card skeleton */}
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-56" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="h-3 w-16 ml-auto" />
                      <Skeleton className="h-3 w-20 ml-auto" />
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar skeleton */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chat footer skeleton */}
        <div className="border-t bg-white sticky bottom-0">
          <div className="max-w-5xl mx-auto p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="h-64 overflow-hidden border rounded p-3 bg-white space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-10 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !quotation) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-red-600">{error || 'Quotation not found'}</div>
            <div className="mt-4"><Link href="/quotations" className="text-blue-600 underline">Back to quotations</Link></div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quotation {quotation.number}</h1>
          <div className="text-sm text-gray-600">Created {new Date(quotation.createdAt).toLocaleString()}</div>
        </div>
        <Badge>{quotation.status}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quotation.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <div className="font-medium">{it.product.name}</div>
                    <div className="text-xs text-gray-500">SKU: {it.product.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Qty: {it.quantity}</div>
                    {quotation.status === 'APPROVED' || quotation.status === 'CONVERTED' ? (
                      <>
                        <div className="text-sm">{formatCurrency(it.unitPriceCents, quotation.currency)}</div>
                        <div className="font-semibold">{formatCurrency(it.subtotalCents, quotation.currency)}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-gray-500 italic">Pending</div>
                        <div className="font-semibold text-gray-500 italic">Pending</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <div className="font-semibold">Total</div>
                <div className="text-blue-700 font-bold">
                  {quotation.status === 'APPROVED' || quotation.status === 'CONVERTED' 
                    ? formatCurrency(quotation.totalCents, quotation.currency)
                    : <span className="text-gray-500 italic">Pending</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm">
                {quotation.customer?.firstName || quotation.customer?.lastName ? (
                  <div className="font-medium">{`${quotation.customer?.firstName || ''} ${quotation.customer?.lastName || ''}`.trim()}</div>
                ) : null}
                <div className="text-gray-700">{quotation.customer?.email || 'N/A'}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={openPdf}>View PDF</Button>
              <Button variant="outline" className="w-full" disabled={working || quotation.status !== 'SENT'} onClick={approve}>Approve</Button>
              
              {(quotation.status === 'APPROVED' || quotation.status === 'SENT') && (
                <>
                  {!showPaymentOptions ? (
                    <Button variant="default" className="w-full" disabled={working} onClick={() => setShowPaymentOptions(true)}>
                      Convert to Order & Pay
                    </Button>
                  ) : (
                    <div className="space-y-3 p-3 border rounded-lg">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email *</label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone</label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+971 50 123 4567"
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          className="flex-1"
                          disabled={working || !customerEmail}
                          onClick={() => initiatePayment('pay_now')}
                        >
                          Pay Now
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          disabled={working || !customerEmail}
                          onClick={() => initiatePayment('buy_now_pay_later')}
                        >
                          Buy Now Pay Later
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full text-sm"
                        onClick={() => {
                          setShowPaymentOptions(false);
                          setError(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  <Button variant="ghost" className="w-full" disabled={working} onClick={createOrderFromQuote}>
                    Create Order (No Payment)
                  </Button>
                </>
              )}
              
              {error && (
                <div className="p-2 bg-red-50 text-red-600 text-sm rounded">
                  {error}
                </div>
              )}
              
              {/* Conversion also happens automatically if Zoho converts the estimate on approval */}
              <Link href="/quotations" className="block text-center text-sm text-blue-600 underline">Back to quotations</Link>
            </CardContent>
          </Card>
        </div>
      </div>
      <QuotationChat quotationId={quotation.id} inline />
    </main>
  );
}


