import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "streamify-api",
    brokers: [process.env.KAFKA_BROKER ?? "localhost:9092"],
});

const producer = kafka.producer();
let connected = false;

export async function publishEvent(topic: string, event: object) {
    if (!connected) {
        await producer.connect();
        connected = true;
    }

    await producer.send({
        topic,
        messages: [
            {
                key: crypto.randomUUID(),
                value: JSON.stringify(event),
            },
        ],
    });
}