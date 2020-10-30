'use strict'

// NPM modules
import express from 'express'
import socket from 'socket.io'
import path from 'path'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
dotenv.config()

// Custom modules
import router from './router'
import store from './lib/core/state/stateManager'
import socketManager from './socket'
import { checkQueueFile } from './lib/core/provider'

// App setup
const PORT = process.env.SERVER_PORT;

const app = express();

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

const server = app.listen(PORT, function() {
    console.log(`Listening on port ${PORT}`);
});

// Static files
app.use(express.static("public"));
app.use('/static', express.static(path.join(path.resolve(), 'public')))

app.use('/', router)

// Socket setup
const io = socket(server);
store.setSocket(io)
checkQueueFile()
socketManager()

// Frontend
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(`${path.resolve()}/public/`));

    app.get(/.*/, (_, res) => {
        res.sendFile(`${path.resolve()}/public/index.html`);
    })
}