import express from 'express'

const router = express.Router()

router.use(function timeLog (req, res, next) {
  next()
})

router.get('/', (req,res) => {
    res.send('Welcome to socket server API')
})
// router.post('/login', function(req, res) {
//     let auth = false
//     const login = req.body.login
//     const password = req.body.password
//     user_list.forEach(user => {
//         if (login === user.login && password === user.password) {
//             auth = true
//             res.json({ user: 'admin', token: Date.now() })
//         }
//     })
//     if (auth === false) res.json({ error: 'Auth error!' })
// })

// router.post('/updateConfig', function(req, res) {
//     try {
//         fs.writeFileSync('./lib/data/configuration.json', JSON.stringify(req.body.config))
//         res.send("Success")
//         process.exit(0)
//     } catch (e) {
//         res.send(`Error! ${e}`)
//     }
// })

// router.get('/config', function(req, res) {
//     res.json({
//         status: "Success",
//         config: config
//     })
// })

// router.get('/graph', function(req, res) {
//     res.json(points)
// })

export default router;