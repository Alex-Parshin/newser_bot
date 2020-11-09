'use strict'

import dotenv from 'dotenv';
dotenv.config();
import puppeteer from 'puppeteer';

import Router from './router'
import { getRandom, calculateStatistics, secToMinToHoursConvert } from './utils/utils';
import store from './state/stateManager'
import { log } from './utils/utils'

const options = {
    args: [
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

class Lifecycle {

    constructor() {
        this.singleQueryData = {}
    }

    async start(singleQueryData) {
        this.singleQueryData = singleQueryData
        isServer = true
        isGo = true
    }

    async mainQueue() {
        await store.setConfig()
        const browser = await puppeteer.launch(options)
        log("Браузер запущен")

        setInterval(async() => {
            if (isGo && isServer) {
                isGo = false
                let queryData = await store.getQuery(this.singleQueryData.source)
                this.singleQueryData.query = queryData.query
                this.singleQueryData.id_request = queryData.id_request

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
        const socket = store.getSocket()
        let config = store.getConfig().data
        let now = new Date();
        let goTime = new Date();
        let queryCount = 0;
        let AllNews = 0;
        let fullTimeWorking = 0;
        let queryTime = 0;

        log(`Начинаю обработку поискового запроса: ${this.singleQueryData.query} (${this.singleQueryData.pages} страниц(ы))`);
        const userAgent = config.common.userAgents[getRandom(0, config.common.userAgents.length)];
        log(userAgent)

        this.singleQueryData.page.setUserAgent(userAgent)
        this.singleQueryData.config = config

        const router = new Router(this.singleQueryData)
        result = await router.toEngine()

        const resNum = Number(result.length)

        if (!resNum || resNum === 0) {
            log('Ошибка при обработке запроса, пробую еще раз');
            isGo = true;
            await this.singleQueryData.page.close()
        } else {
            await store.setNews(result)

            //*****************************Stats area ****************************************************************//
            let staticstics = calculateStatistics(AllNews, resNum, goTime, now);
            AllNews = staticstics.AllNews;
            fullTimeWorking = staticstics.fullTimeWorking;
            queryTime = staticstics.queryTime;
            queryCount += 1;
            //********************************************************************************************************//

            log(`Обработка запроса заняла ${queryTime} секунд! Всего получено ${resNum} новостей. Всего обработано ${queryCount} запросов за ${secToMinToHoursConvert(fullTimeWorking)}!`);

            if (!isServer) {
                log('Бот остановлен!');
            }
        }
    }

    async stop() {
        isServer = false;
        isGo = true;
        log('Останавливаю бота')
        process.exit(0);
    }
}

export default new Lifecycle()