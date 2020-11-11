import store from "./../state/stateManager";
import { toTextFile } from "./logger";

export async function autoscroll(page) {
    await page.evaluate(async() => {
        await new Promise((resolve) => {
            let distance = 200;
            let timer = setInterval(() => {
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

export async function sleep(ms, msg = "") {
    const newMS = getRandom(ms, ms + 3000);
    log("Задержка " + (newMS / 1000).toFixed(2) + " секунд (" + msg + ")")
    return new Promise((resolve) => setTimeout(resolve, newMS));
}

export function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

export function secToMinToHoursConvert(seconds) {
    seconds = Number(seconds);
    if (seconds <= 60) {
        return `${seconds} секунд`;
    }
    if (seconds > 60 && seconds <= 3600) {
        let minutes = Math.floor(seconds / 60);
        let sec = Math.floor(seconds - minutes * 60);
        return `${minutes} минут и ${sec} секунд`;
    }
    if (seconds > 3600) {
        let hours = Math.floor(seconds / 3600);
        let minutes = Math.floor((seconds - hours * 3600) / 60);
        let sec = Math.floor(seconds - hours * 3600 - minutes * 60);
        return `${hours} часов, ${minutes} минут и ${sec} секунд`;
    }
}

export function calculateStatistics(AllNews, resNum, goTime, now) {
    AllNews = AllNews + Number(resNum);
    let curTime = new Date();
    let fullTimeWorking = (curTime - goTime) / 1000;
    let queryTime = (curTime - now) / 1000;
    return {
        AllNews: AllNews,
        fullTimeWorking: fullTimeWorking,
        queryTime: queryTime,
    };
}

export function log(text) {
    console.log(text);
    toTextFile(text);
    try {
        store.getSocket().emit('log', new Date(Date.now()).toLocaleDateString() + ' ' + new Date(Date.now()).toLocaleTimeString() + ' | ' + text);
    } catch (err) {
        console.log(`Ошибка подключения к сокет серверу: ${err}`)
    }
}