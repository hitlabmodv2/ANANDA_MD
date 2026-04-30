import { dirname, join } from 'path';
import { promises } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let handler = async (m, { conn, text, usedPrefix, args, command }) => {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';

    if (!mime || (!mime.startsWith('video/') && !mime.startsWith('image/'))) 
        throw `Kirim/Balas video atau gambar dengan caption *${usedPrefix}${command}*`;

    conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } });

    const mediaBuffer = await q.download();
    
    let isVideo = mime.startsWith('video/');
    let ext = isVideo ? '.mp4' : '.jpg';
    let outputName = `low_quality${ext}`;
    
    let additionalFFmpegOptions = [];
    if (isVideo) {
        additionalFFmpegOptions = [
            '-vf', 'fps=15',
            '-s', '256x144',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '40',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            '-b:a', '0.9k',
            '-ar', '8000',
            '-ac', '1'
        ];
    } else {
        additionalFFmpegOptions = [
            '-vf', 'scale=144:-1', 
            '-q:v', '51' 
        ];
    }

    try {
        const outputBuffer = await mediaConvert(mediaBuffer, additionalFFmpegOptions, ext);
        await m.react("");
        await conn.sendFile(m.chat, outputBuffer, outputName, `${isVideo ? 'Video' : 'Gambar'} berhasil diubah ke kualitas rendah!`, m);
    } catch (e) {
        await m.react("❌");
        m.reply(`Gagal nge-convert ${isVideo ? 'video' : 'gambar'}`);
    }
};

handler.help = ['lowq *<video/image>*'];
handler.tags = ['tools'];
handler.command = /^(lowq|lowquality|lowvid|lowimg)$/i;

export default handler;

async function mediaConvert(buffer, input = [], ext = '.mp4') {
    return new Promise(async (resolve, reject) => {
        try {
            const tmp = join(__dirname, '../tmp', `${+new Date()}${ext}`);
            await promises.writeFile(tmp, buffer);
            const out = tmp.replace(ext, `_converted${ext}`);
            const args = [
                '-y',
                '-i', tmp,
                ...input,
                out
            ];

            const process = spawn('ffmpeg', args);
            process.on('error', reject);
            process.on('close', async (code) => {
                try {
                    await promises.unlink(tmp).catch(() => {});
                    if (code !== 0) return reject(new Error('FFmpeg process failed'));
                    const outputBuffer = await promises.readFile(out);
                    await promises.unlink(out).catch(() => {});
                    resolve(outputBuffer);
                } catch (err) {
                    reject(err);
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}