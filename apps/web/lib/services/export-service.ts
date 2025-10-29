/**
 * Export Service
 * Generate CSV and PDF exports for analytics data
 */

import { OrganizationAnalytics } from './analytics-service';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
// @ts-ignore - jspdf-autotable doesn't have type definitions
import 'jspdf-autotable';

export class ExportService {
  /**
   * Export analytics data to CSV
   */
  exportAnalyticsToCSV(data: OrganizationAnalytics): string {
    // Prepare CSV data
    const csvData: any[] = [];

    // Summary metrics
    csvData.push(['Metric', 'Value']);
    csvData.push(['Total Spent Amount', this.formatCurrency(data.totalRevenue)]);
    csvData.push(['Total Orders', data.totalOrders]);
    csvData.push(['Total Customers', data.totalCustomers]);
    csvData.push(['Average Order Value', this.formatCurrency(data.averageOrderValue)]);
    csvData.push(['Average Cost Per Employee', this.formatCurrency(data.averageCostPerEmployee)]);
    csvData.push([]);

    // Spending by period
    csvData.push(['Spending Over Time']);
    csvData.push(['Date', 'Spent Amount', 'Orders']);
    data.revenueByPeriod.forEach((item) => {
      csvData.push([item.date, this.formatCurrency(item.revenue), item.orders]);
    });
    csvData.push([]);

    // Orders by status
    csvData.push(['Orders by Status']);
    csvData.push(['Status', 'Count', 'Spent Amount']);
    data.ordersByStatus.forEach((item) => {
      csvData.push([item.status, item.count, this.formatCurrency(item.revenue)]);
    });
    csvData.push([]);

    // Top products
    csvData.push(['Top Products']);
    csvData.push(['Product', 'SKU', 'Spent Amount', 'Orders', 'Quantity']);
    data.topProducts.forEach((item) => {
      csvData.push([
        item.productName,
        item.sku,
        this.formatCurrency(item.revenue),
        item.orders,
        item.quantity,
      ]);
    });
    csvData.push([]);

    // Category breakdown
    csvData.push(['Category Breakdown']);
    csvData.push(['Category', 'Spent Amount', 'Orders', 'Percentage']);
    data.categoryBreakdown.forEach((item) => {
      csvData.push([
        item.category,
        this.formatCurrency(item.revenue),
        item.orders,
        `${item.percentage.toFixed(2)}%`,
      ]);
    });

    // Convert to CSV string
    return Papa.unparse(csvData);
  }

  /**
   * Export analytics data to PDF
   */
  exportAnalyticsToPDF(
    data: OrganizationAnalytics,
    startDate: Date,
    endDate: Date
  ): Blob {
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Analytics Report', 14, yPosition);
    yPosition += 10;

    // Date range
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`,
      14,
      yPosition
    );
    yPosition += 15;

    // Summary metrics table
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary Metrics', 14, yPosition);
    yPosition += 8;

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Total Spent Amount', this.formatCurrency(data.totalRevenue)],
        ['Total Orders', data.totalOrders.toString()],
        ['Total Customers', data.totalCustomers.toString()],
        ['Average Order Value', this.formatCurrency(data.averageOrderValue)],
        [
          'Average Cost Per Employee',
          this.formatCurrency(data.averageCostPerEmployee),
        ],
      ],
    });
    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Orders by status
    if (data.ordersByStatus.length > 0) {
      doc.text('Orders by Status', 14, yPosition);
      yPosition += 8;

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Status', 'Count', 'Spent Amount']],
        body: data.ordersByStatus.map((item) => [
          item.status,
          item.count.toString(),
          this.formatCurrency(item.revenue),
        ]),
      });
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Top products
    if (data.topProducts.length > 0) {
      doc.text('Top Products', 14, yPosition);
      yPosition += 8;

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Product', 'SKU', 'Spent Amount', 'Orders', 'Quantity']],
        body: data.topProducts.slice(0, 10).map((item) => [
          item.productName.substring(0, 30),
          item.sku,
          this.formatCurrency(item.revenue),
          item.orders.toString(),
          item.quantity.toString(),
        ]),
      });
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

      // Category breakdown
      if (data.categoryBreakdown.length > 0) {
        doc.text('Category Breakdown', 14, yPosition);
        yPosition += 8;

        (doc as any).autoTable({
          startY: yPosition,
          head: [['Category', 'Spent Amount', 'Orders', 'Percentage']],
        body: data.categoryBreakdown.map((item) => [
          item.category,
          this.formatCurrency(item.revenue),
          item.orders.toString(),
          `${item.percentage.toFixed(2)}%`,
        ]),
      });
    }

    // Generate blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }

  /**
   * Format currency
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Format date
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

// Factory function
export function getExportService(): ExportService {
  return new ExportService();
}

