/**
 * Shared utilities for the credits API routes.
 */

import type { NextRequest } from "next/server";

/** Credit pack definitions */
export interface CreditPack {
  id: string;
  label: string;
  price: number;      // USDC user pays
  credits: number;    // USDC credits received
  feePercent: number;  // platform fee percentage
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "starter",  label: "Starter",  price: 0.50,  credits: 0.10,  feePercent: 80 },
  { id: "standard", label: "Standard", price: 2.00,  credits: 1.00,  feePercent: 50 },
  { id: "pro",      label: "Pro",      price: 5.00,  credits: 3.75,  feePercent: 25 },
  { id: "power",    label: "Power",    price: 10.00, credits: 9.00,  feePercent: 10 },
];

export type ServiceName = "metengine" | "elsa";

const VALID_SERVICES: ServiceName[] = ["metengine", "elsa"];

export function isValidService(s: string): s is ServiceName {
  return VALID_SERVICES.includes(s as ServiceName);
}

/**
 * Validate auth token by calling the API2 backend /me endpoint.
 * Returns the user_id if valid, null otherwise.
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;

  try {
    const res = await fetch(`${apiUrl}/me`, {
      headers: { Authorization: authHeader },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user_id?: number; telegram_id?: number };
    const id = data.user_id ?? data.telegram_id;
    return id != null ? String(id) : null;
  } catch {
    return null;
  }
}
