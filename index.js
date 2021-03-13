'use strict'

const fetch = require('node-fetch')
const fx = require('money')
const {dbUpdate, dbGetRates, dbCheckTime} = require('./db')
const TelegramBot = require('node-telegram-bot-api')
const TOKEN = '1654530982:AAFCDVvMBXhy3RPdAQEb7Fd4uScmuSaBZ5A'
const bot = new TelegramBot(TOKEN, {
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10,
        },
    }
})
const objKeyIncludes = (obj, word) => {
    let keys = [];

    for (let key in obj) {
        keys.push(key)
    }
    return keys.includes(word)
}

fetch('https://api.exchangeratesapi.io/latest?base=USD')
        .then((res) => res.json())
        .then(res => {
            fx.rates = res.rates
            fx.base = res.rates.USD
        })

bot.on('polling_error', console.log)

bot.onText(/li?st/, (message) => {
    dbCheckTime().then((time) => {
        if ((Date.now() - time) >= 600000) {
            fetch('https://api.exchangeratesapi.io/latest?base=USD')
                .then((res) => res.json())
                .then((data) => {
                    let botMessage = ''
                    
                    dbUpdate(data)
                    for (const [key, value] of Object.entries(data.rates)) {
                        botMessage += `${key}: ${value.toFixed(2)}\n`
                    }
                    bot.sendMessage(message.chat.id, botMessage)
                })
        } else {
            dbGetRates()
                .then((rates) => {
                    let botMessage = ''

                    for (const [key, value] of Object.entries(rates)) {
                        if (key !== '_id' && key !== 'date') {
                            botMessage += `${key}: ${value.toFixed(2)}\n` 
                        }
                    }
                    bot.sendMessage(message.chat.id, botMessage)
            })
        }
    })
})

bot.onText(/exchange (.+) to (.+)/, (message, matched) => {
    const fromVal = +matched[1].split(' ')[0].match(/\d+/)
    const currency1 = matched[1].split(' ').length <= 1 ? 'USD' : matched[1].split(' ')[1]
    const currency2 = matched[2]

    fetch('https://api.exchangeratesapi.io/latest?base=USD')
                .then((res) => res.json())
                .then((data) => {                    
                    if (objKeyIncludes(data.rates, currency2) && objKeyIncludes(data.rates, currency1)) {
                        let result = fx(fromVal).from(currency1).to(currency2);
                        bot.sendMessage(message.chat.id, "$" + result.toFixed(2))
                    } else if (!objKeyIncludes(data.rates, currency1) && !objKeyIncludes(data.rates, currency2)) {
                        bot.sendMessage(message.chat.id, `Invalid both currencies - ${currency1} and ${currency2}`)
                    } else if (!objKeyIncludes(data.rates, currency1)) {
                        bot.sendMessage(message.chat.id, `Invalid first currency - ${currency1}`)
                    } else {
                        bot.sendMessage(message.chat.id, `Invalid second currency - ${currency2}`)
                    }
                })
})

bot.onText(/history (.+)\/(.+)/, (message, matched) => {
    let toDay = new Date();
    let lastWeek = new Date(new Date().setDate(new Date().getDate() - 14))

    let stringDay = `${toDay.getFullYear()}-${toDay.getMonth() + 1}-${toDay.getDate()}`
    let stringWeek = `${lastWeek.getFullYear()}-${lastWeek.getMonth() + 1}-${lastWeek.getDate()}`

    if (objKeyIncludes(fx.rates, matched[1]) && objKeyIncludes(fx.rates, matched[2])) {
        fetch(`https://api.exchangeratesapi.io/history?start_at=${stringWeek}&end_at=${stringDay}&base=${matched[1]}&symbols=${matched[2]}`)
        .then((res) => res.json())
        .then(re => {
            bot.sendMessage(message.chat.id, "Here must be a picture")
        })
    } else if (!objKeyIncludes(fx.rates, matched[1]) && !objKeyIncludes(fx.rates, matched[2])) {
        bot.sendMessage(message.chat.id, `Invalid both currencies - ${matched[1]} and ${matched[2]}`)
    } else if (!objKeyIncludes(fx.rates, matched[1])) {
        bot.sendMessage(message.chat.id, `Invalid first currency - ${matched[1]}`)
    } else {
        bot.sendMessage(message.chat.id, `Invalid second currency - ${matched[2]}`)
    }
})
