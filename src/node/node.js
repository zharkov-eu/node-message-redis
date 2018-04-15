"use strict";

const MessageRepository = require("../repository/message");
const RegistryRepository = require("../repository/registry");
const {stringGeneratorLetter} = require('../lib/generator');

/**
 * @type {Node} Node - экземпляр сервиса (нода)
 * @property {boolean} Node.generator - флаг генератора
 * @property {number} Node.number - номер ноды
 * @property {string} Node.name - название ноды
 * @property {string} Node.handleQueue - название очереди сообщений ноды
 * @property {number} Node.checkGeneratorInt - интервал проверки генератора
 * @property {number} Node.checkNodesInt - интервал проверки нод
 * @property {number} Node.updateNodeAliveInt - интервал обновления Alive-поля ноды
 * @property {number} Node.updateGeneratorAliveInt - интервал обновления Alive-поля генератора
 * @property {number} Node.generateMessageInt - интервал генерации сообщений
 * @property {number} Node.handleMessageInt - интервал обработки сообщений
 */
class Node {
  constructor(client) {
    this.generator = false;
    this.registry = new RegistryRepository(client);
    this.message = new MessageRepository(client);

    this.activateUpdateNodeAliveInt = () => {
      this.updateNodeAliveInt = setInterval(() => this.registry.setAlive(this), 500);
    };
    this.activateUpdateGeneratorAliveInt = () => {
      this.updateGeneratorAliveInt = setInterval(() => this.registry.setGeneratorAlive(this), 500);
    };
    this.activateCheckGeneratorInt = () => {
      this.checkGeneratorInt = setInterval(this.checkGenerator.bind(this), 500);
    };
    this.activateCheckNodesInt = () => {
      this.checkNodesInt = setInterval(this.checkNodes.bind(this), 500);
    };
    this.activateGenerateMessageInt = () => {
      this.generateMessageInt = setInterval(() => this.message.enqueueMessage(stringGeneratorLetter(30)), 500);
    };
    this.activateHandleMessageInt = () => {
      this.handleMessageInt = setInterval(this.handleMessage.bind(this), 100);
    };
  };

  /**
   * Регистрация Node
   * Задается имя формата node:x, очередь обработки формата queue:x
   * Создается alive-поле и определяется поведение
   * В данной реализации Node сначала работает в режиме Handler вне зависимости
   * от существования генератора, что вызывает задержку <500мс перед назначением первого генератора
   */
  registryNode() {
    return new Promise((resolve, reject) => {
      this.registry.registryNodeNumber()
          .then(number => {
            this.number = number;
            this.name = 'node:' + number;
            this.handleQueue = 'queue:' + number;
            return this.registry.registryNodeName(this);
          })
          .then(() => {
            this.startRoleBehavior();
            console.log("Я " + this.name);
            resolve(this);
          })
          .catch(error => reject(error));
    });
  }

  /**
   * Проверка nodeList на предмет выключившихся Node
   * В данной реализации осуществляется генератором с интервалом,
   * указанным в конструкторе Node
   */
  checkNodes() {
    return new Promise((resolve, reject) => {
      this.registry.listNodes()
          .then(nodeNames => {
            const checkAlivePromises = [];
            nodeNames.forEach((nodeName) => {
              checkAlivePromises.push(new Promise(resolve => {
                this.registry.checkAlive({name: nodeName})
                    .then(() => resolve({name: nodeName, alive: true}))
                    .catch(() => resolve({name: nodeName, alive: false}));
              }));
            });
            return Promise.all(checkAlivePromises);
          })
          .then(nodes => {
            const removeNodePromises = [];
            nodes.forEach((node) => {
              if (!node.alive) removeNodePromises.push(this.registry.removeNode(node));
            });
            return Promise.all(removeNodePromises);
          })
          .then(() => resolve())
          .catch(error => reject(error));
    });
  }

  /**
   * Проверка генератора
   * Перед проверкой проверяется NodeList, однако, существует ситуация, когда
   * новый генератор выключится до переназначения, возможно, стоит добавить обработчик
   * В данной реализации генератором выбирается Node с наименьшим номером
   */
  checkGenerator() {
    return new Promise((resolve, reject) => {
      this.registry.checkGeneratorAlive()
          .then(alive => Promise.resolve({alive: true}),
              dead => new Promise(resolve => {
                this.checkNodes()
                    .then(() => resolve({alive: false}))
              })
          )
          .then(node => {
            return node.alive ? Promise.resolve({bypass: true}) : this.registry.electionGenerator();
          })
          .then(reply => {
            if (reply && reply.bypass) return Promise.resolve();
            else {
              if (this.name === reply) {
                this.generator = true;
                this.startRoleBehavior();
              }
              console.log(reply + ' является Generator');
            }
          })
          .then(() => resolve())
          .catch(error => reject(error));
    });
  }

  /**
   * Проверка сообщений, заполнение очереди специфичной для Node
   */
  checkMessage() {
    return new Promise((resolve, reject) => {
      this.message.messageQueueSize(this)
          .then(size => {
            return size > 5 ? this.message.enqueueHandleMessage(this) : Promise.resolve();
          })
          .then(() => resolve())
          .catch(error => reject(error));
    });
  }

  /**
   * Обработка сообщений, сообщения берутся из очереди, специфичной для Node
   * Предусмотрена 5% вероятность ошибки
   */
  handleMessage() {
    return new Promise((resolve, reject) => {
      this.message.dequeueHandleMessage(this)
          .then(message => {
            return (Math.random() < 0.05) ? this.message.enqueueErrorMessage(message) : Promise.resolve();
          }, () => {
            return this.checkMessage();
          })
          .then(() => resolve())
          .catch(error => reject(error));
    });
  }

  /**
   * Модель поведения
   * Возможные модели: Generator | Handler
   */
  startRoleBehavior() {
    this.activateUpdateNodeAliveInt();
    if (this.generator) {
      clearInterval(this.checkGeneratorInt);
      clearInterval(this.handleMessageInt);
      this.activateUpdateGeneratorAliveInt();
      this.activateCheckNodesInt();
      this.activateGenerateMessageInt();
    }
    else {
      this.activateCheckGeneratorInt();
      this.activateHandleMessageInt();
    }
  };
}

module.exports = Node;
