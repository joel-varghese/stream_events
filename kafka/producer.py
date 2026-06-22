from confluent_kafka import Producer
import json
import uuid

producer = Producer({'bootstrap.servers': 'localhost:9092'})

def delivery_report(err, msg):
    if err:
        print(f" Delivery failed: {err}")
    else:
        print(f" Delivered you see {msg.value().decode('utf-8')}")
        print(dir(msg))
        print(f"Delivered to {msg.topic()} : partition {msg.partition()} : at offset {msg.offset()}")

order = {
    "order_id": str(uuid.uuid4()),
    "user": "kanigno",
    "item": "",
    "quantity": 2 
}

value =json.dumps(order).encode("utf-8")

producer.produce(
    topic="orders", 
    value=value,
    callback=delivery_report)

producer.flush()