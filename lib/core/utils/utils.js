'use strict'

import cli from 'cli-color'
import fs from 'fs'
import path from 'path'
import points from './../../../data/points.json'
import store from './../state/stateManager'

export async function autoscroll() {
    await store.getPage().evaluate(async () => {
        await new Promise((resolve) => {
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
    const newMS = getRandom(ms, ms + 7000)
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
    const filePath = `${path.resolve()}/data/points.json`
    if (!fs.existsSync(filePath)) {
        fs.open('queries.json', 'w', (err) => {
            if (err) throw err;
            console.log('Создан файл записи запросов');
            fs.writeFileSync(filePath, '[]')
        });
    }
    points.push(point)
    fs.writeFileSync(filePath, JSON.stringify(points))
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