import store from './lib/core/state/stateManager'
import { addQueryToQueue } from './lib/core/provider'
import Lifecycle from './lib/core/lifecycle'

export default function socketManager() {

    const lifecycle = new Lifecycle()
    lifecycle.mainQueue()
    
    const io = store.getSocket()

    io.on('connect', socket => {
        socket.emit('message', {
            message: `Бот подключен!`,
            sender: 'Newser',
            code: 0,
            subtitle: 'В работе'
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

    })
}