import fs from 'fs';
import { Gemini } from './gemmy-gemini.js';

const PERSONA = fs.readFileSync('./lib/Honolulu-PERSONA.txt').toString();

const triggers = {
        promote: `Kamu baru saja dijadikan admin di sebuah grup WhatsApp. Reaksi spontan kamu sebagai Honolulu — tsundere, galak di luar tapi sebenarnya ada rasa tanggung jawab di dalam. Jangan panjang. 1-3 kalimat pendek, natural, seperti orang lagi ngetik WA. Jangan pakai tanda kutip, jangan narasi, langsung ucapan kamu.`,
        demote: `Kamu baru saja dicopot dari posisi admin di sebuah grup WhatsApp. Reaksi spontan kamu sebagai Honolulu — tsundere, pura-pura ga peduli tapi tetap ada trace of dignity. Jangan panjang. 1-3 kalimat pendek, natural, seperti orang lagi ngetik WA. Jangan pakai tanda kutip, jangan narasi, langsung ucapan kamu.`,
};

export async function honoluluSpeak(event) {
        const trigger = triggers[event];
        if (!trigger) return null;

        try {
                const ai = new Gemini();
                const res = await ai.chat({
                        maxOutputTokens: 300,
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
                return typeof res === 'string' ? res.trim() : null;
        } catch (e) {
                console.error('[honoluluSpeak] error:', e.message);
                return null;
        }
}
