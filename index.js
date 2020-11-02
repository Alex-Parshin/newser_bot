"use strict";

import io from "socket.io-client";
import dotenv from "dotenv";
dotenv.config();

import lifecycle from "./lib/core/lifecycle.js";
import store from "./lib/core/state/stateManager";
import { log } from './lib/core/utils/utils'

log('Подключаюсь к сокет-серверу...', 0);
const socket = io.connect(`http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`);
socket.emit("who_am_i", 'puppeteer_bot');

store.setSocket(socket);
// lifecycle.mainQueue()

// socket.on("startBot", ({ source, pages, url, engines }) => {
//     store.setEngines(engines);
//     lifecycle.start({ source, pages, url, engines });
// });

// socket.on("addQueryToQueue", ({ query, id_request, engine }) => {
//     addQueryToQueue({ query, id_request, engine });
// });

// socket.on("stopBot", () => {
//     lifecycle.stop();
// });