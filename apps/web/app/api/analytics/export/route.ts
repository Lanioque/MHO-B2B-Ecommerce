/**
 * Analytics Export API Route
 * GET /api/analytics/export - Export analytics as CSV or PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionHelper } from '@/lib/auth-helpers';
import { getAnalyticsService } from '@/lib/services/analytics-service';
import { getExportService } from '@/lib/services/export-service';
import { handleError } from '@/lib/middleware/error-handler';
import { subDays, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionHelper = new SessionHelper(session);
    const membership = sessionHelper.getMembership();

    if (!membership) {
      return NextResponse.json(
        { error: 'No organization membership found' },
        { status: 403 }
      );
    }

    // Check role-based access
    if (membership.role === 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const orgId = membership.orgId;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const branchId = searchParams.get('branchId') || undefined;
    const period = searchParams.get('period') || '30';

    // Calculate date range
    let startDate: Date;
    let endDate: Date = new Date();

    if (startDateParam && endDateParam) {
      startDate = parseISO(startDateParam);
      endDate = parseISO(endDateParam);
    } else {
      const days = parseInt(period, 10);
      startDate = subDays(new Date(), days);
    }

    // Get analytics data
    const analyticsService = getAnalyticsService();
    const analytics = await analyticsService.getOrganizationAnalytics({
      orgId,
      startDate,
      endDate,
      branchId,
    });

    // Export service
    const exportService = getExportService();

    if (format === 'pdf') {
      const pdfBlob = exportService.exportAnalyticsToPDF(
        analytics,
        startDate,
        endDate
      );
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="analytics-${Date.now()}.pdf"`,
        },
      });
    } else {
      // CSV export
      const csvContent = exportService.exportAnalyticsToCSV(analytics);

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    return handleError(error);
  }
}

