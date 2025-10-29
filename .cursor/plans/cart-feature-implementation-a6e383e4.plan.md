<!-- a6e383e4-d170-4471-b259-9b4c3c0ec474 ec5780ed-b27e-4292-9a36-4e8ced6d2d77 -->
# Analytics Dashboard for Customers

## Overview
Build a comprehensive analytics dashboard with role-based access for admins/owners and branch managers. The dashboard will feature advanced visualizations, financial metrics, order analytics, and custom business metrics including employee cost analysis, purchase breakdowns, and quotation tracking.

## Implementation Plan

### 1. Database Schema Updates

Add new models and fields to support quotations and analytics:

**Prisma Schema (`apps/web/prisma/schema.prisma`)**
- Add `Quotation` model with fields: id, orgId, branchId, customerId, number, totalCents, currency, status, validUntil, items (relation), createdAt, updatedAt
- Add `QuotationItem` model similar to OrderItem structure
- Add indexes for analytics queries on Order (orgId, createdAt, status), Invoice (orgId, createdAt, status)
- Create migration for new tables

### 2. Backend API Endpoints

**Analytics API (`apps/web/app/api/analytics/route.ts`)**
- GET endpoint with query params: `startDate`, `endDate`, `branchId` (optional)
- Return aggregated metrics:
  - Total revenue (sum of paid orders)
  - Total orders count by status
  - Total customers count
  - Average order value
  - Revenue by date (for charts)
  - Orders by status breakdown
  - Top products by revenue
  - Top categories by revenue
  - Average cost per employee (totalCents / employee count)
  - Recent orders (last 10)
  - Recent quotations (last 10)
- Use Prisma aggregations and groupBy for performance
- Implement role-based filtering (branch managers see only their branch)

**Quotations API (`apps/web/app/api/quotations/route.ts`)**
- GET: List quotations with filtering (orgId, branchId, status, date range)
- POST: Create new quotation
- GET `/api/quotations/:id`: Get quotation details
- PATCH `/api/quotations/:id`: Update quotation (convert to order, update status)

### 3. Service Layer

**Analytics Service (`apps/web/lib/services/analytics-service.ts`)**
- `getOrganizationAnalytics(orgId, startDate, endDate, branchId?)` - fetch all metrics
- `getRevenueByPeriod(orgId, period, branchId?)` - daily/weekly/monthly revenue
- `getTopProducts(orgId, limit, startDate, endDate)` - best sellers
- `getCategoryBreakdown(orgId, startDate, endDate)` - purchase by category
- `getAverageCostPerEmployee(orgId, startDate, endDate)` - total orders / employee count
- `getOrdersByStatus(orgId, startDate, endDate)` - order status distribution
- Use Prisma aggregations for efficiency

**Quotation Service (`apps/web/lib/services/quotation-service.ts`)**
- `createQuotation(data)` - generate quotation from cart or manual entry
- `convertToOrder(quotationId)` - convert approved quotation to order
- `getQuotations(filters)` - list with filtering
- `updateStatus(quotationId, status)` - update quotation status

### 4. Frontend Dashboard Page

**Analytics Dashboard Page (`apps/web/app/analytics/page.tsx`)**

**Layout Structure:**
- Header with date range picker (Last 7 days, 30 days, 90 days, 1 year, custom range)
- Branch selector for admins (optional filter by branch)
- Export buttons (CSV, PDF)

**Metrics Cards Section (Top Row):**
- Total Revenue (with % change vs previous period)
- Total Orders (with trend indicator)
- Average Order Value (with % change)
- Total Customers (with growth rate)
- Average Cost Per Employee (total revenue / employee count)

**Charts Section:**
- Revenue Over Time (Line chart using recharts)
- Orders by Status (Pie chart)
- Purchase by Category (Bar chart - horizontal)
- Purchase by Products (Top 10 products bar chart)

**Tables Section:**
- Latest Orders table (Date, Order ID, Customer, Amount, Status)
  - Clickable rows linking to order details
  - Pagination support
  - Status badges with colors
- Latest Quotations table (Date, Quotation ID, Customer, Amount, Status, Valid Until)
  - Actions: View, Convert to Order, Download PDF
  - Status indicators (Pending, Approved, Rejected, Expired)

### 5. UI Components

**Chart Components (`apps/web/components/analytics/`)**
- `RevenueChart.tsx` - Line chart for revenue over time
- `StatusPieChart.tsx` - Pie chart for order status distribution
- `CategoryBarChart.tsx` - Horizontal bar chart for category breakdown
- `ProductBarChart.tsx` - Bar chart for top products
- Use `recharts` library for all visualizations

**Analytics Components:**
- `MetricCard.tsx` - Reusable card showing metric with trend indicator
- `DateRangePicker.tsx` - Date range selector with presets
- `ExportButton.tsx` - Export to CSV/PDF functionality
- `LatestOrdersTable.tsx` - Orders table with sorting/filtering
- `LatestQuotationsTable.tsx` - Quotations table with actions

### 6. Export Functionality

**Export Service (`apps/web/lib/services/export-service.ts`)**
- `exportAnalyticsToCSV(data)` - Generate CSV file with analytics data
- `exportAnalyticsToPDF(data)` - Generate PDF report using jsPDF or similar
- Include all metrics, charts (as images), and tables
- Format currency and dates properly

**Export API (`apps/web/app/api/analytics/export/route.ts`)**
- GET endpoint with query param `format` (csv or pdf)
- Generate file server-side and return as download
- Use same filters as analytics endpoint

### 7. Quotation Management

**Quotations Page (`apps/web/app/quotations/page.tsx`)**
- List view with filters (status, date range, branch)
- Create new quotation button
- Table showing all quotations with actions
- Status badges and filtering

**Create Quotation Modal/Page (`apps/web/app/quotations/new/page.tsx`)**
- Product selection (similar to cart)
- Quantity and pricing
- Customer selection
- Valid until date
- Save as draft or send to customer
- Option to convert directly to order

### 8. Navigation Updates

Update dashboard navigation to include:
- "Analytics" link in main navigation
- "Quotations" link in main navigation
- Add analytics icon to quick actions on dashboard

### 9. Dependencies

Add to `package.json`:
- `recharts` - Chart library for React
- `date-fns` - Date manipulation and formatting
- `jspdf` and `jspdf-autotable` - PDF generation
- `papaparse` - CSV generation/parsing

### 10. Performance Optimizations

- Implement caching for analytics queries (Redis)
- Use database indexes on frequently queried fields
- Lazy load charts (use React.lazy and Suspense)
- Implement pagination for large datasets
- Use React Query for data fetching with stale-while-revalidate

### 11. Role-Based Access

- Admins/Owners: See all organization data, all branches
- Branch Managers: See only their branch data (filtered automatically)
- Customers: Not allowed access to analytics dashboard
- Implement middleware checks in API routes

### 12. Testing Considerations

- Seed database with sample orders, quotations, and employees for testing
- Test date range filtering edge cases
- Verify chart rendering with various data sizes
- Test export functionality with large datasets
- Verify role-based access controls

## Key Files to Create/Modify

**New Files:**
- `apps/web/app/analytics/page.tsx`
- `apps/web/app/quotations/page.tsx`
- `apps/web/app/quotations/new/page.tsx`
- `apps/web/app/api/analytics/route.ts`
- `apps/web/app/api/analytics/export/route.ts`
- `apps/web/app/api/quotations/route.ts`
- `apps/web/app/api/quotations/[id]/route.ts`
- `apps/web/lib/services/analytics-service.ts`
- `apps/web/lib/services/quotation-service.ts`
- `apps/web/lib/services/export-service.ts`
- `apps/web/components/analytics/RevenueChart.tsx`
- `apps/web/components/analytics/StatusPieChart.tsx`
- `apps/web/components/analytics/CategoryBarChart.tsx`
- `apps/web/components/analytics/ProductBarChart.tsx`
- `apps/web/components/analytics/MetricCard.tsx`
- `apps/web/components/analytics/DateRangePicker.tsx`
- `apps/web/components/analytics/ExportButton.tsx`
- `apps/web/components/analytics/LatestOrdersTable.tsx`
- `apps/web/components/analytics/LatestQuotationsTable.tsx`

**Modified Files:**
- `apps/web/prisma/schema.prisma` - Add Quotation models
- `apps/web/app/dashboard/page.tsx` - Add analytics link
- `apps/web/package.json` - Add chart libraries

## Technical Approach

- Use server-side rendering for initial data load
- Client-side filtering and date range changes
- Responsive design for mobile/tablet viewing
- Implement loading skeletons for better UX
- Use TypeScript interfaces for all data types
- Follow existing patterns from orders/invoices implementation


### To-dos

- [ ] Add Quotation and QuotationItem models to Prisma schema with proper relations and indexes
- [ ] Create and run Prisma migration for quotations tables
- [ ] Implement analytics service with methods for revenue, orders, categories, products, and employee cost analysis
- [ ] Create quotation service with CRUD operations and convert-to-order functionality
- [ ] Build analytics API endpoint with aggregations and role-based filtering
- [ ] Create quotations API endpoints for listing, creating, and managing quotations
- [ ] Build reusable chart components (Revenue line chart, Status pie chart, Category/Product bar charts)
- [ ] Create MetricCard component with trend indicators and percentage changes
- [ ] Implement DateRangePicker with presets (7/30/90 days, 1 year, custom)
- [ ] Build main analytics dashboard page with all metrics, charts, and tables sections
- [ ] Create LatestOrdersTable component with sorting, pagination, and status badges
- [ ] Build LatestQuotationsTable with actions (view, convert, download)
- [ ] Create quotations list page with filtering and status management
- [ ] Build create quotation page/modal with product selection and customer assignment
- [ ] Implement export service for CSV and PDF generation of analytics data
- [ ] Create export API endpoint for downloading analytics reports
- [ ] Add Analytics and Quotations links to main navigation and dashboard quick actions
- [ ] Install required packages: recharts, date-fns, jspdf, jspdf-autotable, papaparse
- [ ] Implement role-based access control in analytics and quotations API endpoints
- [ ] Add Redis caching for frequently accessed analytics queries