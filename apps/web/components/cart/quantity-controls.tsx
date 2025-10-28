/**
 * Quantity Controls Component
 * Reusable +/- buttons for quantity selection
 */

'use client';

import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface QuantityControlsProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function QuantityControls({
  quantity,
  onIncrease,
  onDecrease,
  min = 0,
  max,
  disabled = false,
  size = 'md',
}: QuantityControlsProps) {
  const canDecrease = quantity > min;
  const canIncrease = !max || quantity < max;

  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default';
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base';
  const minWidth = size === 'sm' ? 'min-w-[40px]' : size === 'lg' ? 'min-w-[60px]' : 'min-w-[50px]';

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size={buttonSize}
        onClick={onDecrease}
        disabled={disabled || !canDecrease}
        className="h-8 w-8 p-0"
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <div className={`${textSize} font-semibold text-center ${minWidth}`}>
        {quantity}
      </div>
      
      <Button
        variant="outline"
        size={buttonSize}
        onClick={onIncrease}
        disabled={disabled || !canIncrease}
        className="h-8 w-8 p-0"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

