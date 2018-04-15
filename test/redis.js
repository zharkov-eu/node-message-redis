// "use strict";
//
// const assert = require('assert');
// const redis = require('../src/repository');
//
// function check( done, func ) {
//   try {
//     func();
//     done();
//   } catch( e ) {
//     done( e );
//   }
// }
//
// describe('Redis:Registry', function() {
// 	it('Инрементирует общий счетчик', function(done) {
// 		let increment = false;
// 		redis.registryNodeNumber().then((number) => {
// 			let num = number;
// 			redis.registryNodeNumber().then((number) => {
// 				if (+number == +num + 1) increment = true;
// 			});
// 		});
// 		setTimeout(() => {
// 			check(done, () => {
// 				assert(increment, 'Не инкрементирует общий счетчик');
// 			});
// 		}, 500);
// 	});
// 	it('Добавляет node в NodeList', function(done) {
// 		let inlist = false;
// 		let node = {
// 			name: 'node::'
// 		};
// 		redis.registryNodeName(node).then(() => {
// 			redis.removeNode(node.name).then(
// 			() => {
// 				inlist = true;
// 			},
// 			() => {
// 				inlist = false;
// 			});
// 		});
// 		setTimeout(() => {
// 			 check(done, () => {
// 			 	assert(inlist, 'Ошибка при добавлении в NodeList');
// 			 });
// 		}, 500);
// 	});
// });
