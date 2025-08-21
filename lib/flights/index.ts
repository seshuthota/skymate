import { mockProvider } from './mock';
import type { FlightsProvider } from './provider';

// For prototype: choose provider via env, default to mock
export const provider: FlightsProvider = (() => {
  const p = process.env.PROVIDER?.toLowerCase();
  switch (p) {
    // case 'duffel': return duffelProvider
    default:
      return mockProvider;
  }
})();

