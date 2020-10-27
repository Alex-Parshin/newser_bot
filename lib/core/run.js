'use strict'
require('dotenv').config();

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
    ignoreDefaultArgs: ['--disable-extensions'],
    // slowMo: 150
};

// Переменные, управляющие процессом работы бота
let isGo = true;
let isServer = false;
let isSingle = false;

// Переменные, содержащие в себе поля запроса
let query = '';

let engines = []
let pages = 0;
let source = '';
let url = '';

let id_request = 0;
let id_engine = 0;
let result = [];

global.newser = {
    isCaptcha: false,
    socket: null,
    captchaCounter: 0
};

const interval = 3000;

/**
 * Класс Run отвечает за получение начальной статической и динамической конфигурации системы, получение поискового запроса
 * путем обращения к удаленному серверу посредством модуля request и запуск метода init класса Initial, который позволяет
 * подключать поисковые сервисы путем написания одного файла расширения .js и определения его в классе initial.
 */

class Run {
    constructor(socket = {}) {
        if (Run.exists) {
            return Run.instance;
        }
        global.newser.isCaptcha = false;
        global.newser.socket = socket;
        this.socket = socket;
        this.messages = new Messages();
        this.logger = new Logger();
        Run.instance = this;
        Run.exists = true;
    }

    /**
     * Определение начальных параметров системы: откуда получаем запросы (web, сервер, локально), организация рабочего цикла с помощью setInterval, запуск браузера
     * @returns {void}
     */

    async run(page) {
        let now = new Date(); // текущий момент времени (для логов)
        let goTime = new Date(); // текущий момент времени (для отслеживания общего времени работы)
        let queryCount = 0; // количество обработанных запросов
        let AllNews = 0; // количество полученных новостей
        let fullTimeWorking = 0;
        let queryTime = 0;
        console.log(clc.green(`Начинаю обработку поискового запроса: ${query}`));
        this.logger.toTextFile(`Начинаю обработку поискового запроса: ${query}`);
        this.socket.emit('message', {
            message: `Начинаю обработку поискового запроса: ${query}`,
            sender: 'Newser',
            code: 1,
            starting: 1,
            subtitle: 'В работе'
        });
        const userAgent = configuration.common.userAgents[Run.utils.getRandom(0, configuration.common.userAgents.length)];
        console.log(userAgent)
        page.setUserAgent(userAgent)
        const router = new Router(page, query, id_request, pages, configuration, id_engine, this.socket); //запуск поиска и получение массива найденных новостей
        result = await router.toEngine()

        const resNum = result.length;
        if (resNum == 0) {
            console.log("Error");
            this.socket.emit('message', {
                message: 'Ошибка при обработке запроса, пробую еще раз',
                sender: 'Newser',
                code: 1,
                subtitle: 'В работе'
            });
            this.logger.toTextFile('Ошибка при обработке запроса, пробую еще раз');
            isGo = true;
        } else {
            await router.toRabbitMQ(result);
            //*****************************Stats area ****************************************************************//
            let staticstics = Run.utils.calculateStatistics(AllNews, resNum, goTime, now);
            AllNews = staticstics.AllNews;
            fullTimeWorking = staticstics.fullTimeWorking;
            queryTime = staticstics.queryTime;
            queryCount += 1;
            //********************************************************************************************************//
            console.log(`Обработка запроса заняла ${queryTime} секунд! Всего получено ${resNum} новостей. Всего обработано ${queryCount} запросов за ${Run.utils.secToMinToHoursConvert(fullTimeWorking)}!`);
            this.logger.toTextFile(`Обработка запроса заняла ${queryTime} секунд! Всего получено ${resNum} новостей. Всего обработано ${queryCount} запросов за ${Run.utils.secToMinToHoursConvert(fullTimeWorking)}!`);
            this.socket.emit('message', {
                message: `Обработка запроса заняла ${queryTime} секунд! Всего получено ${resNum} новостей. Всего обработано ${queryCount} запросов за ${Run.utils.secToMinToHoursConvert(fullTimeWorking)}!`,
                news: result,
                sender: 'Newser',
                code: 1,
                subtitle: 'В работе'
            });
            Run.utils.drawPoints({
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
            if (isSingle && resNum > 0) isServer = false;
            if (!isServer || isSingle) {
                console.log('Stopped');
                this.logger.toTextFile("Бот остановлен");
                this.socket.emit('message', {
                    message: 'Бот остановлен!',
                    sender: 'Newser',
                    code: 0,
                    subtitle: 'Пауза',
                    stop: true
                });
            }
        }
    }

    //************************************Get data from remote server*****************************//

    /**
     * Отправка GET запроса на удаленный сервер и обработка его ответа
     * @param {string} url - URL-адрес сервера
     * @returns {void}
     */

    async fromServer() {
        console.log("Получаю данные с сервера");
        this.logger.toTextFile("Получаю данные с сервера");
        return await new Promise(async(resolve, reject) => {
            await request.get(url,
                async(error, response, body) => {
                    if (!error && response.statusCode == 200 && JSON.parse(body).query != " ") {
                        query = await JSON.parse(body).query.replace(/"/g, ' ').trim();
                        id_request = Number(await JSON.parse(body).id_request);

                        global.newser.socket.emit('message', {
                            message: `Успешно получен запрос ${query}`,
                            sender: 'Newser',
                            code: 1,
                            subtitle: 'В работе'
                        })
                        this.logger.toTextFile(`Успешно получен запрос ${query}`);
                        resolve();
                    } else {
                        console.log("Не успешно", error);
                        global.newser.socket.emit('message', {
                            message: `Ошибка при получении запроса`,
                            sender: 'Newser',
                            code: 1,
                            subtitle: 'В работе'
                        })
                        this.logger.toTextFile(`Ошибка при получении запроса!`);
                        reject()
                    }
                })
        })
    }

    async fromLocalBase() {
        let localData = require('./../data/queries.json')
        let localDataQuery = localData[Math.floor(Math.random() * (localData.length - 0)) + 0]
        query = localDataQuery.query
        id_request = localDataQuery.id_request
        return true
    }

    async start(_pages, _source, _url, _engines = { google: true }) {
        pages = _pages
        source = _source
        url = _url
        engines = _engines

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

    async mainQueue() {
        this.messages.showStart(new Date()); //вывод начальной конфигурации в консоль
        const browser = await puppeteer.launch(options); //инициализация объекта браузера
        console.log("Браузер запущен");
        this.socket.emit('message', {
            message: `Бот готов к работе!`,
            sender: 'Newser',
            code: 0,
            subtitle: 'В работе'
        });
        this.logger.toTextFile('Бот готов к работе!');
        setInterval(async() => {
            if (global.customQuery.status) {
                global.customQuery.status = false
                console.log(`Начинаю обработку ${global.customQuery.message}`)
                let page = await browser.newPage();
                Run.utils = new Utils(page);
                page.setDefaultNavigationTimeout(15000);
                page.setViewport({
                    width: 1920,
                    height: 1080
                })
                query = global.customQuery.message
                id_engine = Number(global.customQuery.engine)
                id_request = 777

                await this.run(page)
                await page.close()
            }
            if (isGo && isServer && !global.customQuery.status) {
                console.log("Начинаю обработку")
                isGo = false

                if (source === 'Удаленный сервер') await this.fromServer();
                else this.fromLocalBase()

                for (let i = 0; i < Object.keys(engines).length; i++) {
                    if (Object.values(engines)[i] === true) {
                        id_engine = Number(Object.keys(engines)[i])
                        console.log(id_engine)
                        let page = await browser.newPage();
                        Run.utils = new Utils(page);
                        page.setDefaultNavigationTimeout(15000);
                        page.setViewport({
                            width: 1920,
                            height: 1080
                        })
                        await this.run(page)
                        await page.close()
                    }
                }
                isGo = true
            }
        }, interval)
    }
}

module.exports = Run