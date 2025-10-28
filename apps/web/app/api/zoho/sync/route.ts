import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchZohoItemsForOrganization, ZohoError, getValidAccessToken } from "@/lib/zoho";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

/**
 * POST /api/zoho/sync
 * Fetch products from Zoho and save them to database (global products)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId, zohoOrgId } = await req.json();

    if (!zohoOrgId) {
      return NextResponse.json(
        { error: "zohoOrgId is required" },
        { status: 400 }
      );
    }

    console.log(`[Sync] Starting product sync from Zoho for org: ${zohoOrgId}`);

    // Ensure public/products directory exists
    const productsDir = path.join(process.cwd(), "public", "products");
    try {
      await mkdir(productsDir, { recursive: true });
    } catch (err) {
      console.log("[Sync] Products directory already exists or created");
    }

    // Fetch all items from Zoho (with pagination)
    const items = await fetchZohoItemsForOrganization(orgId || undefined, zohoOrgId);
    console.log(`[Sync] Fetched ${items.length} items from Zoho`);
    
    // Log first item to see ALL fields
    if (items.length > 0) {
      console.log('[Sync] Sample item ALL FIELDS:', JSON.stringify(items[0], null, 2));
    }

    // Sync items to database (global products, not tied to org)
    let synced = 0;
    let errors = 0;

    // Get access token for image downloads
    const accessToken = await getValidAccessToken(orgId);
    const region = process.env.ZOHO_REGION || "us";
    const apiUrls = {
      eu: "https://www.zohoapis.eu/inventory/v1",
      us: "https://www.zohoapis.com/inventory/v1",
      in: "https://www.zohoapis.in/inventory/v1",
    };
    const apiUrl = apiUrls[region as keyof typeof apiUrls] || apiUrls.us;
    
    console.log(`[Sync] Using API URL: ${apiUrl}, accessToken available: ${!!accessToken}`);

    for (const item of items) {
      try {
        const sku = item.sku || item.item_id;
        const name = item.item_name;
        const priceCents = Math.round((item.rate || 0) * 100);
        const purchaseRate = item.purchase_rate || null;
        const stock = typeof item.stock_on_hand === "number" ? item.stock_on_hand : 0;
        
        // Generate unique slug: use zoho item_id to ensure uniqueness
        const baseSlug = (sku || name || item.item_id).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const slug = `${baseSlug}-${item.item_id}`.substring(0, 191); // Prisma String field limit

        // TEMPORARILY DISABLED: Don't download images to save API calls
        // We'll check if Zoho provides image URLs in the response
        let localImagePath = null;
        // TODO: Find a way to get images without individual API calls

        await prisma.product.upsert({
          where: { sku },
          update: {
            name,
            slug,
            description: item.description || null,
            priceCents,
            purchaseRate,
            stock,
            
            // Additional identifiers
            ean: item.ean || null,
            upc: item.upc || null,
            isbn: item.isbn || null,
            partNumber: item.part_number || null,
            
            // Brand and manufacturer
            brand: item.brand || null,
            manufacturer: item.manufacturer || null,
            
            // Category
            categoryId: item.category_id || null,
            categoryName: item.category_name || null,
            unit: item.unit || "unit",
            
            // Status
            status: item.status || "active",
            source: item.source || null,
            itemType: item.item_type || null,
            productType: item.product_type || null,
            
            // Tax information
            taxId: item.tax_id || null,
            taxName: item.tax_name || null,
            taxPercentage: item.tax_percentage || null,
            isTaxable: item.is_taxable || false,
            taxExemptionId: item.tax_exemption_id || null,
            taxExemptionCode: item.tax_exemption_code || null,
            taxCategoryCode: item.tax_category_code || null,
            taxCategoryName: item.tax_category_name || null,
            
            // Inventory
            trackInventory: item.track_inventory || false,
            canBeSold: item.can_be_sold || true,
            canBePurchased: item.can_be_purchased || true,
            isReturnable: item.is_returnable || true,
            trackBatchNumber: item.track_batch_number || false,
            isStorageLocationEnabled: item.is_storage_location_enabled || false,
            
            // Zoho CRM
            isLinkedWithZohoCRM: item.is_linked_with_zohocrm || false,
            zcrmProductId: item.zcrm_product_id || null,
            purchaseAccountId: item.purchase_account_id || null,
            purchaseAccountName: item.purchase_account_name || null,
            accountId: item.account_id || null,
            accountName: item.account_name || null,
            purchaseDescription: item.purchase_description || null,
            
            // Storefront
            showInStorefront: item.show_in_storefront || false,
            
            // Physical attributes
            length: item.length || null,
            width: item.width || null,
            height: item.height || null,
            weight: item.weight || null,
            weightUnit: item.weight_unit || null,
            dimensionUnit: item.dimension_unit || null,
            
            // Product flags
            isComboProduct: item.is_combo_product || false,
            hasAttachment: item.has_attachment || false,
            
            // Image (local path)
            imageName: localImagePath || item.image_name || null,
            imageType: item.image_type || null,
            imageDocumentId: item.image_document_id || null,
            
            // Tags
            tags: item.tags || [],
            
            // Timestamps
            zohoItemId: item.item_id,
            zohoCreatedTime: item.created_time ? new Date(item.created_time) : null,
            zohoLastModifiedTime: item.last_modified_time ? new Date(item.last_modified_time) : null,
            lastStockSync: new Date(),
          },
          create: {
            sku,
            slug,
            name,
            description: item.description || null,
            priceCents,
            purchaseRate,
            currency: "AED",
            vatRate: 0,
            stock,
            
            // Additional identifiers
            ean: item.ean || null,
            upc: item.upc || null,
            isbn: item.isbn || null,
            partNumber: item.part_number || null,
            
            // Brand and manufacturer
            brand: item.brand || null,
            manufacturer: item.manufacturer || null,
            
            // Category
            categoryId: item.category_id || null,
            categoryName: item.category_name || null,
            unit: item.unit || "unit",
            
            // Status
            status: item.status || "active",
            source: item.source || null,
            itemType: item.item_type || null,
            productType: item.product_type || null,
            
            // Tax information
            taxId: item.tax_id || null,
            taxName: item.tax_name || null,
            taxPercentage: item.tax_percentage || null,
            isTaxable: item.is_taxable || false,
            taxExemptionId: item.tax_exemption_id || null,
            taxExemptionCode: item.tax_exemption_code || null,
            taxCategoryCode: item.tax_category_code || null,
            taxCategoryName: item.tax_category_name || null,
            
            // Inventory
            trackInventory: item.track_inventory || false,
            canBeSold: item.can_be_sold || true,
            canBePurchased: item.can_be_purchased || true,
            isReturnable: item.is_returnable || true,
            trackBatchNumber: item.track_batch_number || false,
            isStorageLocationEnabled: item.is_storage_location_enabled || false,
            
            // Zoho CRM
            isLinkedWithZohoCRM: item.is_linked_with_zohocrm || false,
            zcrmProductId: item.zcrm_product_id || null,
            purchaseAccountId: item.purchase_account_id || null,
            purchaseAccountName: item.purchase_account_name || null,
            accountId: item.account_id || null,
            accountName: item.account_name || null,
            purchaseDescription: item.purchase_description || null,
            
            // Storefront
            showInStorefront: item.show_in_storefront || false,
            
            // Physical attributes
            length: item.length || null,
            width: item.width || null,
            height: item.height || null,
            weight: item.weight || null,
            weightUnit: item.weight_unit || null,
            dimensionUnit: item.dimension_unit || null,
            
            // Product flags
            isComboProduct: item.is_combo_product || false,
            hasAttachment: item.has_attachment || false,
            
            // Image (local path)
            imageName: localImagePath || item.image_name || null,
            imageType: item.image_type || null,
            imageDocumentId: item.image_document_id || null,
            
            // Tags
            tags: item.tags || [],
            
            // Timestamps
            zohoItemId: item.item_id,
            zohoCreatedTime: item.created_time ? new Date(item.created_time) : null,
            zohoLastModifiedTime: item.last_modified_time ? new Date(item.last_modified_time) : null,
            lastStockSync: new Date(),
          },
        });

        synced++;
      } catch (error) {
        console.error(`[Sync] Error syncing item ${item.item_id}:`, error);
        errors++;
      }
    }

    console.log(`[Sync] Complete: ${synced} synced, ${errors} errors`);

    return NextResponse.json({
      success: true,
      synced,
      errors,
      totalFetched: items.length,
    });
  } catch (error) {
    console.error("[Sync] Error:", error);

    if (error instanceof ZohoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to sync products" },
      { status: 500 }
    );
  }
}

