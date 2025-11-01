/**
 * GET /api/telr/return
 * Handle Telr payment return URLs (success/decline/cancel)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentService } from '@/lib/services/payment-service';
import { getTelrClient } from '@/lib/clients/telr-client';
import { handleError } from '@/lib/middleware/error-handler';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // success, decline, cancel
    const tranRef = searchParams.get('tranRef');
    const orderId = searchParams.get('orderId');

    if (!status || !tranRef || !orderId) {
      return NextResponse.redirect(
        new URL('/checkout/error?message=missing_parameters', request.url)
      );
    }

    // Get form data from Telr (they might send it as query params or form data)
    const telrData: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      telrData[key] = value;
    });

    // Parse webhook payload from return data
    const telrClient = getTelrClient();
    const payload = telrClient.parseWebhookPayload(telrData);

    // Handle payment callback
    const paymentService = getPaymentService();
    
    try {
      await paymentService.handlePaymentCallback(tranRef, payload);
    } catch (error) {
      console.error('[Telr Return] Error handling callback:', error);
      // Continue to redirect even if callback handling fails
    }

    // Redirect to appropriate page based on status
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    if (status === 'success') {
      return NextResponse.redirect(
        new URL(`/checkout/success?orderId=${orderId}&tranRef=${tranRef}`, baseUrl)
      );
    } else if (status === 'decline') {
      return NextResponse.redirect(
        new URL(`/checkout/decline?orderId=${orderId}&tranRef=${tranRef}`, baseUrl)
      );
    } else if (status === 'cancel') {
      return NextResponse.redirect(
        new URL(`/checkout/cancel?orderId=${orderId}&tranRef=${tranRef}`, baseUrl)
      );
    }

    // Default redirect to success page
    return NextResponse.redirect(
      new URL(`/checkout/success?orderId=${orderId}`, baseUrl)
    );
  } catch (error) {
    console.error('[Telr Return] Error:', error);
    return NextResponse.redirect(
      new URL('/checkout/error?message=processing_error', request.url)
    );
  }
}


