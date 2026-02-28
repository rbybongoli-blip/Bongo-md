import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update

        if (qr) {
            console.log("📲 Scan ce QR avec ton WhatsApp :")
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'open') {
            console.log("✅ BONGO-MD connecté avec succès !")
        }

        if (connection === 'close') {
            console.log("❌ Déconnecté... reconnexion")
            startBot()
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text
        const from = msg.key.remoteJid

        if (text === ".menu") {
            await sock.sendMessage(from, {
                text: `
╔══════════════════╗
║  BONGO-MD
╚══════════════════╝

👑 Owner: Bongo
🤖 Mode: Public
⚡ Prefix: .

📌 Commandes:
.menu
.ping
.alive
`
            })
        }

        if (text === ".ping") {
            await sock.sendMessage(from, { text: "🏓 Pong !" })
        }

        if (text === ".alive") {
            await sock.sendMessage(from, { text: "🤖 BONGO-MD est en ligne 24/24 👑🔥" })
        }
    })
}

startBot()
