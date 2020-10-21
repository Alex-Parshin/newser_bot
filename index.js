'use strict'

// NPM modules
const express = require("express");
const socket = require("socket.io");
const path = require('path')
const cors = require('cors')
const bodyParser = require('body-parser');
const fs = require('fs')
require('dotenv').config();

// Custom modules
const Run = require('./lib/core/run.js')
const config = require('./lib/data/configuration1.json')
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
app.use('/static', express.static(path.join(__dirname, 'public')))

// Socket setup
const io = socket(server);

// New instance of Run class with io parameter
const run = new Run(io)
run.run()

io.on('connect', socket => {
    socket.emit('message', {
        message: `Бот подключен!`,
        sender: 'Newser',
        code: 0,
        subtitle: 'В работе'
    })

    BOT_STATUS = 'connected'

    socket.on('startBot', () => {
        run.start()
        BOT_STATUS = 'working'
    })
    socket.on('stopBot', () => {
        run.stop()
    })
    socket.on('search_query', (query) => {
        run.search(query.substring(2, query.length))
    })
    socket.on('captcha', () => {
        run.captcha()
    })
});

// Routes
app.post('/api/login', function(req, res) {
    let auth = false
    const login = req.body.login
    const password = req.body.password
    const user_list = require('./data/users.json')
    user_list.forEach(user => {
        if (login === user.login && password === user.password) {
            auth = true
            res.json({ user: 'admin', token: Date.now() })
        }
    })
    if (auth === false) res.json({ error: 'Auth error!' })
})

app.post('/api/updateConfig', function(req, res) {
    try {
        fs.writeFileSync('./lib/data/configuration.json', JSON.stringify(req.body.config))
        res.send("Success")
        process.exit(0)
    } catch (e) {
        res.send(`Error! ${e}`)
    }
})

app.get('/api/config', function(req, res) {
    res.json({
        status: "Success",
        config: config
    })
})

app.get('/api/graph', function(req, res) {
    const points = require('./data/points.json')
    res.json(points)
})

// Frontend
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(__dirname + '/public/'));

    app.get(/.*/, (req, res) => {
        res.sendFile(__dirname + '/public/index.html');
    })
}