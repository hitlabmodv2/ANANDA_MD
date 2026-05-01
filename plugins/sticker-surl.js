import axios from 'axios';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';

let handler = async (m, { conn, text }) => {
        const urlRegex = /https?:\/\/[^\s]+/i;
        const urlMatch = text && text.match(urlRegex);

        // Capture m.quoted SEKALI saja — ini getter, setiap akses bisa beda nilainya
        const q = m.quoted;

        // Mode 1: reply ke sticker → upload ke CDN → balas URL webp-nya
        if (q && q.mtype === 'stickerMessage') {
                await m.reply('⏳ Mengambil URL stiker...');

                let media;
                try {
                        if (typeof q.download === 'function') {
                                media = await q.download();
                        } else {
                                const stickerData = q.msg || q;
                                media = await conn.downloadM(stickerData, 'sticker');
                        }
                } catch (e) {
                        return m.reply(`❌ Gagal download stiker.\nError: ${e.message}`);
                }

                if (!media || media.length === 0) return m.reply('❌ Gagal membaca data stiker, coba lagi.');

                const type = await fileTypeFromBuffer(media);
                const ext = type?.ext || 'webp';
                const filename = `HONOLULU.${ext}`;

                const form = new FormData();
                form.append('file', media, { filename });

                let uploadRes;
                try {
                        const res = await axios.post('https://cdn.ornzora.eu.cc/upload', form, {
                                headers: { ...form.getHeaders() },
                                timeout: 20000
                        });
                        uploadRes = res.data;
                } catch (e) {
                        return m.reply(`❌ Gagal upload ke CDN.\nError: ${e.message}`);
                }

                if (!uploadRes?.success || !uploadRes?.url) {
                        return m.reply('❌ Upload gagal, CDN tidak mengembalikan URL.');
                }

                await m.reply(`🔗 *URL Stiker:*\n${uploadRes.url}`);

        // Mode 2: .surl <url> → download URL → kirim sebagai stiker
        } else if (urlMatch) {
                const url = urlMatch[0];
                let buf;

                try {
                        const res = await axios.get(url, {
                                responseType: 'arraybuffer',
                                timeout: 15000,
                                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                        });
                        buf = Buffer.from(res.data);
                } catch (e) {
                        const status = e.response?.status;
                        if (status === 403) return m.reply('❌ URL diblokir (403 Forbidden).');
                        if (status === 404) return m.reply('❌ URL tidak ditemukan (404).');
                        return m.reply(`❌ Gagal download.\nError: ${e.message}`);
                }

                const type = await fileTypeFromBuffer(buf);
                const mime = type?.mime || '';
                if (!/image|webp/.test(mime)) {
                        return m.reply(`❌ File bukan gambar/webp.\nTerdeteksi: ${mime || 'unknown'}`);
                }

                const exif = { packName: global.stickpack || '', packPublish: global.stickauth || '' };
                await conn.sendSticker(m.chat, buf, m, exif);

        } else {
                m.reply(
                        '📎 *Cara pakai .surl:*\n\n' +
                        '1️⃣ Reply ke stiker → bot balas URL webp-nya\n' +
                        '2️⃣ .surl <url> → download URL lalu kirim sebagai stiker\n\n' +
                        'Contoh:\n' +
                        '.surl https://cdn.ornzora.eu.cc/502784e6-108d-49d7-a981-04083d14ad9a-FIORA.webp'
                );
        }
};

handler.help = ['surl', 'surl <url>'];
handler.tags = ['sticker'];
handler.command = /^surl$/i;
handler.register = true;

export default handler;
