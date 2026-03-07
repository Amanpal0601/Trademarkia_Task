/**
 * Mock for firebase/auth
 */
const mockUser = {
  uid: "test-uid-123",
  displayName: "Test User",
  email: "test@example.com",
  photoURL: null,
};

export const getAuth = jest.fn(() => ({
  currentUser: mockUser,
}));

export const GoogleAuthProvider = jest.fn();

export const signInWithPopup = jest.fn(() =>
  Promise.resolve({ user: mockUser }),
);

export const signOut = jest.fn(() => Promise.resolve());

export const updateProfile = jest.fn(() => Promise.resolve());

export const onAuthStateChanged = jest.fn(
  (_auth: unknown, callback: (user: typeof mockUser | null) => void) => {
    callback(mockUser);
    return jest.fn(); // unsubscribe
  },
);
