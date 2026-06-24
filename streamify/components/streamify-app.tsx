"use client";

import { useEffect, useRef, useState } from "react";
import {
  EVENT_LABELS,
  type EventType,
  type Notification,
} from "@/lib/events";
import { BellIcon } from "./bell-icon";
import { supabase } from "@/lib/supabase";
import { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

const EVENT_BUTTONS: {
  type: EventType;
  label: string;
  className: string;
}[] = [
  {
    type: "order",
    label: "Orders",
    className:
      "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500",
  },
  {
    type: "dispute",
    label: "Disputes",
    className: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500",
  },
  {
    type: "payment",
    label: "Payments",
    className: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500",
  },
];

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

export function StreamifyApp() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pending, setPending] = useState<EventType | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setPanelOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload: RealtimePostgresInsertPayload<Notification>) => {
          const notification = payload.new as Notification;
          setNotifications((current) => [notification, ...current]);
          setPanelOpen(true);
        }
      )
      .subscribe();

      return () => {
        supabase.removeChannel(channel);
      }
  }, []);

  async function triggerEvent(type: EventType) {
    setPending(type);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        throw new Error("Failed to emit event");
      }

    } catch {
      setNotifications((current) => [
        {
          id: crypto.randomUUID(),
          type,
          message: `Failed to emit ${EVENT_LABELS[type].toLowerCase()} event`,
          created_at: new Date().toISOString(),
        },
        ...current,
      ]);
      setPanelOpen(true);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <h1 className="text-xl font-semibold tracking-tight">Streamify</h1>

          <div className="relative" ref={panelRef}>
            <button
              type="button"
              onClick={() => setPanelOpen((open) => !open)}
              className="relative rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              aria-label={`Notifications${notifications.length ? `, ${notifications.length} unread` : ""}`}
              aria-expanded={panelOpen}
            >
              <BellIcon className="h-6 w-6" />
              {notifications.length > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {notifications.length > 99 ? "99+" : notifications.length}
                </span>
              )}
            </button>

            {panelOpen && (
              <div className="absolute right-0 z-10 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                <div className="border-b border-zinc-100 px-4 py-3">
                  <p className="text-sm font-semibold">Notifications</p>
                </div>

                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-zinc-500">
                    No notifications yet. Trigger an event to get started.
                  </p>
                ) : (
                  <ul className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <li
                        key={notification.id}
                        className="border-b border-zinc-100 px-4 py-3 last:border-b-0"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">
                              {EVENT_LABELS[notification.type]}
                            </p>
                            <p className="mt-0.5 text-sm text-zinc-600">
                              {notification.message}
                            </p>
                          </div>
                          <time
                            className="shrink-0 text-xs text-zinc-400"
                            dateTime={notification.created_at}
                          >
                            {formatTime(notification.created_at)}
                          </time>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Event Triggers
          </h2>
          <p className="mt-2 text-zinc-600">
            Emit sample events into the pipeline. Notifications will appear in
            the bell menu.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            {EVENT_BUTTONS.map(({ type, label, className }) => (
              <button
                key={type}
                type="button"
                onClick={() => triggerEvent(type)}
                disabled={pending !== null}
                className={`rounded-lg px-8 py-3 text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
              >
                {pending === type ? "Emitting..." : label}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
