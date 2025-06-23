
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Утилита для объединения классов Tailwind CSS
 * Комбинирует классы с помощью clsx и устраняет конфликты с помощью twMerge
 *
 * @param inputs - Массив классов для объединения
 * @returns Строка с объединенными классами
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}