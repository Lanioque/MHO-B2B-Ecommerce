/**
 * Telr Payment Gateway Client
 * Handles communication with Telr payment gateway
 */

import crypto from 'crypto';

export interface TelrPaymentRequest {
  /** Store ID from Telr */
  storeId: string;
  /** Authentication key from Telr */
  authKey: string;
  /** Transaction reference (unique per order) */
  tranRef: string;
  /** Order number */
  orderNumber: string;
  /** Amount in smallest currency unit (e.g., cents for USD/AED) */
  amount: number;
  /** Currency code (e.g., AED, USD) */
  currency: string;
  /** Customer email */
  customerEmail: string;
  /** Customer name */
  customerName?: string;
  /** Customer phone */
  customerPhone?: string;
  /** Return URL for success */
  returnSuccessUrl: string;
  /** Return URL for decline */
  returnDeclineUrl: string;
  /** Return URL for cancel */
  returnCancelUrl: string;
  /** Language code (e.g., en, ar) */
  langId?: string;
  /** Test mode flag */
  testMode?: boolean;
}

export interface TelrPaymentResponse {
  /** Payment URL to redirect user to */
  paymentUrl: string;
  /** Transaction reference */
  tranRef: string;
}

export interface TelrWebhookPayload {
  /** Transaction reference */
  tran_ref: string;
  /** Order reference */
  order_id: string;
  /** Payment status */
  status: string;
  /** Payment method */
  method?: string;
  /** Amount paid */
  amount?: string;
  /** Currency */
  currency?: string;
  /** Telr transaction ID */
  telr_ref?: string;
  /** Response code */
  code?: string;
  /** Response message */
  message?: string;
}

export class TelrClient {
  private storeId: string;
  private authKey: string;
  private endpoint: string;
  private returnSuccessUrl: string;
  private returnDeclineUrl: string;
  private returnCancelUrl: string;
  private testMode: boolean;

  constructor() {
    this.storeId = process.env.TELR_STORE_ID || '';
    this.authKey = process.env.TELR_AUTH_KEY || '';
    this.endpoint = process.env.TELR_ENDPOINT || 'https://secure.telr.com/gateway/remote.xml';
    this.returnSuccessUrl = process.env.TELR_RETURN_SUCCESS || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`;
    this.returnDeclineUrl = process.env.TELR_RETURN_DECLINE || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/decline`;
    this.returnCancelUrl = process.env.TELR_RETURN_CANCEL || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`;
    this.testMode = process.env.TELR_MODE === 'test';

    if (!this.storeId || !this.authKey) {
      console.warn('[TelrClient] Telr credentials not configured. Payment features will not work.');
    }
  }

  /**
   * Generate authentication hash for Telr API
   */
  private generateHash(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex').toUpperCase();
  }

  /**
   * Initiate payment session
   * Returns payment URL to redirect user to
   */
  async initiatePayment(request: TelrPaymentRequest): Promise<TelrPaymentResponse> {
    if (!this.storeId || !this.authKey) {
      throw new Error('Telr credentials not configured');
    }

    // Prepare payment data
    const paymentData = {
      ivp_method: 'create',
      ivp_store: this.storeId,
      ivp_authkey: this.authKey,
      ivp_tranclass: 'paypage',
      ivp_tranref: request.tranRef,
      ivp_amount: (request.amount / 100).toFixed(2), // Convert cents to currency units
      ivp_currency: request.currency,
      ivp_test: this.testMode ? '1' : '0',
      ivp_lang: request.langId || 'en',
      return_auth: this.returnSuccessUrl,
      return_declined: this.returnDeclineUrl,
      return_cancelled: this.returnCancelUrl,
      bill_fname: request.customerName?.split(' ')[0] || '',
      bill_lname: request.customerName?.split(' ').slice(1).join(' ') || '',
      bill_email: request.customerEmail,
      bill_tel: request.customerPhone || '',
      ivp_desc: `Order ${request.orderNumber}`,
    };

    // Generate hash
    const hashString = `${this.storeId}${paymentData.ivp_tranref}${paymentData.ivp_amount}${paymentData.ivp_currency}${this.authKey}`;
    const hash = this.generateHash(hashString);
    paymentData['ivp_hash'] = hash;

    // Make API request to Telr
    try {
      const formData = new URLSearchParams();
      Object.entries(paymentData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const responseText = await response.text();

      // Parse XML response (simple regex-based parsing for Node.js)
      // Check for errors
      const errorMatch = responseText.match(/<error[^>]*>([^<]+)<\/error>/i);
      if (errorMatch) {
        throw new Error(`Telr API error: ${errorMatch[1]}`);
      }

      // Extract payment URL from <start> tag
      const startMatch = responseText.match(/<start[^>]*>([^<]+)<\/start>/i);
      if (!startMatch) {
        throw new Error('Invalid response from Telr API: missing start element');
      }

      const paymentUrl = startMatch[1].trim();
      if (!paymentUrl) {
        throw new Error('Invalid response from Telr API: empty payment URL');
      }

      return {
        paymentUrl,
        tranRef: request.tranRef,
      };
    } catch (error) {
      console.error('[TelrClient] Error initiating payment:', error);
      throw error instanceof Error ? error : new Error('Failed to initiate payment with Telr');
    }
  }

  /**
   * Verify webhook signature from Telr
   */
  verifyWebhookSignature(data: Record<string, string>, signature: string): boolean {
    // Telr typically sends hash in the callback data
    // Verify the hash matches the expected signature
    const { ivp_hash, ...params } = data;
    
    // Reconstruct hash string (order matters in Telr API)
    const hashString = `${this.storeId}${params.ivp_tranref || ''}${params.ivp_amount || ''}${params.ivp_currency || ''}${this.authKey}`;
    const expectedHash = this.generateHash(hashString);

    return expectedHash.toUpperCase() === (ivp_hash || '').toUpperCase();
  }

  /**
   * Parse webhook payload from Telr callback
   */
  parseWebhookPayload(data: Record<string, string>): TelrWebhookPayload {
    return {
      tran_ref: data.ivp_tranref || data.tran_ref || '',
      order_id: data.order_id || '',
      status: data.ivp_status || data.status || '',
      method: data.ivp_method || data.method,
      amount: data.ivp_amount || data.amount,
      currency: data.ivp_currency || data.currency,
      telr_ref: data.ivp_cartid || data.telr_ref,
      code: data.ivp_code || data.code,
      message: data.ivp_message || data.message,
    };
  }
}

// Factory function
let telrClientInstance: TelrClient | null = null;

export function getTelrClient(): TelrClient {
  if (!telrClientInstance) {
    telrClientInstance = new TelrClient();
  }
  return telrClientInstance;
}

