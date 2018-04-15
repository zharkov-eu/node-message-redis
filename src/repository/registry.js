"use strict";

const {promisify} = require("util");

class RegistryRepository {
  constructor(client) {
    this.client = client;
    this.incr = this.client.incr.bind(this.client);
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.rpushAsync = promisify(this.client.rpush).bind(this.client);
    this.setexAsync = promisify(this.client.setex).bind(this.client);
    this.lremAsync = promisify(this.client.lrem).bind(this.client);
    this.lindexAsync = promisify(this.client.lindex).bind(this.client);
    this.lrangeAsync = promisify(this.client.lrange).bind(this.client);
  }

  /**
   * Получение номера для новой ноды в nodeCount
   * @return {Promise<number>}
   */
  registryNodeNumber() {
    return new Promise((resolve, reject) => {
      this.incr('nodeCount');
      this.getAsync('nodeCount').then(reply => {
        if (!reply) reject(new Error('Ошибка при регистрации nodeNumber'));
        return resolve(reply);
      }).catch(error => reject(error));
    });
  };

  /**
   * Регистрация имени для ноды в nodeList
   * @param {Node} node
   * @return {Promise<Node>}
   */
  registryNodeName(node) {
    return new Promise((resolve, reject) => {
      this.rpushAsync('nodeList', node.name).then(reply => {
        if (!reply) reject(new Error('Ошибка при регистрации nodeName'));
        return resolve(node);
      }).catch(error => reject(error));
    });
  };

  /**
   * Установка Alive-поля в активное значение
   * @param {Node} node
   * @return {Promise<any>}
   */
  setAlive(node) {
    return new Promise((resolve, reject) => {
      this.setexAsync(node.name, 1, 1).then(reply => {
        if (!reply) reject(new Error('Ошибка при обновлении setAlive'));
        return resolve(reply);
      }).catch(error => reject(error));
    });
  };

  listNodes() {
    return new Promise((resolve, reject) => {
      this.lrangeAsync('nodeList', 0, -1).then((reply) => {
        if (!reply) reject(new Error('Не удалось получить список Node'));
        return resolve(reply);
      }).catch(error => reject(error));
    });
  };

  checkAlive(node) {
    return new Promise((resolve, reject) => {
      this.getAsync(node.name).then(reply => {
        if (!reply) reject(new Error(node.name + ' не отвечает'));
        return resolve(reply);
      }).catch(error => reject(error));
    });
  };

  removeNode(node) {
    return new Promise((resolve, reject) => {
      this.lremAsync('nodeList', 1, node.name).then(reply => {
        if (!reply) reject(new Error(node.name + ' не отвечает и не была удалена!'));
        return resolve();
      }).catch(error => reject(error));
    });
  };

  setGeneratorAlive(node) {
    return new Promise((resolve, reject) => {
      this.setexAsync('nodeGenerator', 1, node.name).then(reply => {
        if (!reply) reject(new Error(`Ошибка при регистрации ${node.name} в качестве Generator-а`));
        return resolve(reply);
      }).catch(error => reject(error));
    });
  };

  checkGeneratorAlive() {
    return new Promise((resolve, reject) => {
      this.getAsync('nodeGenerator').then(reply => {
        if (!reply) reject(new Error("Генератор не доступен"));
        return resolve(reply);
      }).catch(error => reject(error));
    });
  };

  electionGenerator() {
    return new Promise((resolve, reject) => {
      let generatorName;
      this.lindexAsync('nodeList', 0).then(reply => {
        if (!reply) reject(new Error('Ошибка при получении старейшего Node'));
        generatorName = reply;
        return this.setGeneratorAlive({name: reply});
      }).then(reply => {
        return resolve(generatorName);
      }).catch(error => reject(error));
    });
  };
}

module.exports = RegistryRepository;
