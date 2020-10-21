'use strict'

/**
 * Инициализация сторонних пакетов, расположенных в папке node_modules
 * --------------------------------------------------------------------------------------
 * request - GET/POST запросы к серверу
 * clc - изменение окраски текста, выводимого в консоль
 * puppeteer - фреймворк для автоматического выполнения действий пользователя в браузере
 */

const request = require('request');
const clc = require('cli-color');
const puppeteer = require('puppeteer');
const iPhone = puppeteer.devices['iPhone 6'];

/**
 * Подключение внутренних модулей системы поиска новостных материалов
 * --------------------------------------------------------------------------------------
 * Initial - класс инициализации поисковых сервисов
 * Messages - тестовый класс для централизованного хранения выводимых сообщений в консоль
 * Utils - класс для хранения вспомогательных функций
 * configuration - JSON файл с основной конфигурацией бота
 */

const Router = require('./router');
const Messages = require('./utils/messages');
const Utils = require('../core/utils/utils');
const Logger = require('./logger');
// const Storage = require('./utils/storage');

const configuration = require('../data/configuration.json');

// const StealthPlugin = require('puppeteer-extra-plugin-stealth')
// puppeteer.use(StealthPlugin())

// // Add adblocker plugin to block all ads and trackers (saves bandwidth)
// const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
// puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

/**
 * Переменные, отвечающие за конфигурацию headless chrome браузера
 * ---------------------------------------------------------------------------
 * headless - отображать графический интерфейс или нет
 * slowMo - замедление процессов выполнения автоматических действий в браузере
 */

const options = {
    args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--unhandled-rejections=strict",
        "--disable-notifications"
    ],
    headless: true,
    ignoreHTTPSErrors: true,
    // product: 'firefox',
    // executablePath: '/usr/bin/firefox',
    ignoreDefaultArgs: ['--disable-extensions'],
};

// Переменные, управляющие процессом работы бота
let isGo = true;
let isServer = false;
let isSingle = false;

// Переменные, содержащие в себе поля запроса
let query = "";
let id_request = 0;
let id_engine = 0;

/**
 * Класс Run отвечает за получение начальной статической и динамической конфигурации системы, получение поискового запроса
 * путем обращения к удаленному серверу посредством модуля request и запуск метода init класса Initial, который позволяет
 * подключать поисковые сервисы путем написания одного файла расширения .js и определения его в классе initial.
 */

class Run {


    constructor(socket = {}) {

        // Проверка существование экземпляра класса
        if (Run.exists) {
            return Run.instance;
        }

        this.isCaptcha = false;
        this.socket = socket;
        Run.instance = this;
        Run.exists = true;
    }

    /**
     * Определение начальных параметров системы: откуда получаем запросы (web, сервер, локально), организация рабочего цикла с помощью setInterval, запуск браузера
     * @returns {void}
     */

    async run() {
        const messages = new Messages();
        const logger = new Logger();

        const interval = 3000; // интервал обращения к isGo

        let now = new Date(); // текущий момент времени (для логов)
        let goTime = new Date(); // текущий момент времени (для отслеживания общего времени работы)
        let pages = 1; //дефолтная глубина поиска в страницах
        let queryCount = 0; // количество обработанных запросов
        let AllNews = 0; // количество полученных новостей
        let fullTimeWorking = 0;
        let queryTime = 0;

        await messages.showStart(now); //вывод начальной конфигурации в консоль

        const browser = await puppeteer.launch(options); //инициализация объекта браузера
        console.log("Браузер запущен");
        let page = await browser.newPage(); //инициализация объекта страницы
        console.log("Страница открыта");

        const utils = new Utils(page);

        this.socket.emit('message', {
            message: `Бот готов к работе!`,
            sender: 'Newser',
            code: 0,
            subtitle: 'В работе'
        });

        logger.toTextFile('Бот готов к работе!');

        const searching = setInterval(async() => { // Реализация непрерывного поиска

            if (isGo == true && isServer == true) {

                isGo = false;
                now = new Date(); //текущее время/дата для ведения логов

                if (!isSingle) {

                    // let query_data = ['технополис', '123', '3']
                    // query = query_data[0]
                    // id_request = query_data[1]
                    // id_engine = query_data[2]

                    await this.fromServer('http://10.19.19.4:1680/admin/give_search_query', logger, utils);
                }

                console.log(clc.green(`Начинаю обработку поискового запроса: ${query}`));
                logger.toTextFile(`Начинаю обработку поискового запроса: ${query}`);

                this.socket.emit('message', {
                    message: `Начинаю обработку поискового запроса: ${query}`,
                    sender: 'Newser',
                    code: 1,
                    starting: 1,
                    subtitle: 'В работе'
                });

                page = await browser.newPage(); // открытие новой страницы в браузере
                page.setDefaultNavigationTimeout(15000);
                await page.setViewport({
                    width: 1920,
                    height: 1080
                })
                const userAgent = configuration.common.userAgents[await utils.getRandom(0, configuration.common.userAgents.length)];
                console.log(userAgent)
                page.setUserAgent(userAgent); // установка случайного user-agent

                const router = new Router(browser, page, query, id_request, pages, configuration, id_engine, this.socket); //запуск поиска и получение массива найденных новостей

                const result = await router.toEngine();
                const resNum = result.length;

                if (resNum == 0) {

                    console.log("Error");

                    this.socket.emit('message', {
                        message: 'Ошибка при обработке запроса, пробую еще раз',
                        sender: 'Newser',
                        code: 1,
                        subtitle: 'В работе'
                    });

                    logger.toTextFile('Ошибка при обработке запроса, пробую еще раз');

                    isGo = true;

                } else {

                    await router.toRabbitMQ(result);

                    //*****************************Stats area ****************************************************************//
                    let staticstics = utils.calculateStatistics(AllNews, resNum, goTime, now);
                    AllNews = staticstics.AllNews;
                    fullTimeWorking = staticstics.fullTimeWorking;
                    queryTime = staticstics.queryTime;
                    queryCount += 1;
                    //********************************************************************************************************//

                    console.log(`Обработка запроса заняла ${queryTime} секунд! Всего получено ${resNum} новостей`);

                    logger.toTextFile(`Обработка запроса заняла ${queryTime} секунд! Всего получено ${resNum} новостей. Всего обработано ${queryCount} запросов за ${utils.secToMinToHoursConvert(fullTimeWorking)} секунд!`);

                    this.socket.emit('message', {
                        message: `Обработка запроса заняла ${queryTime} секунд! Всего получено ${resNum} новостей. Всего обработано ${queryCount} запросов за ${utils.secToMinToHoursConvert(fullTimeWorking)} секунд!`,
                        news: result,
                        sender: 'Newser',
                        code: 1,
                        subtitle: 'В работе'
                    });

                    utils.drawPoints({
                        dateTime: new Date(Date.now()),
                        value: resNum,
                        query: query,
                        queryTime: queryTime
                    });

                    this.socket.emit('message', {
                        message: 'Отправляю данные!',
                        sender: 'Newser',
                        code: 1,
                        subtitle: 'Пауза',
                        stop: true
                    });
                }

                if (isSingle && resNum > 0) isServer = false;

                if (!isServer || isSingle) {
                    console.log('Stopped');
                    logger.toTextFile("Бот остановлен");
                    this.socket.emit('message', {
                        message: 'Бот остановлен!',
                        sender: 'Newser',
                        code: 0,
                        subtitle: 'Пауза',
                        stop: true
                    });
                }

                await utils.sleep(10000, 'Новый поиск');
                isGo = true;
            }
        }, interval)
    }

    //************************************Get data from remote server*****************************//

    /**
     * Отправка GET запроса на удаленный сервер и обработка его ответа
     * @param {string} url - URL-адрес сервера
     * @returns {void}
     */

    async fromServer(url, logger = {}, utils = {}) {
        console.log("Получаю данные с сервера");
        logger.toTextFile("Получаю данные с сервера");
        return await new Promise(async(resolve, reject) => {
            await request.get(url,
                async(error, response, body) => {
                    if (!error && response.statusCode == 200 && JSON.parse(body).query != " ") {
                        console.log("Успешно");
                        query = await JSON.parse(body).query.replace(/"/g, ' ').trim();
                        id_request = Number(await JSON.parse(body).id_request);
                        // id_engine = Number(await JSON.parse(body).id_engine)

                        const dice = utils.getRandom(0, 2);
                        if (dice === 0) {
                            id_engine = 3
                        } else {
                            id_engine = 7
                        }

                        // if (this.isCaptcha && id_engine === 4) {
                        //     console.log("Перерыв, капча!")
                        //     await utils.sleep(10000)
                        //     await this.fromServer('http://10.19.19.4:1680/admin/give_search_query', logger, utils)
                        // }

                        this.socket.emit('message', `Успешно получен запрос ${query}`);
                        logger.toTextFile(`Успешно получен запрос ${query}`);
                        resolve();
                    } else {
                        console.log("Не успешно", error);
                        this.socket.emit('message', `Ошибка при получении запроса!`);
                        logger.toTextFile(`Ошибка при получении запроса!`);
                        reject()
                    }
                })
        })
    }
    async start() {
        isSingle = false;
        isGo = true;
        isServer = true;
    }
    async stop() {
        const logger = new Logger();
        isServer = false;
        isGo = true;
        logger.toTextFile("Бот остановлен");
        this.socket.emit('message', {
            message: 'Бот остановлен!',
            sender: 'Newser',
            code: 0,
            subtitle: 'Пауза',
            stop: true
        });
        process.exit(0);
    }

    async search(q) {
        query = q;
        id_request = '123';
        id_engine = '3';
        isSingle = true;
        isGo = true;
        isServer = true;
    }

    async captcha() {
        this.isCaptcha = true
    }
}

module.exports = Run