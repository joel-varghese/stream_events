import { publishEvent } from "@/lib/kafka";

export async function publishDisputeEvent(event: object) {
  await publishEvent("disputes", event);
}