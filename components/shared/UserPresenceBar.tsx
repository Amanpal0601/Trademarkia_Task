/**
 * UserPresenceBar – shows coloured circles for each active collaborator
 * in the current document.
 */

"use client";

import { usePresenceStore } from "@/store/usePresenceStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function UserPresenceBar() {
  const users = usePresenceStore((s) => s.users);
  const currentUid = useAuthStore((s) => s.user?.uid);

  const others = users.filter((u) => u.uid !== currentUid && u.displayName);

  if (others.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {others.map((u) => (
        <div
          key={u.uid}
          title={u.displayName ?? "Unknown"}
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: u.color ?? "#888" }}
        >
          {(u.displayName ?? "?").charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  );
}
