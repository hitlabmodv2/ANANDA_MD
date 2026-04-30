import axios from 'axios'
import FormData from 'form-data'
import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'

const TMP_DIR = './tmp'

function ensureTmp() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR)
}

export default async function handler(m, conn) {
  ensureTmp()

  if (!global.db.data.chats[m.chat]?.antiporn) return false
  if (!/imageMessage|stickerMessage|videoMessage/i.test(m.mtype)) return false

  let buffer = await m.download()

  if (/stickerMessage/i.test(m.mtype)) {
    if (m.message?.stickerMessage?.isAnimated) {
      return await processVideo(buffer, m, conn, true)
    } else {
      buffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer()
      return await processImage(buffer, m, conn)
    }
  }

  if (/imageMessage/i.test(m.mtype)) {
    return await processImage(buffer, m, conn)
  }

  if (/videoMessage/i.test(m.mtype)) {
    return await processVideo(buffer, m, conn, false)
  }

  return false
}

async function processImage(buffer, m, conn) {
  const result = await checkNSFW(buffer)
  if (result?.labelName === 'Porn') {
    await new Button() 
      .setBody(`Terdeteksi @${m.sender.split("@")[0]} mengirim konten 4no.`) 
      .addReply('Validate Content', '.antipornvalidatecontent') 
      .setParams({
      	limited_time_offer: {
      text: global.namebot,
      url: "ANTI P*RN"
    }, 
	    content: m
    }) 
    .setContextInfo({ mentionedJid: [m.sender] }) 
    .run(m.chat, conn) 
    await m.delete()
    return true
  }
  return false
}

async function processVideo(buffer, m, conn, isGif = false) {
  ensureTmp()

  const id = Date.now()
  const tempInput = path.join(TMP_DIR, `input_${id}.${isGif ? 'webp' : 'mp4'}`)
  const outputDir = path.join(TMP_DIR, `frames_${id}`)

  fs.writeFileSync(tempInput, buffer)
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

  const duration = await getVideoDuration(tempInput)
  const maxFrames = 10
  const safeDuration = duration > 0 ? duration : 5
  const interval = safeDuration / maxFrames
  const scale = (Math.random() * (0.8 - 0.6) + 0.6).toFixed(2)

  await new Promise((resolve, reject) => {
    ffmpeg(tempInput)
      .output(path.join(outputDir, 'frame-%03d.jpg'))
      .outputOptions([
        `-vf fps=1/${interval},scale=iw*${scale}:ih*${scale}`
      ])
      .on('end', resolve)
      .on('error', reject)
      .run()
  })

  const frames = fs.readdirSync(outputDir)

  for (const file of frames) {
    const frameBuffer = fs.readFileSync(path.join(outputDir, file))
    const result = await checkNSFW(frameBuffer)

    if (result?.labelName === 'Porn') {
      /**await conn.sendMessage(m.chat, {
        text: `Terdeteksi @${m.sender.split("@")[0]} mengirim ${isGif ? 'sticker animasi' : 'video'} 4no.`,
        mentions: [m.sender]
      })**/
      await new Button() 
      .setBody(`Terdeteksi @${m.sender.split("@")[0]} mengirim ${isGif ? 'sticker animasi' : 'video'} 4no.`) 
      .addReply('Validate Content', '.antipornvalidatecontent') 
      .setParams({
      	limited_time_offer: {
      text: global.namebot,
      url: "ANTI P*RN"
    }, 
	    content: m
    }) 
    .setContextInfo({ mentionedJid: [m.sender] }) 
    .run(m.chat, conn) 
      await m.delete()
      cleanup(tempInput, outputDir)
      return true
    }
  }

  cleanup(tempInput, outputDir)
  return false
}

function cleanup(input, dir) {
  if (fs.existsSync(input)) fs.unlinkSync(input)
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(f => fs.unlinkSync(path.join(dir, f)))
    fs.rmdirSync(dir)
  }
}

function getVideoDuration(file) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(file, (err, metadata) => {
      if (err) return resolve(0)
      resolve(metadata.format.duration || 0)
    })
  })
}

async function checkNSFW(image) {
  if (!Buffer.isBuffer(image)) throw new Error('Image must be a buffer.')

  const form = new FormData()
  form.append('file', image, `${Date.now()}.jpg`)

  const { data } = await axios.post(
    'https://www.nyckel.com/v1/functions/o2f0jzcdyut2qxhu/invoke',
    form,
    { headers: form.getHeaders() }
  )

  return data
}