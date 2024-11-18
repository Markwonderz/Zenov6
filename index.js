require('./setting')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, getAggregateVotesInPollMessage, proto } = require("@whiskeysockets/baileys")
const fs = require('fs')
const pino = require('pino')
const chalk = require('chalk')
const path = require('path')
const readline = require("readline");
const axios = require('axios')
const FileType = require('file-type')
const yargs = require('yargs/yargs')
const _ = require('lodash')
const { Boom } = require('@hapi/boom')
const PhoneNumber = require('awesome-phonenumber')
const usePairingCode = true
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require('./lib/myfunc')
const { isSetClose,
    addSetClose,
    removeSetClose,
    changeSetClose,
    getTextSetClose,
    isSetDone,
    addSetDone,
    removeSetDone,
    changeSetDone,
    getTextSetDone,
    isSetLeft,
    addSetLeft,
    removeSetLeft,
    changeSetLeft,
    getTextSetLeft,
    isSetOpen,
    addSetOpen,
    removeSetOpen,
    changeSetOpen,
    getTextSetOpen,
    isSetProses,
    addSetProses,
    removeSetProses,
    changeSetProses,
    getTextSetProses,
    isSetWelcome,
    addSetWelcome,
    removeSetWelcome,
    changeSetWelcome,
    getTextSetWelcome,
    addSewaGroup,
    getSewaExpired,
    getSewaPosition,
    expiredCheck,
    checkSewaGroup
} = require("./lib/store")
const pushname = smsg.pushName
let set_welcome_db = JSON.parse(fs.readFileSync('./database/set_welcome.json'));
let set_left_db = JSON.parse(fs.readFileSync('./database/set_left.json'));
let _welcome = JSON.parse(fs.readFileSync('./database/welcome.json'));
let _left = JSON.parse(fs.readFileSync('./database/left.json'));
let set_proses = JSON.parse(fs.readFileSync('./database/set_proses.json'));
let set_done = JSON.parse(fs.readFileSync('./database/set_done.json'));
let set_open = JSON.parse(fs.readFileSync('./database/set_open.json'));
let set_close = JSON.parse(fs.readFileSync('./database/set_close.json'));
let sewa = JSON.parse(fs.readFileSync('./database/sewa.json'));
let setpay = JSON.parse(fs.readFileSync('./database/pay.json'));
let opengc = JSON.parse(fs.readFileSync('./database/opengc.json'));
let antilink = JSON.parse(fs.readFileSync('./database/antilink.json'));
let antiwame = JSON.parse(fs.readFileSync('./database/antiwame.json'));
let antilink2 = JSON.parse(fs.readFileSync('./database/antilink2.json'));
let antiwame2 = JSON.parse(fs.readFileSync('./database/antiwame2.json'));
let db_respon_list = JSON.parse(fs.readFileSync('./database/list.json'));
const question = (text) => {
  const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
  });
  return new Promise((resolve) => {
rl.question(text, resolve)
  })
};
//=================================================//
var low
try {
low = require('lowdb')
} catch (e) {
low = require('./lib/lowdb')}
//=================================================//
const { Low, JSONFile } = low
const mongoDB = require('./lib/mongoDB')
//=================================================//
//=================================================//
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
//=================================================//
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.db = new Low(
/https?:\/\//.test(opts['db'] || '') ?
new cloudDBAdapter(opts['db']) : /mongodb/.test(opts['db']) ?
new mongoDB(opts['db']) :
new JSONFile(`./src/database.json`)
)
global.DATABASE = global.db // Backwards Compatibility
global.loadDatabase = async function loadDatabase() {
if (global.db.READ) return new Promise((resolve) => setInterval(function () { (!global.db.READ ? (clearInterval(this), resolve(global.db.data == null ? global.loadDatabase() : global.db.data)) : null) }, 1 * 1000))
if (global.db.data !== null) return
global.db.READ = true
await global.db.read()
global.db.READ = false
global.db.data = {
users: {},
chats: {},
game: {},
database: {},
settings: {},
setting: {},
others: {},
sticker: {},
...(global.db.data || {})}
  global.db.chain = _.chain(global.db.data)}
loadDatabase()
//=================================================//
//=================================================//
 
async function connectToWhatsApp() {
const { state, saveCreds } = await useMultiFileAuthState(global.sessionName)
console.log(chalk.red.bold('⡏⠉⠉⠉⠉⠉⠉⠋⠉⠉⠉⠉⠉⠉⠋⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠙⠉⠉⠉⠹\n⡇⢸⣿⡟⠛⢿⣷ ⢸⣿⡟⠛⢿⣷⡄⢸⣿⡇ ⢸⣿⡇⢸⣿⡇ ⢸⣿⡇ \n⡇⢸⣿⣧⣤⣾⠿ ⢸⣿⣇⣀⣸⡿⠃⢸⣿⡇ ⢸⣿⡇⢸⣿⣇⣀⣸⣿⡇ \n⡇⢸⣿⡏⠉⢹⣿⡆⢸⣿⡟⠛⢻⣷⡄⢸⣿⡇ ⢸⣿⡇⢸⣿⡏⠉⢹⣿⡇ \n⡇⢸⣿⣧⣤⣼⡿⠃⢸⣿⡇ ⢸⣿⡇⠸⣿⣧⣤⣼⡿⠁⢸⣿⡇ ⢸⣿⡇ \n⣇⣀⣀⣀⣀⣀⣀⣄⣀⣀⣀⣀⣀⣀⣀⣠⣀⡈⠉⣁⣀⣄⣀⣀⣀⣠⣀⣀⣀⣰\n⣇⣿⠘⣿⣿⣿⡿⡿⣟⣟⢟⢟⢝⠵⡝⣿⡿⢂⣼⣿⣷⣌⠩⡫⡻⣝⠹⢿⣿⣷\n⡆⣿⣆⠱⣝⡵⣝⢅⠙⣿⢕⢕⢕⢕⢝⣥⢒⠅⣿⣿⣿⡿⣳⣌⠪⡪⣡⢑⢝⣇\n⡆⣿⣿⣦⠹⣳⣳⣕⢅⠈⢗⢕⢕⢕⢕⢕⢈⢆⠟⠋⠉⠁⠉⠉⠁⠈⠼⢐⢕⢽\n⡗⢰⣶⣶⣦⣝⢝⢕⢕⠅⡆⢕⢕⢕⢕⢕⣴⠏⣠⡶⠛⡉⡉⡛⢶⣦⡀⠐⣕⢕\n⡝⡄⢻⢟⣿⣿⣷⣕⣕⣅⣿⣔⣕⣵⣵⣿⣿⢠⣿⢠⣮⡈⣌⠨⠅⠹⣷⡀⢱⢕\n⡝⡵⠟⠈⢀⣀⣀⡀⠉⢿⣿⣿⣿⣿⣿⣿⣿⣼⣿⢈⡋⠴⢿⡟⣡⡇⣿⡇⡀⢕\n⡝⠁⣠⣾⠟⡉⡉⡉⠻⣦⣻⣿⣿⣿⣿⣿⣿⣿⣿⣧⠸⣿⣦⣥⣿⡇⡿⣰⢗⢄\n⠁⢰⣿⡏⣴⣌⠈⣌⠡⠈⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣬⣉⣉⣁⣄⢖⢕⢕⢕\n⡀⢻⣿⡇⢙⠁⠴⢿⡟⣡⡆⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣵⣵⣿\n⡻⣄⣻⣿⣌⠘⢿⣷⣥⣿⠇⣿⣿⣿⣿⣿⣿⠛⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⣷⢄⠻⣿⣟⠿⠦⠍⠉⣡⣾⣿⣿⣿⣿⣿⣿⢸⣿⣦⠙⣿⣿⣿⣿⣿⣿⣿⣿⠟\n⡝⡵⡈⢟⢕⢕⢕⢕⣵⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣶⣿⣿⣿⣿⣿⠿⠋⣀⣈⠙\n⡝⡵⡕⡀⠑⠳⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠛⢉⡠⡲⡫⡪⡪⡣\n\n𝐈 𝐍 𝐅 𝐎 𝐑 𝐌 𝐀 𝐓 𝐈 𝐎 𝐍\n𝐘𝐓 : DrayXD Official\n𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐄𝐑 : Dray\n𝐖𝐀 : 𝟬 𝟴 𝟯 𝟭 𝟱 𝟭 𝟱 𝟲 𝟴 𝟱 𝟭 𝟭\n\n𝙲𝚑𝚘𝚘𝚜𝚎 𝚢𝚘𝚞𝚛 𝚗𝚞𝚖𝚋𝚎𝚛 (𝟼𝟸𝚡𝚡𝚡𝚡):'))
const drayyy = makeWASocket({
logger: pino({ level: "silent" }),
printQRInTerminal: !usePairingCode,
auth: state,
browser: ['Chrome (Linux)', '', '']
});
if(usePairingCode && !drayyy.authState.creds.registered) {
		const phoneNumber = await question('𝚈𝚘𝚞𝚛 𝙽𝚞𝚖𝚋𝚎𝚛 ☞');
		const code = await drayyy.requestPairingCode(phoneNumber.trim())
		console.log(`Pairing code: ${code}`)

	}
drayyy.ev.on('connection.update', async (update) => {
const { connection, lastDisconnect } = update
if (connection === 'close') {
const reason = new Boom(lastDisconnect?.error)?.output.statusCode
console.log(lastDisconnect.error, 'deeppink')
if (lastDisconnect.error == 'Error: Stream Errored (unknown)') {
process.exit()
} else if (reason === DisconnectReason.badSession) {
console.log(`Bad Session File, Please Delete Session and Scan Again`)
process.exit()
} else if (reason === DisconnectReason.connectionClosed) {
console.log('[SYSTEM]', 'white'), color('Connection closed, reconnecting...', 'deeppink')
process.exit()
} else if (reason === DisconnectReason.connectionLost) {
console.log('[SYSTEM]', 'white'), color('Connection lost, trying to reconnect', 'deeppink')
process.exit()
} else if (reason === DisconnectReason.connectionReplaced) {
console.log('Connection Replaced, Another New Session Opened, Please Close Current Session First')
drayyy.logout()
} else if (reason === DisconnectReason.loggedOut) {
console.log(`Device Logged Out, Please Scan Again And Run.`)
drayyy.logout()
} else if (reason === DisconnectReason.restartRequired) {
console.log('Restart Required, Restarting...')
await connectToWhatsApp()
} else if (reason === DisconnectReason.timedOut) {
console.log('Connection TimedOut, Reconnecting...')
connectToWhatsApp()
}
} else if (connection === "connecting") {

} else if (connection === "open") {

drayyy.sendMessage(`6281298360151@s.whatsapp.net`, { text: `\`𝗛𝗮𝗹𝗼 𝗕𝗮𝗻𝗴 𝗗𝗿𝗮𝘆\`
 𝚉𝚎𝚗𝚘-𝚅𝟼 𝙱𝚎𝚛𝚑𝚊𝚜𝚒𝚕 𝙲𝚘𝚗𝚗𝚎𝚌𝚝`})
if (autoJoin) {
drayyy.groupAcceptInvite(codeInvite)
}
}
})

//=================================================//
drayyy.decodeJid = (jid) => {
if (!jid) return jid
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {}
return decode.user && decode.server && decode.user + '@' + decode.server || jid
} else return jid
}
//=================================================//
drayyy.ev.on('messages.upsert', async chatUpdate => {
try {
mek = chatUpdate.messages[0]
if (!mek.message) return
mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
if (mek.key && mek.key.remoteJid === 'status@broadcast') return
if (!drayyy.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
m = smsg(drayyy, mek, store)
require("./drayyy1922")(drayyy, m, chatUpdate, store)
} catch (err) {
console.log(err)
}
})

drayyy.ev.on('call', async (celled) => {
let botNumber = await drayyy.decodeJid(drayyy.user.id)
let koloi = global.anticall
if (!koloi) return
console.log(celled)
for (let kopel of celled) {
if (kopel.isGroup == false) {
if (kopel.status == "offer") {
let nomer = await drayyy.sendTextWithMentions(kopel.from, `*${drayyy.user.name}* tidak bisa menerima panggilan ${kopel.isVideo ? `video` : `suara`}. Maaf @${kopel.from.split('@')[0]} kamu akan diblokir. Silahkan hubungi Owner membuka blok !`)
drayyy.sendContact(kopel.from, owner.map( i => i.split("@")[0]), nomer)
await sleep(8000)
await drayyy.updateBlockStatus(kopel.from, "block")
}
}
}
})
   drayyy.ev.on('group-participants.update', async (anu) => {
        const isWelcome = _welcome.includes(anu.id)
        const isLeft = _left.includes(anu.id)
        try {
            let metadata = await drayyy.groupMetadata(anu.id)
            let participants = anu.participants
            const groupName = metadata.subject
  		      const groupDesc = metadata.desc
            for (let num of participants) {
                try {
                    ppuser = await drayyy.profilePictureUrl(num, 'image')
                } catch {
                    ppuser = 'https://img100.pixhost.to/images/53/532428061_skyzopedia.jpg'
                }

                try {
                    ppgroup = await drayyy.profilePictureUrl(anu.id, 'image')
                } catch {
                    ppgroup = 'https://img100.pixhost.to/images/53/532428061_skyzopedia.jpg'
                }
                if (anu.action == 'add' && isWelcome) {
                  console.log(anu)
                    if (isSetWelcome(anu.id, set_welcome_db)) {               	
                        var get_teks_welcome = await getTextSetWelcome(anu.id, set_welcome_db)
                    var replace_pesan = (get_teks_welcome.replace(/@user/gi, `@${num.split('@')[0]}`))
                        var full_pesan = (replace_pesan.replace(/@group/gi, groupName).replace(/@desc/gi, groupDesc))
                        drayyy.sendMessage(anu.id, { image: { url: ppuser }, mentions: [num], caption: `${full_pesan}` })
                       } else {
                       	drayyy.sendMessage(anu.id, { image: { url: ppuser }, mentions: [num], caption: `Halo @${num.split("@")[0]}, Welcome To ${metadata.subject}` })
                      }
                } else if (anu.action == 'remove' && isLeft) {
                	console.log(anu)
                  if (isSetLeft(anu.id, set_left_db)) {            	
                        var get_teks_left = await getTextSetLeft(anu.id, set_left_db)
                        var replace_pesan = (get_teks_left.replace(/@user/gi, `@${num.split('@')[0]}`))
                        var full_pesan = (replace_pesan.replace(/@group/gi, groupName).replace(/@desc/gi, groupDesc))
                      drayyy.sendMessage(anu.id, { image: { url: ppuser }, mentions: [num], caption: `${full_pesan}` })
                       } else {
                       	drayyy.sendMessage(anu.id, { image: { url: ppuser }, mentions: [num], caption: `Sayonara @${num.split("@")[0]}` })
                        }
                        } else if (anu.action == 'promote') {
                    drayyy.sendMessage(anu.id, { image: { url: ppuser }, mentions: [num], caption: ` @${num.split('@')[0]} Telah menjadi Admin Di Grup ${metadata.subject} `})
                } else if (anu.action == 'demote') {
                    drayyy.sendMessage(anu.id, { image: { url: ppuser }, mentions: [num], caption: `@${num.split('@')[0]} Telah Di Berhentikan Sebagai Admin Dari Grup ${metadata.subject}  ` })
              }
            }
        } catch (err) {
            console.log(err)
        }
    })

//=================================================//
drayyy.ev.on('contacts.update', update => {
for (let contact of update) {
let id = drayyy.decodeJid(contact.id)
if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }}})
//=================================================//
drayyy.getName = (jid, withoutContact  = false) => {
id = drayyy.decodeJid(jid)
withoutContact = drayyy.withoutContact || withoutContact 
let v
if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
v = store.contacts[id] || {}
if (!(v.name || v.subject)) v = drayyy.groupMetadata(id) || {}
resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
})
else v = id === '0@s.whatsapp.net' ? {
id,
name: 'WhatsApp'
} : id === drayyy.decodeJid(drayyy.user.id) ?
drayyy.user :
(store.contacts[id] || {})
return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')}
//=================================================//
drayyy.sendContact = async (jid, kon, quoted = '', opts = {}) => {
let list = []
for (let i of kon) {
list.push({
displayName: await drayyy.getName(i + '@s.whatsapp.net'),
vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await drayyy.getName(i + '@s.whatsapp.net')}\nFN:${await drayyy.getName(i + '@s.whatsapp.net')}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Ponsel\nitem2.EMAIL;type=INTERNET:aplusscell@gmail.com\nitem2.X-ABLabel:Email\nitem3.URL:https://chat.whatsapp.com/HbCl8qf3KQK1MEp3ZBBpSf\nitem3.X-ABLabel:Instagram\nitem4.ADR:;;Indonesia;;;;\nitem4.X-ABLabel:Region\nEND:VCARD`})}
//=================================================//
drayyy.sendMessage(jid, { contacts: { displayName: `${list.length} Kontak`, contacts: list }, ...opts }, { quoted })}
//=================================================//
//Kalau Mau Self Lu Buat Jadi false
drayyy.public = true
//=================================================//
//=================================================//
drayyy.ev.on('creds.update', saveCreds)
 //=================================================//
 drayyy.downloadMediaMessage = async (message) => {
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(message, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])}
return buffer} 
 //=================================================//
 drayyy.sendImage = async (jid, path, caption = '', quoted = '', options) => {
let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
return await drayyy.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })}
//=================================================//
drayyy.sendText = (jid, text, quoted = '', options) => drayyy.sendMessage(jid, { text: text, ...options }, { quoted })
//=================================================//
drayyy.sendTextWithMentions = async (jid, text, quoted, options = {}) => drayyy.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })
 //=================================================//
drayyy.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifImg(buff, options)
} else {
buffer = await imageToWebp(buff)}
await drayyy.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer}
 //=================================================//
drayyy.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifVid(buff, options)
} else {
buffer = await videoToWebp(buff)}
await drayyy.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer}
 //=================================================//
 drayyy.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
let quoted = message.msg ? message.msg : message
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(quoted, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])}
let type = await FileType.fromBuffer(buffer)
trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
// save to file
await fs.writeFileSync(trueFileName, buffer)
return trueFileName}
//=================================================
 drayyy.cMod = (jid, copy, text = '', sender = drayyy.user.id, options = {}) => {
//let copy = message.toJSON()
let mtype = Object.keys(copy.message)[0]
let isEphemeral = mtype === 'ephemeralMessage'
if (isEphemeral) {
mtype = Object.keys(copy.message.ephemeralMessage.message)[0]}
let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
let content = msg[mtype]
if (typeof content === 'string') msg[mtype] = text || content
else if (content.caption) content.caption = text || content.caption
else if (content.text) content.text = text || content.text
if (typeof content !== 'string') msg[mtype] = {
...content,
...options}
if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
copy.key.remoteJid = jid
copy.key.fromMe = sender === drayyy.user.id
return proto.WebMessageInfo.fromObject(copy)}
drayyy.sendFile = async(jid, PATH, fileName, quoted = {}, options = {}) => {
let types = await drayyy.getFile(PATH, true)
let { filename, size, ext, mime, data } = types
let type = '', mimetype = mime, pathFile = filename
if (options.asDocument) type = 'document'
if (options.asSticker || /webp/.test(mime)) {
let { writeExif } = require('./lib/sticker.js')
let media = { mimetype: mime, data }
pathFile = await writeExif(media, { packname: global.packname, author: global.packname2, categories: options.categories ? options.categories : [] })
await fs.promises.unlink(filename)
type = 'sticker'
mimetype = 'image/webp'}
else if (/image/.test(mime)) type = 'image'
else if (/video/.test(mime)) type = 'video'
else if (/audio/.test(mime)) type = 'audio'
else type = 'document'
await drayyy.sendMessage(jid, { [type]: { url: pathFile }, mimetype, fileName, ...options }, { quoted, ...options })
return fs.promises.unlink(pathFile)}
drayyy.parseMention = async(text) => {
return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')}
//=================================================//
drayyy.copyNForward = async (jid, message, forceForward = false, options = {}) => {
let vtype
if (options.readViewOnce) {
message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
vtype = Object.keys(message.message.viewOnceMessage.message)[0]
delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
delete message.message.viewOnceMessage.message[vtype].viewOnce
message.message = {
...message.message.viewOnceMessage.message}}
let mtype = Object.keys(message.message)[0]
let content = await generateForwardMessageContent(message, forceForward)
let ctype = Object.keys(content)[0]
let context = {}
if (mtype != "conversation") context = message.message[mtype].contextInfo
content[ctype].contextInfo = {
...context,
...content[ctype].contextInfo}
const waMessage = await generateWAMessageFromContent(jid, content, options ? {
...content[ctype],
...options,
...(options.contextInfo ? {
contextInfo: {
...content[ctype].contextInfo,
...options.contextInfo}} : {})} : {})
await drayyy.relayMessage(jid, waMessage.message, { messageId:  waMessage.key.id })
return waMessage}
//=================================================//
drayyy.getFile = async (PATH, save) => {
let res
let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
//if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
let type = await FileType.fromBuffer(data) || {
mime: 'application/octet-stream',
ext: '.bin'
}
filename = path.join(__filename, '../src/' + new Date * 1 + '.' + type.ext)
if (data && save) fs.promises.writeFile(filename, data)
return {
res,
filename,
	size: await getSizeMedia(data),
...type,
data
}
}
drayyy.serializeM = (m) => smsg(drayyy, m, store)
drayyy.ev.on("connection.update", async (update) => {
const { connection, lastDisconnect } = update;
if (connection === "close") {
  let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
  if (reason === DisconnectReason.badSession) {
console.log(`Bad Session File, Please Delete Session and Scan Again`);
process.exit();
  } else if (reason === DisconnectReason.connectionClosed) {
console.log("Connection closed, reconnecting....");
connectToWhatsApp();
  } else if (reason === DisconnectReason.connectionLost) {
console.log("Connection Lost from Server, reconnecting...");
connectToWhatsApp();
  } else if (reason === DisconnectReason.connectionReplaced) {
console.log("Connection Replaced, Another New Session Opened, Please Restart Bot");
process.exit();
  } else if (reason === DisconnectReason.loggedOut) {
console.log(`Device Logged Out, Please Delete Folder Session yusril and Scan Again.`);
process.exit();
  } else if (reason === DisconnectReason.restartRequired) {
console.log("Restart Required, Restarting...");
connectToWhatsApp();
  } else if (reason === DisconnectReason.timedOut) {
console.log("Connection TimedOut, Reconnecting...");
connectToWhatsApp();
  } else {
console.log(`Unknown DisconnectReason: ${reason}|${connection}`);
connectToWhatsApp();
  }
} else if (connection === "open") {

}
// console.log('Connected...', update)
});
return drayyy
}
connectToWhatsApp()
let file = require.resolve(__filename)
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(chalk.redBright(`Update ${__filename}`))
delete require.cache[file]
require(file)
})
