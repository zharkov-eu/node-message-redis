"use strict";

const {promisify} = require("util");

class MessageRepository {
  constructor(client) {
    this.client = client;
    this.incr = this.client.incr;
    this.rpushAsync = promisify(this.client.rpush).bind(this.client);
    this.rpopAsync = promisify(this.client.rpop).bind(this.client);
    this.rpoplpushAsync = promisify(this.client.rpoplpush).bind(this.client);
    this.llenAsync = promisify(this.client.llen).bind(this.client);
  }

  enqueueMessage(message) {
    return new Promise((resolve, reject) => {
      this.rpushAsync('messageQueue', message).then(reply => {
        if (!reply) reject(new Error('Ошибка при вставке в messageQueue'));
        return resolve(reply);
      }).catch(error => reject(error));
    });
  };

  enqueueHandleMessage(node) {
    return new Promise((resolve, reject) => {
      this.rpoplpushAsync('messageQueue', node.handleQueue).then(reply => {
        if (!reply) reject(new Error('Ошибка при перемещении сообщений в локальную очередь ' + node.handleQueue));
        return resolve(reply);
      }).catch(error => reject(error));
    });
  };

  messageQueueSize(node) {
    return new Promise((resolve, reject) => {
      this.llenAsync('messageQueue').then(reply => {
        return reply ? resolve(reply) : resolve(0);
      }).catch(error => reject(error));
    });
  };

  dequeueHandleMessage(node) {
    return new Promise((resolve, reject) => {
      this.rpopAsync(node.handleQueue).then(reply => {
        if (!reply) reject(new Error('Ошибка при получении элемента в локальной очереди ' + node.handleQueue));
        return resolve(reply);
      }).catch(error => reject(error));
    });
  };

  enqueueErrorMessage(message) {
    return new Promise((resolve, reject) => {
      this.rpushAsync('errorMessages', message).then(reply => {
        if (!reply) reject(new Error('Ошибка при занесении в errorMessages'));
        return resolve(reply);
      }).catch(error => reject(error));
    });
  };

  errorMessageQueueSize() {
    return new Promise((resolve, reject) => {
      this.llenAsync('errorMessages').then(reply => {
        return reply ? resolve(reply) : resolve(0);
      }).catch(error => reject(error));
    });
  };

  dequeueErrorMessages() {
    return new Promise((resolve, reject) => {
      this.rpopAsync('errorMessages').then(reply => {
        if (!reply) reject(new Error('Ошибка при получении элемента из errorMessages'));
        return resolve(reply);
      }).catch(error => reject(error));
    });
  };
}

module.exports = MessageRepository;
