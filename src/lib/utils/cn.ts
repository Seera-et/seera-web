import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Joins class names and lets a caller's utility win over a component default. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
