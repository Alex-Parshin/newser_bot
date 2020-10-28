'use strict'
const readline = require('readline');
const cli = require('cli-color')
const fs = require('fs')

class Utils {
    constructor(page) {
        if (Utils.exists) {
            return Utils.instance;
        }
        this.page = page;
        Utils.instance = this;
        Utils.exists = true;
    }

    async autoscroll() {
        await this.page.evaluate(async() => {
            await new Promise((resolve, reject) => {
                var totalHeight = 0;
                var distance = 200;
                var timer = setInterval(() => {
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
        const newMS = this.getRandom(ms, ms + 7000)
        console.log(cli.magenta("Задержка " + (newMS / 1000).toFixed(2) + " секунд (" + msg + ")"))
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
}

module.exports = Utils;