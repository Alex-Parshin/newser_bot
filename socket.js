import store from './lib/core/state/stateManager'
import Lifecycle from './lib/core/lifecycle'

export default function socketManager() {
    const lifecycle = new Lifecycle()
    const io = store.getSocket()

    io.on('connect', socket => {
        socket.emit('message', {
            message: `Бот подключен!`,
            sender: 'Newser',
            code: 0,
            subtitle: 'В работе'
        })

        socket.on('startBot', ({ source, query, id_request, pages, url, engines }) => {
            store.setSource(source)
            store.setQuery(query)
            store.setIdRequest(id_request)
            store.setPages(pages)
            store.setUrl(url)
            store.setEngines(engines)

            lifecycle.start()
        })

        socket.on('stopBot', () => {
            lifecycle.stop()
        })

    })
}