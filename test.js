const fs = require('fs')
let points = []

function drawPoints(point) {
    try {
        points = require('./data/points.json')
        points.push(point)
    } catch (err) {
        points.push(point)
    }
    console.log(points);
    fs.writeFileSync('./data/points.json', JSON.stringify(points))
}

drawPoints({
    dateTime: new Date(Date.now()),
    value: 321
})