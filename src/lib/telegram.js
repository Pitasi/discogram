const discord = require('./discord.js')
const chats = require('./chats.js')
const TelegramBot = require('node-telegram-bot-api')

let tgbot = new TelegramBot(
  process.env.TELEGRAM_TOKEN,
  { polling: {timeout: 1, interval: 100} }
)

// Update button for messages
const markup = {
  parse_mode: 'HTML',
  reply_markup: {inline_keyboard: [[{
    text: 'Update',
    callback_data: 'update'
  }]]}
}

// Returns a formatted string from array of channels
let formatMessage = (o) => {
  let msg = `[ ${o.name} ]\n\n` // 1st line: discord server name
  let filteredChannels =
    o.channels.filter((channel) => {return channel.users.length > 0})
  if (filteredChannels.length == 0)
    return msg + 'So much empty. 🦊'

  filteredChannels.forEach((c) => {
    msg += `👥 <b>${c.name}</b>\n` // channel name
    for (let u in c.users) {       // users info and status:
      let user = c.users[u]
      msg += (user.bot) ?
             '└🤖 ' :
             '└👤 '
      msg += user.username
      if (user.mute) msg += ' 🙊'
      if (user.deaf) msg += ' 🙉'
      if (user.game) msg += `\n  (${user.game})`
      msg += '\n'
    }
    msg += '\n'
  })
  return msg;
}

// Given a Telegram group id returns Discord channels array
let chatDispatch = (telegramId, callback) => {
  chats.getDiscordId(telegramId, (err, row) => {
    if (err) return console.error(err)
    callback(discord.users(row.discordId))
  })
}

// Handler for callback queries - the update button
let callbackHandler = (call) => {
  let opt = {
    chat_id: call.message.chat.id,
    message_id: call.message.message_id
  }
  Object.assign(opt, markup)
  chatDispatch(call.message.chat.id, (o) => {
    tgbot.editMessageText(
      formatMessage(o),
      opt
    )
    .catch(() => {})
    tgbot.answerCallbackQuery(call.id, 'Updated!')
  })
}

// Handler for /discord command
let cmdHandler = (msg) => {
  chatDispatch(msg.chat.id, (o) => {
    tgbot.sendMessage(
      msg.chat.id,
      formatMessage(o),
      markup
    )
  })
}

// Starting Discord bot and registering telegram handlers
discord.onReady(() => {
  tgbot.on('callback_query', callbackHandler)
  tgbot.onText(/\/discord(.*)/, cmdHandler)
})
