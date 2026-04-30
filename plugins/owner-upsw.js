import { catbox } from "../lib/uploader.js"

const MIME = {
    vn: "audio/mpeg",
    vid: "video/mp4",
    img: "image/jpeg",
}

const TYPE_MAP = {
    audioMessage: "vn",
    videoMessage: "vid",
    imageMessage: "img",
    extendedTextMessage: "txt",
}

let handler = async (m, { conn, args }) => {
    const teks =
        args.join(" ") ||
        (m.quoted?.text ?? "")

    if (!m.quoted) throw "❌ Tidak ada media!"

    const type = TYPE_MAP[m.quoted.mtype]
    if (!type) throw "❌ Media type tidak valid!"

    const doc = {}

    if (type === "txt") {
        doc.text = teks
    } else {
        const buffer = await m.quoted.download()
        const url = await catbox(buffer)

        if (!url) throw "❌ Upload gagal!"

        if (type === "vn") {
            doc.audio = { url }
        } else if (type === "vid") {
            doc.video = { url }
            doc.caption = teks
        } else if (type === "img") {
            doc.image = { url }
            doc.caption = teks
        }

        doc.mimetype = MIME[type]
    }

    try {
        await conn.sendMessage("status@broadcast", doc, {
            backgroundColor: getRandomHexColor(),
            font: Math.floor(Math.random() * 9),
            statusJidList: Object.keys(global.db.data.users),
        })

        conn.reply(m.chat, `Sukses upload ${type}`)
    } catch {
        conn.reply(m.chat, `Gagal upload ${type}`)
    }
}

handler.help = handler.command = ["upsw"]
handler.tags = ["owner"]
handler.owner = true
handler.rowner = true

export default handler

function getRandomHexColor() {
    return (
        "#" +
        Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0")
    )
}