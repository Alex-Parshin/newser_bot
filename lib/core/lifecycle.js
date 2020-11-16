'use strict' // Активация "строгого" режима

import puppeteer from 'puppeteer'; // Импорт пакета puppeteer для автоматизированного тестирования на основе Headless Chrome
import dotenv from 'dotenv'; // Использование переменных окружения, указанных в .env файле
dotenv.config();

/** 
 * Импорт класса Router, отвечающего за передачу поисковых запросов классам,
 * соответствующим определенным поисковым агрегаторам
 */
import router from './router';
import {
    getRandom, // Получение случайного значения в диапазоне от min до max
    calculateStatistics, // Подсчет статистики поиска
    secToMinToHoursConvert // Приведение времени в секундах к минутам и часам
} from './utils';
import store from './store'; // Импорт экземпляра класса менеджера состояния
import { log } from './utils'; // Функция обработки и записи логов

/**
 * @class Lifecycle
 * @description Основной класс программы. Отвечает за жизненный цикл и управляет процессом поиска
 */
class Lifecycle {

    constructor() {
        this.options = { // Параметры, которые передаются на вход puppeteer при запуске браузера
            args: [
                "--no-sandbox",
                "--unhandled-rejections=strict",
                "--disable-notifications"
            ],
            headless: true, // Графический интерфейс (true - отключен, false - включен). 
            // Запуск с графическим режимом только от имени пользователя
            ignoreHTTPSErrors: true,
            ignoreDefaultArgs: ['--disable-extensions']
        };

        // Переменные, отвечающие за процесс работы программы
        this.singleQueryData = {}; // Информация, необходимая для обработки конкретного запроса
        this.isGo = true; // Разрешение / запрет процесса поиска на уровне программы
        this.isServer = false; // Разрешение / запрет процесса поиска на уровне управления
        this.INTERVAL = 3000; // Интервал опроса переменной isGo на разрешение начать обработку нового запроса

        // Переменные, отвечающие за сбор статистики поиска
        this.goTime = new Date(); // Фиксация времени начала работы программы
        this.queryCount = 0; // Счетчик количества обработанных запросов
        this.allNews = 0; // Счетчик количества полученных новостей
    }

    /**
     * @method start
     * @description Запуска процесса поиска. Все парамеры, указанные ниже - поля объекта singleQueryData
     * @param source string - источник запросов
     * @param pages number - глубина поиска, в страницах
     * @param url string - адрес получения запросов
     * @param engines [id_engine: number] boolean - используемые источники
     */
    async start(data) {
        this.singleQueryData = data; // Запись данных для обработки конкретного запроса
        this.isServer = true; // Разрешение процесса поиска на уровне управления
        this.isGo = true; // Разрешение процесса поиска на уровне программы
        store.setStatus(1); // Установка статуса работы программы 1 - активно
    }

    /**
     * @method mainQueue
     * @description Отвечает за управление процессом работы программы и запуск процесса поиска новостей
     */
    async mainQueue() {
        const browser = await puppeteer.launch(this.options); // Запуск экземпляра браузера с передачей параметров запуска
        log("Браузер запущен", 0); // Вывод информации в лог

        setInterval(async() => { // Главный цикл работы программы
            if (this.isGo && this.isServer) { // Проверка разрешения на запуск обработки запроса
                log("Начинаю обработку", 1); // Вывод информации в лог
                this.isGo = false; // Запрет процесса поиска на уровне программы

                /** 
                 * Получение объекта запроса с удаленного сервера
                 * queryData = {
                 *   query: string - поисковой запрос
                 *   id_request: number - идентификатор запроса
                 * }
                 */
                const queryData = await store.getQuery(this.singleQueryData.source);
                this.singleQueryData.query = queryData.query; // Запись запроса
                this.singleQueryData.id_request = queryData.id_request; // Запись идентификатора запроса

                for (let i = 0; i < Object.keys(this.singleQueryData.engines).length; i++) { // Перебор ключей объекта engines 

                    /**
                     * Проверка на состояние значения ключа true (система в списке используемых)
                     * и разрешения процесса поиска на уровне управления 
                     */
                    if (Object.values(this.singleQueryData.engines)[i] === true && this.isServer) {

                        /** 
                         * Отслеживание факта получения капчи при поиске в новостной системе Yandex.News
                         * и исключение этого сервиса из поиска при наличии такового
                         */
                        if (Object.keys(this.singleQueryData.engines)[i] === 4 && store.getIsCaptcha()) {
                            log('Пропускаю поиск в Yandex.News из-за случая капчи'); // Вывод информации в лог
                            continue; // Переход к следующей итерации цикла
                        }

                        this.singleQueryData.id_engine = Number(Object.keys(this.singleQueryData.engines)[i]); // Запись идентификатора поискового сервиса в экземпляр класса

                        const page = await browser.newPage(); // Открытие новой страницы в браузере
                        page.setDefaultNavigationTimeout(15000); // Установка таймаута обработки в 15 секунд
                        page.setViewport({ // Установка разрешения окна браузера
                            width: 1920, // Установка ширины окна
                            height: 1080 // Установка высоты окна
                        });
                        this.singleQueryData.page = page; // Запись экземпляра страницы в экземпляр класса

                        await this.search(); // Запуск процесса поиска новостей
                        await page.close(); // Закрытие текущей страницы браузера по окончании процесса поиска новостей

                        /**
                         * Проверка факта остановки поиска при получении сигнала о начале остановки 
                         * и запрете процесса поиска на уровне управления
                         */
                        if (store.getStatus() === 2 && !this.isServer) {
                            log('Бот остановлен!', 0); // Вывод информации в лог 
                            store.setStatus(0); // Установка статуса работы программы 0 - остановлена
                        }
                    }
                }
                this.isGo = true // Разрешение процесса поиска на уровне программы
            }
        }, this.INTERVAL)
    }

    /**
     * @method search
     * @description Отвечает за процесс поиска новостей и подсчет статистики обработки запросов
     */
    async search() {
        let config = await store.getConfig(); // Получение конфигурации с сервера

        if (config) { // Проверка корректности получения конфигурации
            log('Получил конфигурацию'); // Вывод информации в лог
            this.singleQueryData.config = config; // Запись конфигурации в экземпляр класса
        } else {
            log('Ошибка получения конфигурации'); // Вывод информации в лог
            return; // Выход из функции поиска и возврат в функцию mainQueue
        }

        let result = []; // Массив объектов с результатами поиска

        let now = new Date(); // Получение времени начала обработки конкретного запроса
        let queryTime = 0; // Обнуление времени обработки конкретного запроса

        log(`Начинаю обработку поискового запроса: ${this.singleQueryData.query} (${this.singleQueryData.pages} страниц(ы))`); // Вывод информации в лог
        const userAgent = config.common.userAgents[getRandom(0, config.common.userAgents.length)]; // Получение случайного user-agent
        this.singleQueryData.page.setUserAgent(userAgent); // Установка случайного user-agent из массива агентов

        result = await router(this.singleQueryData); // Запуск процесса обработки запроса в определенном новостном агрегаторе

        const resNum = Number(result.length); // Запись количество полученых новостей

        if (!resNum || resNum === 0) { // Проверка количества полученных новостей в массиве result
            log(`Ошибка при обработке запроса`); // Вывод информации в лог
            return; // Выход из функции поиска и возврат в функцию mainQueue
        } else {
            result = await store.setNews(result); // Отправка результатов поиска на сервер для последующей записи в очередь RabbitMQ

            /** 
             * Вызов функции подсчета статистики с передачей параметров:
             * []this.allNews - текущее количество полученных новостей за время работы программы 
             * number resNum - количество полученных новостей в текущем запросе
             * timestamp this.goTime - время начала работы программы
             * timestamp now - время начала обработки текущего запроса
             */
            const staticstics = calculateStatistics(this.allNews, resNum, this.goTime, now);

            this.allNews = staticstics.allNews; // Посчитанное количество полученных новостей за время работы программы
            fullTimeWorking = staticstics.fullTimeWorking; // Посчитанное общее время работы программы
            queryTime = staticstics.queryTime; // Посчитанное время обработки текущего запроса
            this.queryCount += 1; // Инкремент количества обработанных запросов

            log(`Обработка запроса заняла ${queryTime} секунд! За запрос получено ${resNum} новостей`); // Вывод информации в лог об обработке текущего запроса
            log(`Всего обработано ${this.queryCount} запросов за ${secToMinToHoursConvert(fullTimeWorking)} и получено ${this.allNews} новостей`); // Вывод информации в лог 
            // за все время работы программы

            /** 
             * Вывод результатов работы поискового бота (статистики) в консоль в виде таблицы, где
             * [key] - параметр
             * [value] - значение параметра
             */
            console.table({
                'Время обработки запроса, с.': queryTime,
                'Количество новостей за запрос, шт.': resNum,
                'Обработанных запросов, шт.': this.queryCount,
                'Общее время работы': secToMinToHoursConvert(fullTimeWorking),
                'Общее количество новостей, шт.': this.allNews
            });
        }
    }

    /**
     * @method restart
     * @description Перезапуск программы
     */
    async restart() {
        log('Перезагружаю бота', 0); // Вывод информации в лог
        process.exit(0); // Рабочий выход из процесса (без ошибки)
    }

    /**
     * @method stop
     * @description Остановка процесса поиска
     */
    async stop() {
        log('Останавливаю бота', 2); // Вывод информации в лог
        store.setStatus(2); // Установка статуса работы приложения 2 - начался процесс остановки
        this.isServer = false; // Запрет процесса поиска на уровне управления
    }

}

export default new Lifecycle(); // Экспорт экземпляра класса Lifecycle