const amqp = require('amqplib');


/**
 * CONSUMER
 */

async function connect() {
    try {
        const connection = await amqp.connect("amqp://localhost:5672");
        const channel = await connection.createChannel();
        const queue = await channel.assertQueue("render");

        // One video at a time
        channel.prefetch(1)

        channel.consume(queue.queue, msg => {
            console.log(JSON.parse(msg.content.toString()));
            setTimeout(() => {
                console.log('generated');
                channel.ack(msg)
            }, 10000);
        });
    } catch (error) {
        console.error(error);
    }
}

connect();



/**
 * SERVER
 */

const msg = { videoID: 'asdefe' }
async function connect() {
    try {
        const connection = await amqp.connect("amqp://localhost:5672");
        const channel = await connection.createChannel();
        const queue = await channel.assertQueue("render");
        channel.sendToQueue(queue.queue, Buffer.from(JSON.stringify(msg)));
        setTimeout(async () => {
            await connection.close();
        }, 1000);
        console.log("sent");
    } catch (error) {
        console.error(error);
    }
}

connect();