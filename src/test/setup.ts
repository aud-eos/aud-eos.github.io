import "@testing-library/jest-dom";
import { vi, beforeEach } from "vitest";

// Use UTC so date-formatting tests are timezone-independent
process.env.TZ = "UTC";

// Provide a working in-memory localStorage (jsdom 29 file-backed impl may not be available)
const localStorageStore: Record<string, string> = {};
vi.stubGlobal( "localStorage", {
  getItem: ( key: string ) => localStorageStore[key] ?? null,
  setItem: ( key: string, value: string ) => { localStorageStore[key] = value; },
  removeItem: ( key: string ) => { delete localStorageStore[key]; },
  clear: () => { Object.keys( localStorageStore ).forEach( key => delete localStorageStore[key] ); },
  get length() { return Object.keys( localStorageStore ).length; },
  key: ( index: number ) => Object.keys( localStorageStore )[index] ?? null,
});

beforeEach( () => {
  // Reset localStorage state between every test
  Object.keys( localStorageStore ).forEach( key => delete localStorageStore[key] );
});
