import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock global API fetch URL since Vite loads VITE_API_URL via import.meta.env
// We can define it on process.env or import.meta.env mock if needed.
if (typeof window !== "undefined") {
  // Mock simple DOM APIs if needed (e.g. scrollIntoView)
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}
