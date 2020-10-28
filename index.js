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
import Lifecycle from './lib/core/lifecycle'
import config from './lib/data/configuration.json'
import router from './router'

// Global vars
var BOT_STATUS = 'off'

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

// New instance of Lifecycle class with io parameter
const lifecycle = new Lifecycle(io)
lifecycle.mainQueue()

io.on('connect', socket => {
    
    socket.emit('message', {
        message: `Бот подключен!`,
        sender: 'Newser',
        code: 0,
        subtitle: 'В работе'
    })

    BOT_STATUS = 'connected'

    socket.on('startBot', ({ source, query, id_request, pages, url, engines }) => {
        if (url === "") url = process.env.QUERY_URL
        
        lifecycle.start(source, query, id_request, pages, url, engines)
        BOT_STATUS = 'working'
    })
    socket.on('stopBot', () => {
        lifecycle.stop()
    })
});

// Frontend
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(`${path.resolve()}/public/`));

    app.get(/.*/, (_, res) => {
        res.sendFile(`${path.resolve()}/public/index.html`);
    })
}