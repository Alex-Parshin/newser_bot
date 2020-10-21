'use strict'
const readline = require('readline');
const cli = require('cli-color')
const fs = require('fs')

class Utils {

    constructor(page) {

        if (Utils.exists) {
            this.page = page;
            return Utils.instance;
        }
        this.page = page;
        Utils.instance = this;
        Utils.exists = true;

    }

    async autoscroll(page) {
        await page.evaluate(async() => {
            await new Promise((resolve, reject) => {
                var totalHeight = 0;
                var distance = 100;
                var timer = setInterval(() => {
                    var scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    setTimeout(() => {
                        clearInterval(timer);
                        resolve();
                    }, 2000);
                }, 200);
            });
        });
    }

    async sleep(ms, msg = '') {
        const newMS = this.getRandom(ms, ms + 10000)
        console.log(cli.magenta("Задержка " + (newMS / 1000).toFixed(2) + " секунд (" + msg + ")"))
            // await this.mouseEmulate()
        return new Promise(resolve => setTimeout(resolve, newMS));
    }

    getRandom(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    secToMinToHoursConvert(seconds) {
        seconds = Number(seconds)

        if (seconds <= 60) {
            return `${seconds} секунд`
        }
        if (seconds > 60 && seconds <= 3600) {

            let minutes = Math.floor(seconds / 60)
            let sec = Math.floor(seconds - minutes * 60)

            return `${minutes} минут и ${sec} секунд`
        }
        if (seconds > 3600) {

            let hours = Math.floor(seconds / 3600)
            let minutes = Math.floor((seconds - hours * 3600) / 60)
            let sec = Math.floor(seconds - hours * 3600 - minutes * 60)

            return `${hours} часов, ${minutes} минут и ${sec} секунд`
        }
    }

    calculateStatistics(AllNews, resNum, goTime, now) {
        AllNews = AllNews + Number(resNum) // подстчет количества полученных новостей за время работы бота

        let curTime = new Date() // запись текущей даты и времени
        let fullTimeWorking = (curTime - goTime) / 1000 // расчет времени непрерывной работы бота
        let queryTime = (curTime - now) / 1000 // расчет времени обработки запроса

        return {
            AllNews: AllNews,
            fullTimeWorking: fullTimeWorking,
            queryTime: queryTime
        }
    }

    drawPoints(point) {
        const pathToPointsJSON = './../../../data/points.json'
        let points = []
        try {
            points = require(pathToPointsJSON)
            points.push(point)
        } catch (err) {
            points.push(point)
        }
        fs.writeFileSync('./data/points.json', JSON.stringify(points))
    }

    async mouseEmulate() {
        console.log("Эмулирую движение мышью")
        const steps = this.getRandom(1, 3)
        const distance = this.getRandom(100, 500)

        for (let i = 0; i < steps; i++) {
            await this.page.mouse.move(0, distance)
            await this.page.mouse.move(distance, distance)
            await this.page.mouse.move(distance, 0)
            await this.page.mouse.move(0, 0)
        }

    }
}

module.exports = Utils;