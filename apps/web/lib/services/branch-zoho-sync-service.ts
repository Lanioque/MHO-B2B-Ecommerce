/**
 * Branch Zoho Sync Service
 * Handles synchronization of branches to Zoho Books as contacts/customers
 */

import { prisma } from '@/lib/prisma';
import { getZohoClient, ZohoError } from '@/lib/clients/zoho-client';
import { ZohoContact } from '@/lib/domain/interfaces/IZohoClient';

export class BranchZohoSyncService {
  /**
   * Sync branch to Zoho Books as a contact/customer (create if missing)
   */
  async syncBranchToZohoContact(branchId: string): Promise<void> {
    try {
      // Fetch branch with related data
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        include: {
          org: true,
          billing: true,
          shipping: true,
        },
      });

      if (!branch) {
        throw new Error(`Branch not found: ${branchId}`);
      }

      // Map branch data to Zoho Contact format
      const contactData: ZohoContact = {
        contact_name: branch.name,
        company_name: branch.org.name,
        contact_type: 'customer',
        currency_code: 'USD', // Default, can be configured per org
        billing_address: {
          address: branch.billing.line1,
          street: branch.billing.line1,
          city: branch.billing.city,
          zip: branch.billing.postalCode,
          country: branch.billing.country,
        },
        shipping_address: {
          address: branch.shipping.line1,
          street: branch.shipping.line1,
          city: branch.shipping.city,
          zip: branch.shipping.postalCode,
          country: branch.shipping.country,
        },
      };

      // Add line2 if present
      if (branch.billing.line2) {
        contactData.billing_address!.address += `, ${branch.billing.line2}`;
        contactData.billing_address!.street = branch.billing.line1;
      }
      if (branch.shipping.line2) {
        contactData.shipping_address!.address += `, ${branch.shipping.line2}`;
        contactData.shipping_address!.street = branch.shipping.line1;
      }

      const zohoClient = getZohoClient();
      
      // Log scope for debugging
      const connection = await prisma.zohoConnection.findUnique({
        where: { orgId: branch.orgId },
        select: { scope: true },
      });
      console.log(`[BranchZohoSync] Attempting to create contact with scope: ${connection?.scope || 'not set'}`);
      
      let contactId: string | undefined = branch.zohoContactId || undefined;

      if (branch.zohoContactId) {
        // Update existing contact
        await zohoClient.updateContact(branch.orgId, branch.zohoContactId, contactData);
        await prisma.branch.update({
          where: { id: branchId },
          data: {
            zohoSyncedAt: new Date(),
            zohoSyncError: null,
          },
        });
        console.log(`[BranchZohoSync] Updated Zoho contact ${branch.zohoContactId} for branch ${branchId}`);
      } else {
        // Create new contact
        const zohoContact = await zohoClient.createContact(branch.orgId, contactData);
        contactId = zohoContact.contact_id || contactId;
        await prisma.branch.update({
          where: { id: branchId },
          data: {
            zohoContactId: zohoContact.contact_id!,
            zohoSyncedAt: new Date(),
            zohoSyncError: null,
          },
        });
        console.log(`[BranchZohoSync] Created Zoho contact ${zohoContact.contact_id} for branch ${branchId}`);
      }

      console.log(`[BranchZohoSync] Successfully synced branch ${branchId} to Zoho contact ${contactId || branch.zohoContactId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[BranchZohoSync] Failed to sync branch ${branchId}:`, errorMessage);

      // Check if it's an authorization error
      if (errorMessage.includes('not authorized') || errorMessage.includes('401') || errorMessage.includes('code":57')) {
        const detailedError = 'Zoho authorization failed. Please re-authorize your Zoho account with Books API permissions. Required scopes: ZohoBooks.contacts.CREATE, ZohoBooks.salesorders.CREATE, ZohoBooks.invoices.CREATE';
        await prisma.branch.update({
          where: { id: branchId },
          data: {
            zohoSyncError: detailedError,
          },
        });
        throw new Error(detailedError);
      }

      // Store error in branch record
      await prisma.branch.update({
        where: { id: branchId },
        data: {
          zohoSyncError: errorMessage,
        },
      });

      throw error;
    }
  }

  /**
   * Retry sync for a branch that failed previously
   */
  async retrySync(branchId: string): Promise<void> {
    // Clear previous error and retry
    await prisma.branch.update({
      where: { id: branchId },
      data: {
        zohoSyncError: null,
        zohoContactId: null, // Reset to force re-sync
        zohoSyncedAt: null,
      },
    });

    return this.syncBranchToZohoContact(branchId);
  }
}

// Factory function
export function getBranchZohoSyncService(): BranchZohoSyncService {
  return new BranchZohoSyncService();
}

