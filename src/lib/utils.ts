import { type ClassValue, clsx } from "clsx"
import { difference } from "next/dist/build/utils"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

