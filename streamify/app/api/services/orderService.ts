import { publishEvent } from "@/lib/kafka";

export async function publishOrderEvent(event: object) {
  await publishEvent("orders", event);
}