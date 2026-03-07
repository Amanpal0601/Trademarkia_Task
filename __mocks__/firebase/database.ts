/**
 * Mock for firebase/database
 */
const mockSnapshot = {
  exists: jest.fn(() => true),
  val: jest.fn(() => ({})),
};

export const ref = jest.fn(() => ({ key: "mock-key-123" }));

export const set = jest.fn(() => Promise.resolve());

export const get = jest.fn(() => Promise.resolve(mockSnapshot));

export const push = jest.fn(() => ({ key: "new-doc-id-456" }));

export const update = jest.fn(() => Promise.resolve());

export const remove = jest.fn(() => Promise.resolve());

export const onValue = jest.fn(
  (_ref: unknown, callback: (snap: typeof mockSnapshot) => void) => {
    callback(mockSnapshot);
    return jest.fn(); // unsubscribe
  },
);

export const onDisconnect = jest.fn(() => ({
  remove: jest.fn(),
}));

export const serverTimestamp = jest.fn(() => Date.now());

export const getDatabase = jest.fn(() => ({}));
