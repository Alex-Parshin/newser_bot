'use strict'

import io from 'socket.io-client'
import Lifecycle from './lib/core/lifecycle.js'
import store from './lib/core/state/stateManager'
import dotenv from 'dotenv'
dotenv.config()

const lifecycle = new Lifecycle()

export default function socketManager() {

    console.log('Connecting to socket server...')

    const socket = io.connect(`${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`)
    store.setSocket(socket)

    socket.on('confirm', () => {
        console.log("Connection approved!")
    })

    socket.on('startBot', ({ source, pages, url, engines }) => {
        store.setEngines(engines)
        lifecycle.start({ source, pages, url, engines })
    })

    socket.on('addQueryToQueue', ({query, id_request, engine}) => {
        addQueryToQueue({query, id_request, engine})
    })

    socket.on('stopBot', () => {
        lifecycle.stop()
    })
}

socketManager()