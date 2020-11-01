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
import { log } from './utils/utils'

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
        log(clc.green("Браузер запущен"), 1);

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
                        log('Источник не определен')
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

        log(clc.green(`Начинаю обработку поискового запроса: ${this.singleQueryData.query} (${this.singleQueryData.pages} страниц(ы))`), 1);

        const userAgent = configuration.common.userAgents[getRandom(0, configuration.common.userAgents.length)];
        log(userAgent)

        this.singleQueryData.page.setUserAgent(userAgent)

        const router = new Router(this.singleQueryData)
        result = await router.toEngine()
        log(result)
        const resNum = Number(result.length)

        if (!resNum || resNum === 0) {
            log('Ошибка при обработке запроса, пробую еще раз', 1);
            isGo = true;
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

            log(`Обработка запроса заняла ${queryTime} секунд! Всего получено ${resNum} новостей. Всего обработано ${queryCount} запросов за ${secToMinToHoursConvert(fullTimeWorking)}!`, 1);

            drawPoints({
                dateTime: new Date(Date.now()),
                value: resNum,
                query: this.singleQueryData.query,
                queryTime: queryTime
            });

            log('Отправляю данные', 1)

            if (!isServer) {
                log('Бот остановлен!', 0);
            }
        }
    }

    async stop() {
        isServer = false;
        isGo = true;
        log("Останавливаю бота", 1)
        process.exit(0);
    }
}