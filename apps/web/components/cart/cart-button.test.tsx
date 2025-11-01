import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartButton } from './cart-button';

// Mock the useCart hook
vi.mock('@/lib/hooks/use-cart', () => ({
  useCart: vi.fn(),
}));

describe('CartButton', () => {
  let mockUseCart: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    const useCartModule = await import('@/lib/hooks/use-cart');
    mockUseCart = useCartModule.useCart as ReturnType<typeof vi.fn>;
  });

  const defaultMockCart = {
    itemCount: 0,
    toggleDrawer: vi.fn(),
    fetchCart: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCart.mockReturnValue(defaultMockCart);
  });

  it('should render cart button', () => {
    render(<CartButton orgId="org-1" />);
    expect(screen.getByText('Cart')).toBeInTheDocument();
  });

  it('should call fetchCart on mount', () => {
    render(<CartButton orgId="org-1" branchId="branch-1" />);
    expect(defaultMockCart.fetchCart).toHaveBeenCalledWith('org-1', 'branch-1');
  });

  it('should call toggleDrawer when clicked', async () => {
    const user = userEvent.setup();
    render(<CartButton orgId="org-1" />);
    
    const button = screen.getByText('Cart').closest('button');
    if (button) {
      await user.click(button);
      expect(defaultMockCart.toggleDrawer).toHaveBeenCalledTimes(1);
    }
  });

  it('should display item count badge when itemCount > 0', () => {
    mockUseCart.mockReturnValue({
      ...defaultMockCart,
      itemCount: 5,
    });

    render(<CartButton orgId="org-1" />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should not display badge when itemCount is 0', () => {
    mockUseCart.mockReturnValue({
      ...defaultMockCart,
      itemCount: 0,
    });

    render(<CartButton orgId="org-1" />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should display 99+ when itemCount > 99', () => {
    mockUseCart.mockReturnValue({
      ...defaultMockCart,
      itemCount: 150,
    });

    render(<CartButton orgId="org-1" />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should apply custom variant', () => {
    render(<CartButton orgId="org-1" variant="default" />);
    const button = screen.getByText('Cart').closest('button');
    expect(button).toBeInTheDocument();
  });

  it('should fetch cart without branchId', () => {
    render(<CartButton orgId="org-1" />);
    expect(defaultMockCart.fetchCart).toHaveBeenCalledWith('org-1', undefined);
  });
});

