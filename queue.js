#!/usr/bin/env node

var amqp = require('amqplib/callback_api');
const buy = require('./buy.js');
amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }
        var queue = 'rpc_queue';

        channel.assertQueue(queue, {
            durable: false
        });
        channel.prefetch(1);
        console.log(' [x] Awaiting RPC requests');
        channel.consume(queue, function reply(msg) {
            var data = (msg.content.toString());
            console.log(" [.] fib", data);
            var req = JSON.parse(data);
            const symbol = req.symbol;
            const qty = req.qty;
            const acct_no = req.acct_no;
            const rtr_no = req.rtr_no;
            const username = req.username;



            buy.buyStock(symbol, qty, acct_no, rtr_no, username).then(function(result) {
                channel.sendToQueue(msg.properties.replyTo,
                    Buffer.from(result.toString()), {
                        correlationId: msg.properties.correlationId
                    });

                channel.ack(msg);
            });
        });
    });
});