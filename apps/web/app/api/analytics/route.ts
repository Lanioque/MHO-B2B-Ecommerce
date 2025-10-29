/**
 * Analytics API Route
 * GET /api/analytics - Get organization analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionHelper } from '@/lib/auth-helpers';
import { getAnalyticsService } from '@/lib/services/analytics-service';
import { handleError } from '@/lib/middleware/error-handler';
import { subDays, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionHelper = new SessionHelper(session);
    const membership = sessionHelper.getMembership();

    if (!membership) {
      return NextResponse.json(
        { error: 'No organization membership found' },
        { status: 403 }
      );
    }

    // Check role-based access - customers cannot access analytics
    if (membership.role === 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Access denied. Analytics are only available for admins and staff.' },
        { status: 403 }
      );
    }

    const orgId = membership.orgId;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const branchId = searchParams.get('branchId') || undefined;
    const period = searchParams.get('period') || '30'; // Default to 30 days

    // Calculate date range
    let startDate: Date;
    let endDate: Date = new Date();

    if (startDateParam && endDateParam) {
      startDate = parseISO(startDateParam);
      endDate = parseISO(endDateParam);
    } else {
      // Use period preset
      const days = parseInt(period, 10);
      startDate = subDays(new Date(), days);
    }

    // Initialize analytics service
    const analyticsService = getAnalyticsService();

    // Get analytics data
    const analytics = await analyticsService.getOrganizationAnalytics({
      orgId,
      startDate,
      endDate,
      branchId,
    });

    return NextResponse.json({
      success: true,
      data: analytics,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

