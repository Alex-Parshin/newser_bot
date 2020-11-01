"use strict";

import io from "socket.io-client";
import Lifecycle from "./lib/core/lifecycle.js";
import store from "./lib/core/state/stateManager";
import dotenv from "dotenv";
import { log } from './lib/core/state/stateManager'

dotenv.config();

const lifecycle = new Lifecycle();

try {
    log('Подключаюсь к сокет-серверу...', 0);
    const socket = io.connect(
        `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`
    );
    store.setSocket(socket);
} catch (err) {
    log(`Ошибка подключения к сокет серверу: ${err}`, 0)
}

socket.on("confirm", () => {
  log('Connection approved!', 0);
});

socket.on("startBot", ({ source, pages, url, engines }) => {
  store.setEngines(engines);
  lifecycle.start({ source, pages, url, engines });
});

socket.on("addQueryToQueue", ({ query, id_request, engine }) => {
  addQueryToQueue({ query, id_request, engine });
});

socket.on("stopBot", () => {
  lifecycle.stop();
});
