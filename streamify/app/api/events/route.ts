import { NextResponse } from "next/server";
import { type EventType, getEventMessage } from "@/lib/events";
import { publishOrderEvent } from "../services/orderService";
import { publishDisputeEvent } from "../services/disputeService";
import { publishPaymentEvent } from "../services/paymentService";


const VALID_TYPES: EventType[] = ["order", "dispute", "payment"];

const publishers: Record<EventType, (event: object) => Promise<void>> = {
  order: publishOrderEvent,
  dispute: publishDisputeEvent,
  payment: publishPaymentEvent,
}

export async function POST(request: Request) {
  const body = await request.json();
  const type = body.type as EventType;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  const event = {
    id: crypto.randomUUID(),
    type,
    message: getEventMessage(type),
    createdAt: new Date().toISOString(),
  };

  await publishers[type](event);

  return NextResponse.json(event);
}
