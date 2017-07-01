const sqlite3 = require('sqlite3')
let db = new sqlite3.Database(process.env.STORAGE_FILE || './storage/storage.db')

db.run('\
  CREATE TABLE IF NOT EXISTS chats (\
  telegramId VARCHAR(256),\
  discordId VARCHAR(256),\
  PRIMARY KEY (telegramId, discordId))'
);

module.exports = {
  getDiscordId: (telegramId, callback) => {
    return db.all('SELECT * FROM chats WHERE telegramId=?', [telegramId], callback)
  },

  delete: (telegramId, discordId) => {
    return db.run(
      'DELETE FROM chats WHERE telegramId=? AND discordId=?',
      [telegramId, discordId]
    )
  },

  newLink: (telegramId, discordId, callback) => {
    return db.run(
      'INSERT INTO chats VALUES (?, ?)',
      [telegramId, discordId],
      (err) => {
        if (err) {
          console.error(err)
          callback(false)
        }
        else callback(true)
    })
  }
}
