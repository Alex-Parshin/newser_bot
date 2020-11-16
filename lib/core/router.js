'use strict' // Активация "строгого" режима

import Yandex from '../engines/yandex'; // Импорт обработчика поисковой системы Yandex.News
import Google from '../engines/google'; // Импорт обработчика поисковой системы Google.News
import Rambler from '../engines/rambler'; // Импорт обработчика поисковой системы Rambler.News

import { log } from './utils'; // Импорт функции обработки и записи логов

/**
 * @function router 
 * @description Направление запросов к соответствующим обработчикам
 * @param {Object} singleQueryData = {
 *   query,
 *   pages,
 *   id_request,
 *   id_engine,
 *   page,
 *   config,
 *   url
 * }
 */
export default async function router(singleQueryData) {
    return await new Promise(async(resolve, reject) => {
        switch (Number(singleQueryData.id_engine)) { // Ветвление с помощью оператора switch по id_engine
            case 4:
                try {
                    resolve(await new Yandex(singleQueryData).index()); // Инициализация класса Yandex и возвращение результата успешного вызова основного метода
                } catch (err) {
                    log(`Ошибка: ${err}`); // Вывод информации в лог
                    reject(`Ошибка: ${err}`); // Возвращение результата неуспешного вызова основного метода
                }
                break;
            case 7:
                try {
                    resolve(await new Rambler(singleQueryData).index()); // Инициализация класса Rambler и возвращение результата успешного вызова основного метода
                } catch (err) {
                    log(`Ошибка: ${err}`); // Вывод информации в лог
                    reject(`Ошибка: ${err}`); // Возвращение результата неуспешного вызова основного метода
                }
                break;
            case 3:
                try {
                    resolve(await new Google(singleQueryData).getRSS()); // Инициализация класса Google и возвращение результата успешного вызова метода RSS
                    // resolve(await new Google(singleQueryData).index()); // Инициализация класса Google и возвращение результата успешного вызова основного метода
                } catch (err) {
                    log(`Ошибка: ${err}`); // Вывод информации в лог
                    reject(`Ошибка: ${err}`); // Возвращение результата неуспешного вызова основного метода
                }
                break;
            default:
                log("Такого движка нет"); // Вывод информации в лог
                reject("Такого движка нет"); // Возвращение результата неуспешной обработки id_engine
                break;
        }
    })
}