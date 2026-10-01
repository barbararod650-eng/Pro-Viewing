import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


// Formats money with the right symbol: "$1,234.00" or "€1,234.00"
export function formatMoney(amount: number, currency: string): string {
  const symbol = currency === 'EUR' ? '€' : '$';
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}