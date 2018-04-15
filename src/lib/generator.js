"use strict";

/**
 * Генератор символьной последовательности
 * Латинский алфавит (нижний регистр) и числа
 * @param {number} n - длина результирующей последовательности
 * @return {string}
 */
exports.stringGeneratorLetter = (n) => {
    const string = [];
    const dictionary = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const dictionaryLength = dictionary.length;
    while (string.length < n)
        string.push(dictionary[Math.random() * dictionaryLength | 0]);
    return string.join("");
};
