"use strict";

import io from "socket.io-client";
import dotenv from "dotenv";
dotenv.config();

import { log } from './lib/core/utils/utils'

import lifecycle from "./lib/core/lifecycle.js";
import store from "./lib/core/state/stateManager";


const port = process.env.SERVER_PORT
const host = process.env.SERVER_HOST
log(`Подключаюсь к сокет-серверу http://${host}:${port}`);
const socket = io.connect(`http://${host}:${port}`);

socket.emit("who_am_i", 'puppeteer_bot');
store.setSocket(socket);
log('Ожидаю команды СТАРТ')

lifecycle.mainQueue()

socket.on("start", ({ source, pages, url, engines }) => {
    store.setEngines(engines);
    lifecycle.start({ source, pages, url, engines });
})

socket.on('restart', () => {
    log('Перезагружаю бота')
    process.exit(0)
})

socket.on("stop", () => {
    lifecycle.stop()
})

socket.on('disconnect', () => {
    console.log('Сервер отключился. Завершение работы')
    process.exit(0)
})