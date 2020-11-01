'use strict'

// NPM modules
import express from 'express'
import path from 'path'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
dotenv.config()

// Custom modules
import router from './router'
import socketManager from './socket'

// App setup
const PORT = process.env.SERVER_PORT;

const app = express();

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use('/', router)

const server = app.listen(5000, () => {
    console.log('Listening on port 3000')
})

socketManager(server)

// Static files
app.use(express.static("public"));
app.use('/static', express.static(path.join(path.resolve(), 'public')))

// Frontend
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(`${path.resolve()}/public/`));

    app.get(/.*/, (_, res) => {
        res.sendFile(`${path.resolve()}/public/index.html`);
    })
}