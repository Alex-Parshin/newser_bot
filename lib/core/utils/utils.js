'use strict'

import cli from 'cli-color'
import fs from 'fs'

export async function autoscroll() {
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

export async function sleep(ms, msg = '') {
    const newMS = this.getRandom(ms, ms + 7000)
    console.log(cli.magenta("Задержка " + (newMS / 1000).toFixed(2) + " секунд (" + msg + ")"))
    return new Promise(resolve => setTimeout(resolve, newMS));
}

export function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

export function secToMinToHoursConvert(seconds) {
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

export function drawPoints(point) {
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

export function calculateStatistics(AllNews, resNum, goTime, now) {
    AllNews = AllNews + Number(resNum)
    let curTime = new Date()
    let fullTimeWorking = (curTime - goTime) / 1000
    let queryTime = (curTime - now) / 1000
    return {
        AllNews: AllNews,
        fullTimeWorking: fullTimeWorking,
        queryTime: queryTime
    }
}