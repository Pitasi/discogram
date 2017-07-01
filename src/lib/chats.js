const sqlite3 = require('sqlite3')
let db = new sqlite3.Database(process.env.STORAGE_FILE || './storage.db')

db.run('\
  CREATE TABLE IF NOT EXISTS chats (\
  telegramId VARCHAR(256),\
  discordId VARCHAR(256),\
  PRIMARY KEY (telegramId, discordId))'
);

module.exports = {
  getDiscordId: (telegramId, callback) => {
    return db.get('SELECT * FROM chats WHERE telegramId=?', [telegramId], callback)
  },

  newLink: (telegramId, discordId) => {
    return db.run('INSERT INTO chats VALUES (?, ?)', [telegramId, discordId])
  }
}
