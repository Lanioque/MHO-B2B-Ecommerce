import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantityControls } from './quantity-controls';

describe('QuantityControls', () => {
  it('should render quantity controls', () => {
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();
    render(<QuantityControls quantity={5} onIncrease={onIncrease} onDecrease={onDecrease} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should call onIncrease when plus button is clicked', async () => {
    const user = userEvent.setup();
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();
    render(<QuantityControls quantity={5} onIncrease={onIncrease} onDecrease={onDecrease} />);
    
    const buttons = screen.getAllByRole('button');
    const plusButton = buttons[1]; // Second button is the plus button
    await user.click(plusButton);
    expect(onIncrease).toHaveBeenCalledTimes(1);
  });

  it('should call onDecrease when minus button is clicked', async () => {
    const user = userEvent.setup();
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();
    render(<QuantityControls quantity={5} onIncrease={onIncrease} onDecrease={onDecrease} />);
    
    const buttons = screen.getAllByRole('button');
    const minusButton = buttons[0]; // First button is the minus button
    await user.click(minusButton);
    expect(onDecrease).toHaveBeenCalledTimes(1);
  });

  it('should disable decrease button when quantity is at minimum', () => {
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();
    render(<QuantityControls quantity={0} onIncrease={onIncrease} onDecrease={onDecrease} min={0} />);
    
    const buttons = screen.getAllByRole('button');
    const minusButton = buttons[0]; // First button is the minus button
    expect(minusButton).toBeDisabled();
  });

  it('should disable increase button when quantity is at maximum', () => {
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();
    render(<QuantityControls quantity={10} onIncrease={onIncrease} onDecrease={onDecrease} max={10} />);
    
    const buttons = screen.getAllByRole('button');
    const plusButton = buttons[1]; // Second button is the plus button
    expect(plusButton).toBeDisabled();
  });

  it('should disable all buttons when disabled prop is true', () => {
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();
    render(<QuantityControls quantity={5} onIncrease={onIncrease} onDecrease={onDecrease} disabled />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should use custom minimum value', () => {
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();
    render(<QuantityControls quantity={2} onIncrease={onIncrease} onDecrease={onDecrease} min={1} />);
    
    expect(screen.getByText('2')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    const minusButton = buttons[0]; // First button is the minus button
    expect(minusButton).not.toBeDisabled(); // Quantity (2) > min (1)
  });
});

