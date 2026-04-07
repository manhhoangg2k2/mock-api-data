import { TOUR_STORAGE_KEY } from "@/components/endpoint/constants";

export const TOUR_PENDING_AFTER_AUTH_KEY = "PaperMock_should_auto_endpoint_tour";

export function markEndpointTourPendingAfterAuth(): void {
  try {
    if (localStorage.getItem(TOUR_STORAGE_KEY) === "1") return;
    localStorage.setItem(TOUR_PENDING_AFTER_AUTH_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasPendingEndpointTourAfterAuth(): boolean {
  try {
    return localStorage.getItem(TOUR_PENDING_AFTER_AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

export function markEndpointTourFinished(): void {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, "1");
    localStorage.removeItem(TOUR_PENDING_AFTER_AUTH_KEY);
  } catch {
    /* ignore */
  }
}
