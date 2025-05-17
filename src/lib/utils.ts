
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: string | number | undefined): string {
  if (value === undefined || value === '') return "$0";
  
  // Remove any existing currency symbols or commas
  const numericValue = typeof value === 'string' 
    ? value.replace(/[$,]/g, '') 
    : value.toString();
  
  // Try to parse as a number
  const parsedValue = parseFloat(numericValue);
  
  // If parsing failed, return a default value
  if (isNaN(parsedValue)) return "$0";
  
  // Format with $ and commas for thousands
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(parsedValue);
}
