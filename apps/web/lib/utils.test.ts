import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const result = cn('foo', false && 'bar', 'baz');
    expect(result).toBe('foo baz');
  });

  it('should handle conditional classes with true', () => {
    const result = cn('foo', true && 'bar', 'baz');
    expect(result).toBe('foo bar baz');
  });

  it('should handle empty strings', () => {
    const result = cn('foo', '', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle undefined and null', () => {
    const result = cn('foo', undefined, null, 'bar');
    expect(result).toBe('foo bar');
  });

  it('should merge Tailwind classes correctly', () => {
    // twMerge should deduplicate conflicting Tailwind classes
    const result = cn('px-2 py-1', 'px-4');
    // px-4 should override px-2
    expect(result).toContain('px-4');
    expect(result).toContain('py-1');
    expect(result).not.toContain('px-2');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['foo', 'bar'], 'baz');
    expect(result).toBe('foo bar baz');
  });

  it('should handle objects with boolean values', () => {
    const result = cn({
      foo: true,
      bar: false,
      baz: true,
    });
    expect(result).toBe('foo baz');
  });

  it('should handle mixed inputs', () => {
    const result = cn(
      'base-class',
      true && 'conditional-class',
      false && 'skipped-class',
      ['array-class-1', 'array-class-2'],
      {
        'object-class-1': true,
        'object-class-2': false,
      }
    );
    expect(result).toContain('base-class');
    expect(result).toContain('conditional-class');
    expect(result).toContain('array-class-1');
    expect(result).toContain('array-class-2');
    expect(result).toContain('object-class-1');
    expect(result).not.toContain('skipped-class');
    expect(result).not.toContain('object-class-2');
  });

  it('should return empty string for no inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle Tailwind class conflicts (last wins)', () => {
    const result = cn('bg-red-500', 'bg-blue-500');
    expect(result).toContain('bg-blue-500');
    expect(result).not.toContain('bg-red-500');
  });
});



