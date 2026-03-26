import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null | undefined, fmt = 'dd MMM yyyy HH:mm') {
  if (!date) return '—';
  return format(new Date(date), fmt, { locale: th });
}

export function formatRelative(date: string | null | undefined) {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: th });
}
