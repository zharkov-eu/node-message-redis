"use strict";

const redis = require("redis");
const config = require("./config.json");
const Node = require('./src/node/node');

const client = redis.createClient({
    host: config.redis.host,
    port: config.redis.port
});

const node = new Node(client);

function start() {
  client.on('connect', () => node.registryNode());
}

function getErrors() {
  client.on('connect', () => {
    const fetchErrorMessage = () => {
      node.message.errorMessageQueueSize()
          .then(count => {
            return count > 0 ? node.message.dequeueErrorMessages() : Promise.resolve()
          })
          .then(message => {
            if (!message) {
              console.log("\nNo more messages available");
              process.exit(0)
            } else {
              console.log(message);
              fetchErrorMessage();
            }
          })
          .catch(error => {
            console.error(JSON.stringify(error));
            process.exit(1);
          })
    }
  });
}

start();
