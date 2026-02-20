import TelegramBot from "node-telegram-bot-api"
import cron from "node-cron"
import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"

// ambil token dari Railway ENV
const bot = new TelegramBot(process.env.TOKEN_BOT, { polling: true })

// database
const adapter = new JSONFile("db.json")
const db = new Low(adapter)

await db.read()
db.data ||= { karyawan: [] }

// =======================
// COMMAND TAMBAH KARYAWAN
// =======================
bot.onText(/\/add (.+) (.+) (.+)/, async (msg, match) => {
  const nama = match[1]
  const dana = match[2]
  const tanggal = match[3]

  db.data.karyawan.push({ nama, dana, tanggal })
  await db.write()

  bot.sendMessage(msg.chat.id, `✅ ${nama} ditambahkan`)
})

// =======================
// COMMAND LIST
// =======================
bot.onText(/\/list/, async (msg) => {
  if (!db.data.karyawan.length)
    return bot.sendMessage(msg.chat.id, "Belum ada data karyawan")

  let teks = "📋 DATA KARYAWAN\n\n"

  db.data.karyawan.forEach((e, i) => {
    teks += `${i+1}. ${e.nama}\nDANA: ${e.dana}\nGajian: ${e.tanggal}\n\n`
  })

  bot.sendMessage(msg.chat.id, teks)
})

// =======================
// COMMAND HAPUS
// =======================
bot.onText(/\/hapus (.+)/, async (msg, match) => {
  const nama = match[1]

  db.data.karyawan = db.data.karyawan.filter(e => e.nama !== nama)
  await db.write()

  bot.sendMessage(msg.chat.id, `🗑 ${nama} dihapus`)
})

// =======================
// CRON CEK GAJIAN
// =======================
cron.schedule("0 8 * * *", async () => {
  const today = new Date().getDate().toString()

  db.data.karyawan.forEach(e => {
    if (e.tanggal === today) {
      bot.sendMessage(
        process.env.ADMIN_ID,
        `💰 Hari ini gajian:\n\nNama: ${e.nama}\nDANA: ${e.dana}`
      )
    }
  })
})

console.log("Bot aktif 🚀")
