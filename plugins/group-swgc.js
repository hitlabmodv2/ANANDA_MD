import crypto from 'crypto';
import { generateWAMessageContent, generateWAMessageFromContent } from 'baileys';

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
    conversation: "txt"
}

let handler = async (m, { conn, text, args, isAdmin, isOwner }) => {
	if(!isAdmin && !isOwner) return dfail('admin', m, conn) 
    const teks = m.quoted?.text ?? ""

    if (!m.quoted) throw "❌ Tidak ada media!"

    const type = TYPE_MAP[m.quoted.mtype]
    if (!type) throw "❌ Media type tidak valid!"
    
    const doc = {}

    if (type === "txt") {
        doc.text = teks
    } else {
        const buffer = await m.quoted.download()

        if (type === "vn") {
            doc.audio = buffer
        } else if (type === "vid") {
            doc.video = buffer
            doc.caption = teks
        } else if (type === "img") {
            doc.image = buffer
            doc.caption = teks
        }

        doc.mimetype = MIME[type]
    }

    try {
    	const jid = text.endsWith("@g.us") ? text : m.chat;
        await groupStatus(jid, { ...doc, backgroundColor: getRandomHexColor() })

        conn.reply(m.chat, `Sukses upload status group`)
    } catch(e) {
        conn.reply(m.chat, `Gagal upload status group\n\n` + e.message)
    }
}

handler.help = handler.command = ["swgc"]
handler.tags = ["group"]

export default handler

function getRandomHexColor() {
    return (
        "#" +
        Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0")
    )
}

/**
 * Send WhatsApp status on group.
 * @param {string} jid Group id
 * @param {import("baileys").AnyMessageContent} content
 * @returns {Promise<import("baileys").WAMessage>}
 */
async function groupStatus(jid, content) {
  const { backgroundColor } = content;
  delete content.backgroundColor;
  const inside = await generateWAMessageContent(content, {
    upload: conn.waUploadToServer,
    backgroundColor
  });
  const messageSecret = crypto.randomBytes(32);
  const m = generateWAMessageFromContent(jid, {
    messageContextInfo: {
      messageSecret
    },
    groupStatusMessageV2: {
      message: {
        ...inside,
        messageContextInfo: {
          messageSecret
        }
      }
    }
  }, {});
  await conn.relayMessage(jid, m.message, {
    messageId: m.key.id
  });
  return m;
}