const Discord = require('discord.io')

let bot = new Discord.Client({
    token: process.env.DISCORD_TOKEN,
    autorun: true
})

let getGame = (user) => {
  if (user.bot || !user.game) return null
  return user.game.name
}

// Get user online in a channel
// Returns array of objects:
// [{id: string, username: string, game: string, deaf: bool, mute: bool}]
let usersInChannel = (channel) => {
  let res = []
  for (let m in channel.members) {
    let id = channel.members[m].user_id
    res.push({
      id: id,
      username: bot.users[id].username,
      game: getGame(bot.users[id]),
      bot: bot.users[id].bot,
      deaf: channel.members[m].self_deaf || channel.members[m].deaf,
      mute: channel.members[m].self_mute || channel.members[m].mute
    })
  }
  return res
}

// Get users for every voice channel
// Returs array of objects:
// {name: string, channels: [{name: string, users: array of user objects}]}
let channels = (serverId) => {
  let server = bot.servers[serverId]
  if (!server) return null

  let channels = server.channels
  let res = []
  for (var c in channels) {
    if (channels[c].type !== 'voice') continue
    res.push({
      name: channels[c].name,
      users: usersInChannel(channels[c])
    })
  }
  return {name: server.name, channels: res}
}

bot.on('message', function(user, userID, channelID, message, event) {
  if (message === "++tglink")
    bot.sendMessage({
      to: channelID,
      message:
      'Click here to add the bot to a Telegram group:\n' +
      `https://t.me/discogrambot?startgroup=disc_${bot.channels[channelID].guild_id}\n\n`+
      'Remember: you can always remove a link using the ++tgunlink command.'
    })
  else if (message === '++tgunlink')
    bot.sendMessage({
      to: channelID,
      message:
      'Click here to unlink the server from a Telegram group:\n' +
      `https://t.me/discogrambot?startgroup=undisc_${bot.channels[channelID].guild_id}`
    })
})

bot.on('ready', (event) => {
  bot.setPresence({game: {name: 'Type ++tglink'}})
});

module.exports = {
  onReady: (cb) => { bot.on('ready', cb) },
  users: (serverId) => { return channels(serverId) },
  isValid: (serverId) => {
    return bot.servers[serverId] != null && bot.servers[serverId] != undefined
  },
  getId: () => (bot.id)
}
