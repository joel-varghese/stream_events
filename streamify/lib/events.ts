export type EventType = "order" | "dispute" | "payment";

export type Notification = {
  id: string;
  type: EventType;
  message: string;
  created_at: string;
};

export const EVENT_LABELS: Record<EventType, string> = {
  order: "Order",
  dispute: "Dispute",
  payment: "Payment",
};

export function getEventMessage(type: EventType): string {
  const messages: Record<EventType, string> = {
    order: "New order received",
    dispute: "Dispute opened",
    payment: "Payment processed",
  };
  return messages[type];
}
