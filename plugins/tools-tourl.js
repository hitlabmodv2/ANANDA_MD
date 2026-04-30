import { ornzora } from '../lib/uploader.js';
import { fileTypeFromBuffer } from 'file-type';

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

let handler = async (m, { conn, text }) => {
    try {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        if (!mime) throw 'Berikan Media Yang Ingin Diupload';
        
        let buff = await q.download();
        let fileSizeLimit = 190 * 1024 * 1024; // 50MB
        let isTele = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime)
        if (buff.length > fileSizeLimit) {
            throw `Maximal Upload adalah ${formatFileSize(fileSizeLimit)}.`;
        }
        
        const { ext } = await fileTypeFromBuffer(buff);
        let link = (await ornzora(buff, "FIORA."+ext)).url
        let formattedSize = formatFileSize(buff.length);
        
        new Button()
        .setBody(`
📁 | URL : ${link}
💾 | Size : ${formattedSize}
📛 | Expired : Never
        `)
        .addCopy("Copy", link) 
        .run(m.chat, conn, m) 
    } catch (error) {
        m.reply(`Error: ${error}`);
    }
};

handler.help = ['tourl <reply image>'];
handler.tags = ['tools'];
handler.command = /^(upload|tourl)$/i;

export default handler;