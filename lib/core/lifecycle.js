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
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--unhandled-rejections=strict",
        "--disable-notifications"
    ],
    headless: true,
    ignoreHTTPSErrors: true,
    ignoreDefaultArgs: ['--disable-extensions']
};

let isGo = true;
let isServer = false;


let result = [];

const INTERVAL = 3000;

export default class Lifecycle {

    constructor() {
        this.socket = store.getSocket()
        this.singleQueryData = {}
        store.setConfig(configuration)
    }

    async start(singleQueryData) {
        this.singleQueryData = singleQueryData
        isServer = true
        isGo = true
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

        setInterval(async() => {
            if (isGo && isServer) {
                isGo = false
                switch (this.singleQueryData.source) {
                    case process.env.SERVER_SOURCE:
                        let localFileProviderData = await localFileProvider()
                        if (localFileProviderData === null) {
                            let serverProviderData = await serverProvider()
                            this.singleQueryData.query = serverProviderData.query
                            this.singleQueryData.id_request = serverProviderData.id_request
                            this.singleQueryData.engines = serverProviderData.engines
                        } else {
                            this.singleQueryData.query = localFileProviderData.query
                            this.singleQueryData.id_request = localFileProviderData.id_request
                            this.singleQueryData.engines = localFileProviderData.engines
                        }
                        break
                    case process.env.LOCAL_FILE_SOURCE:
                        this.singleQueryData.query = localFileProviderData.query
                        this.singleQueryData.id_request = localFileProviderData.id_request
                        break;
                    default:
                        console.log('Источник не определен')
                }

                for (let i = 0; i < Object.keys(this.singleQueryData.engines).length; i++) {
                    if (Object.values(this.singleQueryData.engines)[i] === true) {
                        let page = await browser.newPage()
                        page.setDefaultNavigationTimeout(15000);
                        page.setViewport({
                            width: 1920,
                            height: 1080
                        })
                        this.singleQueryData.page = page
                        this.singleQueryData.id_engine = Number(Object.keys(this.singleQueryData.engines)[i])

                        await this.run()
                        await page.close()
                    }
                }
                isGo = true
            }
        }, INTERVAL)
    }

    async run() {
        let now = new Date();
        let goTime = new Date();
        let queryCount = 0;
        let AllNews = 0;
        let fullTimeWorking = 0;
        let queryTime = 0;

        console.log(clc.green(`Начинаю обработку поискового запроса: ${this.singleQueryData.query} (${this.singleQueryData.pages} страниц(ы))`));
        toTextFile(`Начинаю обработку поискового запроса: ${this.singleQueryData.query}`);
        this.socket.emit('message', {
            message: `Начинаю обработку поискового запроса: ${this.singleQueryData.query}`,
            sender: 'Newser',
            code: 1,
            starting: 1,
            subtitle: 'В работе'
        });

        const userAgent = configuration.common.userAgents[getRandom(0, configuration.common.userAgents.length)];
        console.log(userAgent)

        this.singleQueryData.page.setUserAgent(userAgent)

        const router = new Router(this.singleQueryData)
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
            await this.singleQueryData.page.close()
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
                query: this.singleQueryData.query,
                queryTime: queryTime
            });

            this.socket.emit('message', {
                message: 'Отправляю данные!',
                sender: 'Newser',
                code: 1,
                subtitle: 'Пауза',
                stop: true
            });

            if (!isServer) {
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