/**
 * Название программы: Бот поиска новостных материалов системы Newser
 * Описание: Программа предназначена для автоматического сбора новостных материалов в средствах массовой информации в сети Интернет
 * Версия: 1.2
 * Дата релиза: 16.11.2020
 * @author Храмов Сергей (trykhramov@gmail.com)
 * Организация: Технополис "ЭРА"
 * Заказчик: Главный вычислительный центр ВС РФ
 * Лицензия: MTU
 * Исходный код: https://github.com/hramov/newser_bot.git
 */

"use strict"; // Активация "строгого" режима

import io from "socket.io-client"; // Обработчик сокет-клиента
import dotenv from "dotenv"; // Использование переменных окружения, указанных в .env файле
dotenv.config();
import { log } from './lib/core/utils/utils' // Функция логирования событий
import lifecycle from "./lib/core/lifecycle.js"; // Класс жизненного цикла программы
import store from "./lib/core/store"; // Менеджер состояния приложения

const port = process.env.SERVER_PORT; // Порт сервера
const host = process.env.SERVER_HOST; // Хост сервера

console.log(`Подключаюсь к сокет-серверу http://${host}:${port}`, 0);

const socket = io.connect(`http://${host}:${port}`); // Подключение к сокет-серверу по заданным host и port

store.setSocket(socket); // Запись экземпляра подключения в менеджер состояния
socket.emit("who_am_i", 'puppeteer_bot'); // Вызов события аутентификации подключенного клиента

log('Ожидаю команды СТАРТ', 0); // Вывод информации в лог

lifecycle.mainQueue(); // Запуск основного процесса ПО, ожидающего разрешения на начало поиска

/** 
 * @description Прослушивание события start для запуска процесса поиска
 * с передачей в качестве параметров:
 * source - источник получения поисковых запросов (server, local), по умолчанию - server
 * pages - глубина поиска, в страницах, по умолчанию - 1
 * url - адрес, по которому происходит получение запросов
 * engines - поисковые системы, участвующие в процессе поиска новостей
 */
socket.on("start", ({ source, pages, url, engines }) => {
    store.setEngines(engines); // Запись поисковых систем в менеджер состояния
    lifecycle.start({ source, pages, url, engines }); // Запуск процесса поиска новостей с передачей полученных параметров
})

/** 
 * @description Прослушивание события restart с последующим вызовом соответсвующей функции класса Lifecycle 
 * (при использовании в docker-compose.yml опции restart: always произойдет перезапуск приложения)
 */
socket.on('restart', () => {
    lifecycle.restart();
})

/** 
 * @description Прослушивание события stop с последующим вызовом соответсвующей функции класса Lifecycle
 * (т.н. "мягкая" остановка без выхода из процесса)
 */
socket.on("stop", () => {
    lifecycle.stop();
})

/** 
 * @description Прослушивание события getStatusBot с последующим получением текущего статуса приложения из store
 * и вызовом события setStatus с передачей информации о текущем статусе приложения
 */
socket.on('getStatusToBot', () => {
    const status = store.getStatus();
    socket.emit('setStatus', status);
})

/** 
 * @description Прослушивание события disconnect с последующим выводом в консоль информации об отключении сервера
 * и завершением работы программы
 */
socket.on('disconnect', () => {
    console.log('Сервер отключился. Завершение работы'); // Вывод информации в лог
    process.exit(0);
})