/**
 * Mock for firebase/app
 */
export const initializeApp = jest.fn(() => ({ name: "[DEFAULT]" }));
export const getApps = jest.fn(() => []);
export const getApp = jest.fn(() => ({ name: "[DEFAULT]" }));
