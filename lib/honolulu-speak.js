import fs from 'fs';
import axios from 'axios';
import { Gemini } from './gemmy-gemini.js';

const PERSONA = fs.readFileSync('./lib/Honolulu-PERSONA.txt').toString();

const STICKERS = {
        promote: [
                { n: 3,  name: "datar / blank stare",   url: "https://cdn.ornzora.eu.cc/91b84f91-7d92-4850-a743-c0554439861d-FIORA.webp" },
                { n: 5,  name: "smug / puas dikit",      url: "https://cdn.ornzora.eu.cc/e1ab519c-7a03-4246-8cd9-2cfd623247b8-FIORA.webp" },
                { n: 6,  name: "mikir / skeptis",        url: "https://cdn.ornzora.eu.cc/5baac1a3-ca2b-4749-a08c-5eabfd418e79-FIORA.webp" },
        ],
        demote: [
                { n: 11, name: "ngamuk lucu",            url: "https://cdn.ornzora.eu.cc/6f805809-c16a-4521-bfdf-92ca7d20c6b4-FIORA.webp" },
                { n: 12, name: "kesel lucu",             url: "https://cdn.ornzora.eu.cc/997a0eb7-090a-404f-9b47-fa84f136705c-FIORA.webp" },
                { n: 13, name: "datar / males respon",   url: "https://cdn.ornzora.eu.cc/57a1045e-48bb-4535-bece-d7bf5e750943-FIORA.webp" },
        ],
};

const TRIGGERS = {
        promote: `Kamu (Honolulu) baru saja dijadikan admin di sebuah grup WhatsApp.
Balas dengan reaksi spontan sebagai Honolulu yang tsundere.
Aturan WAJIB:
- Hanya tulis ucapan/dialog langsung, TANPA narasi, TANPA stage direction seperti *(ngelihat...)* atau *(cemberut)*
- Maksimal 2-3 kalimat pendek
- Gaya huruf kecil, santai, seperti orang ngetik WA
- Tsundere: galak di luar, tapi ada trace tanggung jawab`,

        demote: `Kamu (Honolulu) baru saja dicopot dari posisi admin di sebuah grup WhatsApp.
Balas dengan reaksi spontan sebagai Honolulu yang tsundere.
Aturan WAJIB:
- Hanya tulis ucapan/dialog langsung, TANPA narasi, TANPA stage direction seperti *(lihat notif...)* atau *(cemberut)*
- Maksimal 2-3 kalimat pendek
- Gaya huruf kecil, santai, seperti orang ngetik WA
- Tsundere: pura-pura ga peduli, tapi tetap ada dignity`,
};

function cleanResponse(text) {
        if (!text) return null;
        return text
                .replace(/\*[^*]+\*/g, '')
                .replace(/\([^)]+\)/g, '')
                .replace(/\[[^\]]+\]/g, '')
                .replace(/_{2,}/g, '')
                .replace(/\n{3,}/g, '\n')
                .trim();
}

export async function honoluluSpeak(event, conn, groupId) {
        const trigger = TRIGGERS[event];
        if (!trigger) return;

        try {
                const ai = new Gemini();
                const res = await ai.chat({
                        maxOutputTokens: 200,
                        contents: [
                                {
                                        role: 'system',
                                        parts: [{ text: `[SYSTEM PROMPT]\n${PERSONA}` }],
                                },
                                {
                                        role: 'user',
                                        parts: [{ text: trigger }],
                                },
                        ],
                });

                const text = cleanResponse(typeof res === 'string' ? res : null);
                if (text) await conn.sendMessage(groupId, { text });

                const withSticker = Math.random() < 0.6;
                if (withSticker) {
                        const pool = STICKERS[event] || [];
                        const picked = pool[Math.floor(Math.random() * pool.length)];
                        if (picked) {
                                try {
                                        const { data } = await axios.get(picked.url, { responseType: 'arraybuffer' });
                                        const sticker = Buffer.from(data);
                                        await conn.sendMessage(groupId, { sticker });
                                } catch (e) {
                                        console.error('[honoluluSpeak] sticker error:', e.message);
                                }
                        }
                }
        } catch (e) {
                console.error('[honoluluSpeak] error:', e.message);
                const fallback = event === 'promote'
                        ? `hm. aku admin sekarang.\nya udah, aku pegang. jangan bikin repot.`
                        : `di-non-adminkan?\nya terserah. aku tetap di sini kok.`;
                await conn.sendMessage(groupId, { text: fallback }).catch(() => {});
        }
}
