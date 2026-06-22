import { publishEvent } from "@/lib/kafka";

export async function publishPaymentEvent(event: object) {
  await publishEvent("payments", event);
}