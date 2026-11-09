"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { getUnreadCountsAction } from "@/app/(app)/actions/social";
import { useLiveUpdates } from "@/lib/realtime";

export type UnreadCounts = { messages: number; notifications: number; requests: number };

const Ctx = createContext<UnreadCounts>({ messages: 0, notifications: 0, requests: 0 });

/** Contadores de no leídos para la navegación, vivos mientras se usa la app. */
export function UnreadProvider({
  userId,
  initial,
  children,
}: {
  userId: string;
  initial: UnreadCounts;
  children: React.ReactNode;
}) {
  const [counts, setCounts] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    // Cada navegación trae contadores frescos del servidor.
    setPrevInitial(initial);
    setCounts(initial);
  }
  const refresh = useCallback(() => {
    getUnreadCountsAction().then(setCounts).catch(() => {});
  }, []);
  useLiveUpdates(
    `unread:${userId}`,
    [
      { table: "notifications", filter: `user_id=eq.${userId}` },
      { table: "messages" },
    ],
    refresh,
    45000,
  );
  return <Ctx.Provider value={counts}>{children}</Ctx.Provider>;
}

export const useUnread = () => useContext(Ctx);
