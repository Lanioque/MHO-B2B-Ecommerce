/**
 * Order Confirmation Page
 * Display order details and invoice link
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, FileText, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
}

interface Invoice {
  id: string;
  number: string;
  pdfUrl: string | null;
  status: string;
  zohoInvoiceId: string | null;
}

interface Order {
  id: string;
  number: string;
  totalCents: number;
  currency: string;
  status: string;
  zohoSalesOrderId: string | null;
  zohoInvoiceId: string | null;
  createdAt: string;
  items: OrderItem[];
  invoices?: Invoice[];
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      const previousHasInvoice = order?.invoices && order.invoices.length > 0;
      const currentHasInvoice = data.order?.invoices && data.order.invoices.length > 0;
      
      setOrder(data.order);
      
      // Stop polling if invoice is now available and wasn't before
      if (!previousHasInvoice && currentHasInvoice && isPolling) {
        setIsPolling(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;

    fetchOrder();
  }, [orderId]);

  // Poll for invoice if order has Zoho invoice ID but no local invoice yet
  useEffect(() => {
    if (!order) return;
    
    const hasZohoInvoiceId = order.zohoInvoiceId;
    const hasLocalInvoice = order.invoices && order.invoices.length > 0;
    
    // Start polling if we have a Zoho invoice ID but no local invoice
    if (hasZohoInvoiceId && !hasLocalInvoice && !isPolling) {
      setIsPolling(true);
    }
    
    // Stop polling if we have a local invoice or no Zoho invoice ID
    if ((hasLocalInvoice || !hasZohoInvoiceId) && isPolling) {
      setIsPolling(false);
    }
  }, [order, isPolling]);

  // Polling interval: check every 3 seconds for invoice
  useEffect(() => {
    if (!isPolling || !orderId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const hasInvoice = data.order?.invoices && data.order.invoices.length > 0;
          
          if (hasInvoice) {
            setOrder(data.order);
            setIsPolling(false);
          } else {
            setOrder(data.order);
          }
        }
      } catch (err) {
        console.error('Error polling for invoice:', err);
      }
    }, 3000);

    // Stop polling after 2 minutes (40 checks)
    const timeout = setTimeout(() => {
      setIsPolling(false);
      clearInterval(interval);
    }, 120000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isPolling, orderId]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: 'Pending', variant: 'outline' },
      AWAITING_PAYMENT: { label: 'Awaiting Payment', variant: 'secondary' },
      PAID: { label: 'Paid', variant: 'default' },
      FAILED: { label: 'Failed', variant: 'destructive' },
      CANCELLED: { label: 'Cancelled', variant: 'outline' },
      REFUNDED: { label: 'Refunded', variant: 'secondary' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/orders">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-lg text-gray-600">{error || 'Order not found'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/orders">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </Link>

        {/* Success Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <div>
            <h2 className="text-xl font-semibold text-green-900">Order Confirmed!</h2>
            <p className="text-green-700">Your order has been placed successfully.</p>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">Order #{order.number}</h1>
        <div className="flex items-center gap-4 mb-8">
          {getStatusBadge(order.status)}
          <span className="text-sm text-gray-600">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start border-b pb-4">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">{formatPrice(item.subtotalCents)}</p>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatPrice(order.totalCents)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                {order.invoices && order.invoices.length > 0 ? (
                  <div className="space-y-4">
                    {order.invoices.map((invoice) => (
                      <div key={invoice.id} className="space-y-3 border-b pb-4 last:border-0">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Invoice #{invoice.number}</p>
                            <p className="text-sm text-gray-600">Status: {invoice.status}</p>
                            {invoice.zohoInvoiceId && (
                              <p className="text-xs text-gray-500">Zoho ID: {invoice.zohoInvoiceId}</p>
                            )}
                          </div>
                          <Badge variant={invoice.status === 'ISSUED' ? 'default' : 'outline'}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <Link href={`/api/invoices/${invoice.id}/pdf`} target="_blank">
                          <Button className="w-full">
                            <FileText className="w-4 h-4 mr-2" />
                            {invoice.pdfUrl ? 'View Invoice PDF' : 'Download Invoice PDF'}
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : order.zohoInvoiceId ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Invoice has been created in Zoho (ID: {order.zohoInvoiceId}).
                    </p>
                    <Button disabled className="w-full" variant="outline">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isPolling ? 'Loading Invoice Details...' : 'Checking Invoice Status...'}
                    </Button>
                    {isPolling && (
                      <p className="text-xs text-gray-500 text-center">
                        We're checking for your invoice. This page will update automatically.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Invoice is being generated. Please check back in a few moments.
                    </p>
                    <Button disabled className="w-full" variant="outline">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </Button>
                    {isPolling && (
                      <p className="text-xs text-gray-500 text-center">
                        We're generating your invoice. This page will update automatically.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/products" className="block">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
                <Link href="/orders" className="block">
                  <Button variant="outline" className="w-full">
                    View All Orders
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

