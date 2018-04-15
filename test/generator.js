"use strict";

const assert = require('assert');
const {stringGeneratorLetter} = require('../src/lib/generator');

describe('Generator', () => {
  it('Возвращает строки', () => {
    assert.strictEqual(typeof stringGeneratorLetter(30), 'string');
  });
  it('Возвращает строки длинной в 30 символов', () => {
    assert.strictEqual(stringGeneratorLetter(30).length, 30);
  });
  it('Возвращает случайно генерируемые строки', () => {
    let dictionary = {}, coincidence = false;
    for (let i = 0; i < 100; i++) {
      let result = stringGeneratorLetter(30);
      if (dictionary[result]) {
        coincidence = true;
      }
      dictionary[result] = true;
    }
    assert(!coincidence, 'В результате итерации 100 элементов есть совпадения!');
  });
});
