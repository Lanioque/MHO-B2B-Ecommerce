/**
 * Cart Item Component
 * Individual cart item with image, details, quantity controls, and remove button
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QuantityControls } from './quantity-controls';
import { CartItemResponseDto } from '@/lib/dto/CartDto';
import { Trash2, Package2 } from 'lucide-react';

interface CartItemProps {
  item: CartItemResponseDto;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
  compact?: boolean;
}

export function CartItem({ item, onUpdateQuantity, onRemove, compact = false }: CartItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(cents / 100);
  };

  const handleIncrease = async () => {
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.id, item.quantity + 1);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecrease = async () => {
    if (item.quantity === 1) {
      // If quantity is 1 and user decreases, remove the item
      handleRemove();
      return;
    }
    
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.id, item.quantity - 1);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      await onRemove(item.id);
    } catch (error) {
      console.error('Failed to remove item:', error);
      setIsUpdating(false);
    }
  };

  if (compact) {
    return (
      <div className="py-3 border-b last:border-b-0 w-full space-y-2">
        {/* First Row: Image, Details, Remove */}
        <div className="flex items-start gap-2">
          {/* Image - Temporarily disabled to avoid 404 errors */}
          <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
            <div className="w-full h-full flex items-center justify-center">
              <Package2 className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium break-words line-clamp-2">{item.productName}</h4>
            <p className="text-xs text-gray-500 truncate mt-0.5">SKU: {item.productSku}</p>
          </div>

          {/* Remove Button */}
          <div className="flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isUpdating}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Second Row: Quantity Controls */}
        <div className="flex items-center pl-14">
          <QuantityControls
            quantity={item.quantity}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            disabled={isUpdating}
            size="sm"
            min={1}
          />
        </div>
      </div>
    );
  }

  // Full size view
  return (
    <div className="flex items-start gap-4 py-4 border-b last:border-b-0">
      {/* Image - Temporarily disabled to avoid 404 errors */}
      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        <div className="w-full h-full flex items-center justify-center">
          <Package2 className="w-10 h-10 text-gray-400" />
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold mb-1 break-words line-clamp-2">{item.productName}</h3>
        <p className="text-sm text-gray-500 mb-2 truncate">SKU: {item.productSku}</p>
        <p className="text-sm text-gray-600 break-words">Pricing available upon final quotation</p>
        <div className="mt-3">
          <QuantityControls
            quantity={item.quantity}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            disabled={isUpdating}
            min={1}
          />
        </div>
      </div>

      {/* Price & Remove */}
      <div className="flex flex-col items-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={isUpdating}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
        <p className="text-sm text-gray-600 mt-2 break-words text-right max-w-[150px] ml-auto">Subtotal available upon final quotation</p>
      </div>
    </div>
  );
}

