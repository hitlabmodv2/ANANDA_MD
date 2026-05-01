import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';

let handler = async (m, { conn, text }) => {
        if (!text) return m.reply(
                '📎 Kirim URL gambar/webp setelah command.\n\n' +
                'Contoh:\n' +
                '.surl https://cdn.ornzora.eu.cc/502784e6-108d-49d7-a981-04083d14ad9a-FIORA.webp'
        );

        const urlRegex = /https?:\/\/[^\s]+/i;
        const urlMatch = text.match(urlRegex);

        if (!urlMatch) return m.reply('❌ URL tidak valid. Pastikan dimulai dengan https://');

        const url = urlMatch[0];

        let buf;
        try {
                const res = await axios.get(url, {
                        responseType: 'arraybuffer',
                        timeout: 15000,
                        headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                });
                buf = Buffer.from(res.data);
        } catch (e) {
                const status = e.response?.status;
                if (status === 403) return m.reply('❌ URL diblokir (403 Forbidden). Coba URL lain.');
                if (status === 404) return m.reply('❌ URL tidak ditemukan (404).');
                return m.reply(`❌ Gagal download.\nError: ${e.message}`);
        }

        const type = await fileTypeFromBuffer(buf);
        const mime = type?.mime || '';

        if (!/image|webp/.test(mime)) {
                return m.reply(`❌ File bukan gambar/webp.\nTerdeteksi: ${mime || 'unknown'}`);
        }

        const exif = {
                packName: global.stickpack || '',
                packPublish: global.stickauth || ''
        };

        await conn.sendSticker(m.chat, buf, m, exif);
};

handler.help = ['surl <url>'];
handler.tags = ['sticker'];
handler.command = /^surl$/i;
handler.register = true;

export default handler;
