// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
// Jest setup: polyfill TextEncoder/TextDecoder for Node test environment
const util = require("util");

// Source - https://stackoverflow.com/a/79342026
// Posted by Lê Nguyễn Lan Hương
// Retrieved 2025-11-22, License - CC BY-SA 4.0

// jest.setup.ts
jest.mock("next-auth/react", () => {
  const originalModule = jest.requireActual("next-auth/react");
  const mockSession = {
    expires: new Date(Date.now() + 2 * 86400).toISOString(),
    user: { username: "admin", id: 1 },
  };
  return {
    __esModule: true,
    ...originalModule,
    useSession: jest.fn(
      () => ({ data: mockSession, status: "authenticated" }) // return type is [] in v3 but changed to {} in v4
    ),
  };
});

// Set on globalThis first (works in both Node and jsdom)
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = util.TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = util.TextDecoder;
}

// Also set on global
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = util.TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = util.TextDecoder;
}

// jsdom / browser-like globals
if (typeof global.window !== "undefined") {
  if (typeof window.TextEncoder === "undefined") {
    window.TextEncoder = util.TextEncoder;
  }
  if (typeof window.TextDecoder === "undefined") {
    window.TextDecoder = util.TextDecoder;
  }
}

jest.mock("next/font/google", () => ({
  Inter: () => ({ className: "inter", style: { fontFamily: "Inter" } }),
  Lusitana: () => ({
    className: "lusitana",
    style: { fontFamily: "Lusitana" },
  }),
}));
