import dateFormer from './../lib/core/utils/date'

let dates = [
    '9 ноября, 12:59',
    '13 октября, 21:36',
    '2 сентября 2019'
]

dates.forEach(date => {
    console.log(dateFormer(7, date))
})