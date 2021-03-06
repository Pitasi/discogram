const Discord = require('discord.io')

let bot = new Discord.Client({
    token: process.env.DISCORD_TOKEN,
    autorun: true
})

let escape = (string) => (
  string.replace(/\<|\>/gi, (match) => {
    let m = {'<': '\\<', '>': '\\>'}
    return m[match]
  })
)

let getGame = (user) => {
  if (user.bot || !user.game) return null
  return escape(user.game.name)
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
      username: escape(bot.users[id].username),
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
      name: escape(channels[c].name),
      users: usersInChannel(channels[c])
    })
  }
  return {name: escape(server.name), channels: res}
}

bot.on('message', function(user, userID, channelID, message, event) {
  if (message === "++tglink")
    bot.sendMessage({
      to: channelID,
      message:
        'Click here to link this server to your **Telegram profile**:\n' +
        `:point_right: <https://t.me/discogrambot?start=disc_${bot.channels[channelID].guild_id}>\n\n`+
        'OR click here to link this server to a **Telegram group**:\n' +
        `:point_right: <https://t.me/discogrambot?startgroup=disc_${bot.channels[channelID].guild_id}>\n\n`+
        '**Remember**: you can always remove a link using the __++tgunlink__ command.'
    })
  else if (message === '++tgunlink')
    bot.sendMessage({
      to: channelID,
      message:
        'Click here to unlink this server from your **Telegram profile**:\n' +
        `<https://t.me/discogrambot?start=undisc_${bot.channels[channelID].guild_id}>\n\n`+
        'OR click here to unlink the server from a **Telegram group**:\n' +
        `<https://t.me/discogrambot?startgroup=undisc_${bot.channels[channelID].guild_id}>`
    })
})

bot.on('ready', (event) => {
  bot.setPresence({game: {name: 'Type ++tglink'}})
});

module.exports = {
  onReady: (cb) => ( bot.on('ready', cb) ),
  users: (serverId) => ( channels(serverId) ),
  isValid: (serverId) => (
    bot.servers[serverId] != null && bot.servers[serverId] != undefined
  ),
  getId: () => (bot.id),
  createInvite: (serverId, callback) => (
    bot.createInvite({channelID: serverId, max_age: 0, max_users: 0}, callback)
  )
}
