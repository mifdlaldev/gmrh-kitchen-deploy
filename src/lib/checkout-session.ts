"use client";

export type StoredCheckoutSnapshot = {
  orderId: string;
  customerName: string;
  totalPrice: number;
  customerEmail?: string;
  deliveryAddress?: string;
  status?: string;
  createdAt: number;
};

const LAST_CHECKOUT_KEY = "gmrh:last-checkout";

export function saveLastCheckout(snapshot: StoredCheckoutSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LAST_CHECKOUT_KEY, JSON.stringify(snapshot));
}

export function readLastCheckout() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(LAST_CHECKOUT_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as StoredCheckoutSnapshot;
    const maxAgeMs = 1000 * 60 * 60;

    if (!parsed?.createdAt || Date.now() - parsed.createdAt > maxAgeMs) {
      clearLastCheckout();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearLastCheckout() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LAST_CHECKOUT_KEY);
}
