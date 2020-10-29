'use strict'

import dotenv from 'dotenv';
dotenv.config();

import clc from 'cli-color';
import puppeteer from 'puppeteer';

import Router from './router'
import { getRandom, calculateStatistics, secToMinToHoursConvert, drawPoints } from './utils/utils';
import { toTextFile } from './utils/logger';
import { serverProvider, localFileProvider } from './provider';
import configuration from '../data/configuration.json';
import store from './state/stateManager'

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


let result = [];

const INTERVAL = 3000;

export default class LifeCycle {

    constructor() {
        this.query = store.getQuery()

        this.socket = store.getSocket()
        store.setConfig(configuration)
    }

    async start() {
        isSingle = false;
        isGo = true;
        isServer = true;
    }

    async mainQueue() {
        const browser = await puppeteer.launch(options)
        console.log("Браузер запущен");

        this.socket.emit('message', {
            message: `Бот готов к работе!`,
            sender: 'Newser',
            code: 0,
            subtitle: 'В работе'
        });
        toTextFile('Бот готов к работе!');

        setInterval(async () => {
            if (isGo && isServer && !isSingle) {
                isGo = false
                switch (store.getSource()) {
                    case process.env.SERVER_SOURCE:
                        let serverProviderData = await serverProvider()
                        store.setQuery(serverProviderData.query)
                        store.setIdRequest(serverProviderData.id_request)
                        break
                    case process.env.LOCAL_FILE_SOURCE:
                        let localFileProviderData = localFileProvider('queries')
                        store.setQuery(localFileProviderData.query)
                        store.setIdRequest(localFileProviderData.id_request)
                        id_request = localFileProviderData.id_request
                        break;
                    case process.env.WEB_APP_SOURCE:
                        isSingle = true
                        break;
                    default:
                        console.log('Источник не определен')
                }
                let engines = store.getEngines()
                for (let i = 0; i < Object.keys(engines).length; i++) {
                    if (Object.values(engines)[i] === true) {
                        store.setIdEngine(Number(Object.keys(engines)[i]))
                        let page = await browser.newPage()
                        page.setDefaultNavigationTimeout(15000);
                        page.setViewport({
                            width: 1920,
                            height: 1080
                        })
                        store.setPage(page)
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

        let query = store.getQuery()
        let pages = store.getPages()

        console.log(clc.green(`Начинаю обработку поискового запроса: ${query} (${pages} страниц(ы))`));
        toTextFile(`Начинаю обработку поискового запроса: ${query}`);
        this.socket.emit('message', {
            message: `Начинаю обработку поискового запроса: ${query}`,
            sender: 'Newser',
            code: 1,
            starting: 1,
            subtitle: 'В работе'
        });

        const userAgent = configuration.common.userAgents[getRandom(0, configuration.common.userAgents.length)];
        console.log(userAgent)

        page.setUserAgent(userAgent)
        store.setPage(page)

        const router = new Router(page)
        result = await router.toEngine()
        console.log(result)
        const resNum = Number(result.length)
        if (!resNum || resNum === 0) {
            console.log("Error");
            this.socket.emit('message', {
                message: 'Ошибка при обработке запроса, пробую еще раз',
                sender: 'Newser',
                code: 1,
                subtitle: 'В работе'
            });
            toTextFile('Ошибка при обработке запроса, пробую еще раз');
            isGo = true;
            isSingle = false
        } else {
            await router.toRabbitMQ(result);

            //*****************************Stats area ****************************************************************//
            let staticstics = calculateStatistics(AllNews, resNum, goTime, now);
            AllNews = staticstics.AllNews;
            fullTimeWorking = staticstics.fullTimeWorking;
            queryTime = staticstics.queryTime;
            queryCount += 1;
            //********************************************************************************************************//

            console.log(`Обработка запроса заняла ${queryTime} секунд! Всего получено ${resNum} новостей. Всего обработано ${queryCount} запросов за ${secToMinToHoursConvert(fullTimeWorking)}!`);
            toTextFile(`Обработка запроса заняла ${queryTime} секунд! Всего получено ${resNum} новостей. Всего обработано ${queryCount} запросов за ${secToMinToHoursConvert(fullTimeWorking)}!`);

            this.socket.emit('message', {
                message: `Обработка запроса заняла  секунд! Всего получено новостей!`,
                news: JSON.stringify(result),
                sender: 'Newser',
                code: 1,
                subtitle: 'В работе'
            });

            drawPoints({
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
                toTextFile("Бот остановлен");
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

    async stop() {
        isServer = false;
        isGo = true;
        toTextFile("Бот остановлен");
        this.socket.emit('message', {
            message: 'Бот остановлен!',
            sender: 'Newser',
            code: 0,
            subtitle: 'Пауза',
            stop: true
        });
        process.exit(0);
    }
}