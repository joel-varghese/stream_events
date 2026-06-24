from confluent_kafka import Consumer
from supabase import create_client
from dotenv import load_dotenv
import os
import json

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
# remove after confirming

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

consumer_config = {
    "bootstrap.servers": "localhost:9092",
    "group.id": "order-tracker",
    "auto.offset.reset": "earliest"
}

consumer = Consumer(consumer_config)

consumer.subscribe(["orders", "disputes", "payments"])

print("Listening on all topics . . . ")

try:
    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            print(" Got an error",msg.error())
            continue

        value = msg.value().decode("utf-8")
        event = json.loads(value)

        print(f"Here is what I got {event}")

        supabase.table("notifications").insert({
            "id": event["id"],
            "type": event["type"],
            "message": event["message"],
            "created_at": event["created_at"]
        }).execute()

        print(f"Inserted into DB: {event['id']}")

except KeyboardInterrupt:
    print("/n XXXX We stalled for good")

finally:
    consumer.close()
