"use strict";

import io from "socket.io-client";
import dotenv from "dotenv";
dotenv.config();

import lifecycle from "./lib/core/lifecycle.js";
import store from "./lib/core/state/stateManager";
import { log } from './lib/core/utils/utils'

try {
    index()
} catch (err) {
    console.log(`Ошибка подключения к сокет серверу: ${err}`, 0)
}

function index() {
    log('Подключаюсь к сокет-серверу...', 0);
    const socket = io.connect(
        `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`
    );
    store.setSocket(socket);

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
}
