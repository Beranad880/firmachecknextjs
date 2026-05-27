import { describe, expect, it } from 'vitest';
import { isValidIco } from '../src/lib/validation';

describe('isValidIco', () => {
  it('accepts exactly eight digits', () => {
    expect(isValidIco('27082440')).toBe(true);
    expect(isValidIco('00177041')).toBe(true);
  });

  it('rejects values with the wrong length', () => {
    expect(isValidIco('1234567')).toBe(false);
    expect(isValidIco('123456789')).toBe(false);
    expect(isValidIco('')).toBe(false);
  });

  it('rejects non-numeric input', () => {
    expect(isValidIco('ABC12345')).toBe(false);
    expect(isValidIco('1234 678')).toBe(false);
    expect(isValidIco('1234-678')).toBe(false);
  });
});
