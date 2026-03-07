/**
 * AuthProvider – client component that sits at the root layout level.
 *
 * Listens to Firebase onAuthStateChanged and pushes the current user
 * into the Zustand auth store so every component can read it reactively.
 *
 * Uses window.location.pathname inside the callback (not the React
 * `usePathname` hook) because the callback fires asynchronously and
 * a closure over the hook value would be stale.
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const router = useRouter();

  useEffect(() => {
    // Escape hatch for E2E tests to bypass Firebase Auth
    if (typeof window !== "undefined" && window.localStorage.getItem("e2e_test_user")) {
      setUser(JSON.parse(window.localStorage.getItem("e2e_test_user")!));
      setLoading(false);
      if (window.location.pathname === "/auth") {
        router.push("/");
      }
      return;
    }

    const unsubscribe = AuthService.onAuthStateChanged((firebaseUser) => {
      // Read the CURRENT path at callback time, not the stale closure value
      const currentPath = window.location.pathname;

      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName ?? "Anonymous",
          email: firebaseUser.email ?? "",
          photoURL: firebaseUser.photoURL ?? undefined,
        });
        // Redirect away from login if authenticated
        if (currentPath === "/auth") {
          router.push("/");
        }
      } else {
        setUser(null);
        // Redirect to login if not authenticated
        if (currentPath !== "/auth") {
          router.push("/auth");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
