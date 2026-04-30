import { promises } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

async function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
        const tmp = join(global.__dirname(import.meta.url), '../tmp', Date.now() + '.' + ext);
        const out = tmp + '.' + ext2;
        try {
                if (!buffer || !buffer.length) throw new Error('FFmpeg input buffer is empty');

                await promises.writeFile(tmp, buffer);

                await new Promise((resolve, reject) => {
                        const proc = spawn('ffmpeg', ['-y', '-i', tmp, ...args, out]);
                        let stderr = '';
                        proc.stderr.on('data', (chunk) => {
                                stderr += chunk.toString();
                        });
                        proc.on('error', reject);
                        proc.on('close', (code) => {
                                if (code !== 0) {
                                        const tail = stderr.split('\n').filter(Boolean).slice(-3).join(' | ');
                                        reject(new Error(`FFmpeg exited with code ${code}: ${tail || 'no stderr'}`));
                                } else resolve();
                        });
                });

                const data = await promises.readFile(out);

                return {
                        data,
                        filename: out,
                        delete() {
                                return promises.unlink(out);
                        },
                };
        } finally {
                try {
                        await promises.unlink(tmp);
                } catch {}
        }
}

/**
 * Convert Audio to Playable WhatsApp Audio
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension
 * @returns {Promise<{data: Buffer, filename: String, delete: Function}>}
 */
function toPTT(buffer, ext) {
        return ffmpeg(buffer, ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on'], ext, 'ogg');
}

/**
 * Convert Audio to Playable WhatsApp PTT
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension
 * @returns {Promise<{data: Buffer, filename: String, delete: Function}>}
 */
function toAudio(buffer, ext) {
        return ffmpeg(buffer, ['-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k', '-f', 'mp3'], ext, 'opus');
}

/**
 * Convert Audio to Playable WhatsApp Video
 * @param {Buffer} buffer Video Buffer
 * @param {String} ext File Extension
 * @returns {Promise<{data: Buffer, filename: String, delete: Function}>}
 */
function toVideo(buffer, ext) {
        return ffmpeg(buffer, ['-c:v', 'libx264', '-c:a', 'aac', '-ab', '128k', '-ar', '44100', '-crf', '32', '-preset', 'slow'], ext, 'mp4');
}

export { toAudio, toPTT, toVideo, ffmpeg };
