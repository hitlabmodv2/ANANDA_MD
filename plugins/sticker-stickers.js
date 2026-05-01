import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';

let handler = async (m, { conn, text }) => {
        const urlRegex = /https?:\/\/[^\s]+/i;
        const urlMatch = text && text.match(urlRegex);

        if (urlMatch) {
                const url = urlMatch[0];
                let buf, mime;

                try {
                        const res = await axios.get(url, {
                                responseType: 'arraybuffer',
                                timeout: 15000,
                                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                        });
                        buf = Buffer.from(res.data);
                } catch (e) {
                        return m.reply(`❌ Gagal download URL.\nError: ${e.message}`);
                }

                const type = await fileTypeFromBuffer(buf);
                mime = type?.mime || '';

                if (!/image|webp|video/.test(mime)) {
                        return m.reply(`❌ URL bukan gambar/webp yang valid.\nTerdeteksi: ${mime || 'unknown'}`);
                }

                let exif = { packName: global.stickpack || '', packPublish: global.stickauth || '' };
                await conn.sendSticker(m.chat, buf, m, exif);

        } else {
                let q = m.quoted ? m.quoted : m;
                let mime = (q.msg || q).mimetype || '';

                if (/image|video|webp/.test(mime)) {
                        if ((q.msg?.seconds || q.seconds) > 10) {
                                return m.reply('Video harus berdurasi di bawah 10 detik.');
                        }

                        let media = await q.download();
                        let exif;
                        if (text) {
                                const [packname, author] = text.split(/[,|\-+&]/);
                                exif = { packName: packname || '', packPublish: author || '' };
                        }
                        conn.sendSticker(m.chat, media, m, exif);
                } else {
                        m.reply('Kirim atau reply media untuk dijadikan stiker.\nAtau ketik: .s <url_gambar>');
                }
        }
};

handler.help = ['sticker', 'sticker <url>'];
handler.tags = ['sticker'];
handler.command = /^s(tic?ker)?(gif)?$/i;
handler.register = true;

export default handler;
