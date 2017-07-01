const discord = require('./discord.js')
const chats = require('./chats.js')
const TelegramBot = require('node-telegram-bot-api')

let tgbot = new TelegramBot(
  process.env.TELEGRAM_TOKEN,
  { polling: {params: {timeout: 1, interval: 100}} }
)

// Update button for messages
const markup = {
  parse_mode: 'HTML',
  reply_markup: {inline_keyboard: [[{
    text: 'Update',
    callback_data: 'update'
  }]]}
}

// Returns a formatted string from array of servers
let formatMessage = (servers) => {
  if (!servers || servers.length == 0)
    return 'You first need to link a server via Discord!\n' +
           'Type /start to get help.'

  let result = ''
  servers.forEach((o) => {
    let msg = `[ ${o.name} ]\n` // 1st line: discord server name
    let filteredChannels =
      o.channels.filter((channel) => (channel.users.length > 0))
    if (filteredChannels.length == 0) {
      result += msg + 'So much empty. 🦊\n\n'
      return
    }

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
        if (user.game) msg += `\n└─🎮 <i>${user.game}</i>`
        msg += '\n'
      }
      msg += '\n'
    })
    result += msg
  })
  return result
}

// Given a Telegram group id returns Discord servers array
let chatDispatch = (telegramId, callback) => {
  chats.getDiscordId(telegramId, (err, rows) => {
    if (err) return console.error(err)
    let res = []
    for (let i in rows) {
      let users = discord.users(rows[i].discordId)
      if (users == null) chats.delete(telegramId, rows[i].discordId)
      else res.push(users)
    }
    callback(res)
  })
}

// Handler for callback queries - the update button
let callbackHandler = (call) => {
  let opt = {
    chat_id: call.message.chat.id,
    message_id: call.message.message_id
  }
  Object.assign(opt, markup)
  chatDispatch(call.message.chat.id, (servers) => {
    tgbot.editMessageText(
      formatMessage(servers),
      opt
    )
    .catch(() => {})
    tgbot.answerCallbackQuery(call.id, 'Updated!')
  })
}

// Handler for /discord command
let cmdHandler = (msg) => {
  chatDispatch(msg.chat.id, (servers) => {
    tgbot.sendMessage(
      msg.chat.id,
      formatMessage(servers),
      markup
    )
  })
}

let startHandler = (msg) => {
  let payload = msg.text.split(' ')
  if (payload.length > 1 && payload[1].startsWith('disc_')) {
    let discordId = payload[1].slice(5)
    if (discord.isValid(discordId)) {
      chats.newLink(msg.chat.id, discordId, (success) => {
        if (success)
          tgbot.sendMessage(
            msg.chat.id,
            'Link established.\nYou are now ready to <b>rock</b>!\n\n/discord',
            { parse_mode: 'HTML' }
          )
        else
          tgbot.sendMessage(
            msg.chat.id,
            'Something went wrong.\n'+
            'Maybe this group is already linked to the Discord server?\n'+
            'Try /discord!',
            { parse_mode: 'HTML' }
          )
      })
    }
  }

  else if (payload.length > 1 && payload[1].startsWith('undisc_')) {
    let discordId = payload[1].slice(7)
    chats.delete(msg.chat.id, discordId)
    tgbot.sendMessage(
      msg.chat.id,
      'Link <b>removed</b> successfully.\n',
      { parse_mode: 'HTML' }
    )
  }

  else {
    // Normal /start command
    tgbot.sendMessage(msg.chat.id,
      'Hey there!\n' +
      'This bot shows a list of online Discord users, right on Telegram :)\n\n' +
      'a bot by <a href="https://bot.anto.pt">zaphodias</a>.',
      {
        parse_mode: 'HTML',
        reply_markup: {inline_keyboard: [[{
          text: 'How to use this bot',
          url: 'http://bot.anto.pt/discogram.html'
        }], [{
          text: 'Add the bot to Discord',
          url: `https://discordapp.com/oauth2/authorize?client_id=${discord.getId()}&scope=bot`
        }]]}
      }
    )
  }
}

// Starting Discord bot and registering telegram handlers
discord.onReady(() => {
  console.log('Bot is ready!')
  tgbot.on('callback_query', callbackHandler)
  tgbot.onText(/\/discord(.*)/, cmdHandler)
  tgbot.onText(/\/start(.*)/, startHandler)
})
