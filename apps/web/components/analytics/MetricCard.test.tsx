import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from './MetricCard';
import { DollarSign } from 'lucide-react';

describe('MetricCard', () => {
  it('should render metric card with title and value', () => {
    render(<MetricCard title="Total Revenue" value={1000} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('should format currency values for revenue/cost', () => {
    render(<MetricCard title="Total Revenue" value={1000} />);
    // AED currency format
    expect(screen.getByText(/AED|1,000/)).toBeInTheDocument();
  });

  it('should format number values with commas', () => {
    render(<MetricCard title="Total Orders" value={1234} />);
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('should render string values as-is', () => {
    render(<MetricCard title="Status" value="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should display description when provided', () => {
    render(<MetricCard title="Revenue" value={1000} description="Last 30 days" />);
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('should display positive trend', () => {
    render(<MetricCard title="Revenue" value={1000} trend={{ value: 10.5, isPositive: true }} />);
    expect(screen.getByText(/\+10\.5%/)).toBeInTheDocument();
  });

  it('should display negative trend', () => {
    render(<MetricCard title="Revenue" value={1000} trend={{ value: -5.2, isPositive: false }} />);
    expect(screen.getByText(/-5\.2%/)).toBeInTheDocument();
  });

  it('should display zero trend', () => {
    render(<MetricCard title="Revenue" value={1000} trend={{ value: 0, isPositive: true }} />);
    expect(screen.getByText(/0\.0%/)).toBeInTheDocument();
  });

  it('should render icon when provided', () => {
    render(<MetricCard title="Revenue" value={1000} icon={<DollarSign data-testid="icon" />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});



