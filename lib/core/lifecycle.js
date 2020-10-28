'use strict'
require('dotenv').config();

const clc = require('cli-color');
const puppeteer = require('puppeteer');

const Router = require('./router');
const Messages = require('./utils/messages');
const Utils = require('../core/utils/utils');
const Logger = require('./logger');
const Provider = require('./provider');

const configuration = require('../data/configuration.json');

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
};

let isGo = true;
let isServer = false;
let isSingle = false;

let engines = []
let pages = 0;
let source = '';
let url = '';

let result = [];

global.newser = {
    logger: new Logger(),
    message: new Messages(),
    utils: {},
    
    isCaptcha: false,
    socket: null,
    captchaCounter: 0,

    search_data: {
        page: {},
        pages: 0,
        query: '',
        configuration: configuration,
        id_engine: 0,
        id_request: 0
    }
};

const INTERVAL = 3000;

class LifeCycle {

    constructor(socket = {}) {
        if (LifeCycle.exists) {
            return LifeCycle.instance;
        }
        global.newser.socket = socket;
        LifeCycle.instance = this;
        LifeCycle.exists = true;
    }

    async start(_source, _query, _id_request, _pages, _url, _engines) {
        source = _source.length > 0 ? _source : process.env.LOCAL_FILE_SOURCE
        global.newser.search_data.query = _query.length > 0 ? _query : ''
        global.newser.search_data.id_request = _id_request
        pages = Number(_pages) > 0 ? _pages : process.env.DEFAULT_PAGES
        url = _url.length > 0 ? _url : process.env.QUERY_URL
        engines = Object.keys(_engines).length > 0 ? _engines : { google: true }
        isSingle = false;
        isGo = true;
        isServer = true;
    }

    async mainQueue() {
        const browser = await puppeteer.launch(options); //инициализация объекта браузера
        console.log("Браузер запущен");
        
        global.newser.socket.emit('message', {
            message: `Бот готов к работе!`,
            sender: 'Newser',
            code: 0,
            subtitle: 'В работе'
        });
        global.newser.logger.toTextFile('Бот готов к работе!');

        setInterval(async() => {
            if (isGo && isServer) {
                isGo = false
                switch (source) {
                    case process.env.SERVER_SOURCE:
                        let serverProviderData = await Provider.serverProvider(url)
                        global.newser.search_data.query = serverProviderData.query
                        global.newser.search_data.id_request = serverProviderData.id_request
                        break
                    case process.env.LOCAL_FILE_SOURCE:
                        let localFileProviderData = Provider.localFileProvider('queries')
                        global.newser.search_data.query = localFileProviderData.query
                        global.newser.search_data.id_request = localFileProviderData.id_request
                        break;
                    case process.env.WEB_APP_SOURCE:
                        isSingle = true
                        break;
                    default:
                        console.log('Источник не определен')
                }
                for (let i = 0; i < Object.keys(engines).length; i++) {
                    if (Object.values(engines)[i] === true) {
                        global.newser.search_data.id_engine = Number(Object.keys(engines)[i])
                        let page = await browser.newPage();
                        global.newser.utils = new Utils(page);
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
        }, INTERVAL)
    }

    async run(page) {
        let now = new Date();
        let goTime = new Date();
        let queryCount = 0;
        let AllNews = 0;
        let fullTimeWorking = 0;
        let queryTime = 0;

        console.log(clc.green(`Начинаю обработку поискового запроса: ${global.newser.search_data.query} (${pages} страниц(ы))`));
        global.newser.logger.toTextFile(`Начинаю обработку поискового запроса: ${global.newser.search_data.query}`);
        global.newser.socket.emit('message', {
            message: `Начинаю обработку поискового запроса: ${global.newser.search_data.query}`,
            sender: 'Newser',
            code: 1,
            starting: 1,
            subtitle: 'В работе'
        });

        const userAgent = configuration.common.userAgents[global.newser.utils.getRandom(0, configuration.common.userAgents.length)];
        console.log(userAgent)
        page.setUserAgent(userAgent)

        const router = new Router(page, global.newser.search_data.query, global.newser.search_data, pages, configuration, global.newser.search_data.id_engine, global.newser.socket); //запуск поиска и получение массива найденных новостей
        result = await router.toEngine()

        const resNum = result.length;
        if (resNum == 0) {
            console.log("Error");
            global.newser.socket.emit('message', {
                message: 'Ошибка при обработке запроса, пробую еще раз',
                sender: 'Newser',
                code: 1,
                subtitle: 'В работе'
            });
            global.newser.logger.toTextFile('Ошибка при обработке запроса, пробую еще раз');
            isGo = true;
        } else {
            await router.toRabbitMQ(result);

            //*****************************Stats area ****************************************************************//
            let staticstics = global.newser.utils.calculateStatistics(AllNews, resNum, goTime, now);
            AllNews = staticstics.AllNews;
            fullTimeWorking = staticstics.fullTimeWorking;
            queryTime = staticstics.queryTime;
            queryCount += 1;
            //********************************************************************************************************//
            console.log(`Обработка запроса заняла ${queryTime} секунд! Всего получено ${resNum} новостей. Всего обработано ${queryCount} запросов за ${global.newser.utils.secToMinToHoursConvert(fullTimeWorking)}!`);
            global.newser.logger.toTextFile(`Обработка запроса заняла ${queryTime} секунд! Всего получено ${resNum} новостей. Всего обработано ${queryCount} запросов за ${global.newser.utils.secToMinToHoursConvert(fullTimeWorking)}!`);
            global.newser.socket.emit('message', {
                message: `Обработка запроса заняла ${queryTime} секунд! Всего получено ${resNum} новостей. Всего обработано ${queryCount} запросов за ${global.newser.utils.secToMinToHoursConvert(fullTimeWorking)}!`,
                news: result,
                sender: 'Newser',
                code: 1,
                subtitle: 'В работе'
            });
            
            global.newser.utils.drawPoints({
                dateTime: new Date(Date.now()),
                value: resNum,
                query: global.newser.search_data.query,
                queryTime: queryTime
            });

            global.newser.socket.emit('message', {
                message: 'Отправляю данные!',
                sender: 'Newser',
                code: 1,
                subtitle: 'Пауза',
                stop: true
            });

            if (isSingle && resNum > 0) isServer = false;
            if (!isServer || isSingle) {
                console.log('Stopped');
                global.newser.logger.toTextFile("Бот остановлен");
                global.newser.socket.emit('message', {
                    message: 'Бот остановлен!',
                    sender: 'Newser',
                    code: 0,
                    subtitle: 'Пауза',
                    stop: true
                });
            }

        }
    }

    async stop() {
        isServer = false;
        isGo = true;
        global.newser.logger.toTextFile("Бот остановлен");
        global.newser.socket.emit('message', {
            message: 'Бот остановлен!',
            sender: 'Newser',
            code: 0,
            subtitle: 'Пауза',
            stop: true
        });
        process.exit(0);
    }

}

module.exports = LifeCycle