let handler = async (m, { conn, usedPrefix, command, args, isOwner }) => {
        if (!isOwner) return global.dfail('owner', m, conn);

        const settings = global.db.data.settings[conn.user.jid];
        const type = (args[0] || '').toLowerCase();

        switch (type) {
                case 'all':
                case 'public':
                        settings.public = true;
                        settings.gconly = false;
                        settings.pconly = false;
                        m.reply(
                                `✅ *Mode PUBLIC* aktif\n\n` +
                                `- Siapa: semua orang\n` +
                                `- Tempat: private chat & grup`
                        );
                        break;

                case 'self':
                        settings.public = false;
                        settings.gconly = false;
                        settings.pconly = false;
                        m.reply(
                                `✅ *Mode SELF* aktif\n\n` +
                                `- Siapa: owner saja\n` +
                                `- Tempat: private chat & grup`
                        );
                        break;

                case 'group':
                case 'gc':
                        settings.public = true;
                        settings.gconly = true;
                        settings.pconly = false;
                        m.reply(
                                `✅ *Mode GROUP* aktif\n\n` +
                                `- Siapa: semua orang\n` +
                                `- Tempat: grup saja (private diabaikan)`
                        );
                        break;

                case 'private':
                case 'pc':
                        settings.public = true;
                        settings.gconly = false;
                        settings.pconly = true;
                        m.reply(
                                `✅ *Mode PRIVATE* aktif\n\n` +
                                `- Siapa: semua orang\n` +
                                `- Tempat: private saja (grup diabaikan)`
                        );
                        break;

                case 'status':
                case 'info':
                case '':
                default:
                        const modeLabel = !settings.public
                                ? '🔒 SELF'
                                : settings.gconly
                                        ? '👥 GROUP'
                                        : settings.pconly
                                                ? '💬 PRIVATE'
                                                : '🌐 PUBLIC';

                        const modeDesc = !settings.public
                                ? 'Owner saja — bisa di private & grup'
                                : settings.gconly
                                        ? 'Semua orang — khusus grup saja, private diabaikan'
                                        : settings.pconly
                                                ? 'Semua orang — khusus private saja, grup diabaikan'
                                                : 'Semua orang — private & grup aktif';

                        m.reply(
                                `*Mode Bot Saat Ini:* ${modeLabel}\n` +
                                `*Keterangan:* ${modeDesc}\n\n` +
                                `*Pilihan mode:*\n` +
                                `- ${usedPrefix}mode public → semua orang, private & grup\n` +
                                `- ${usedPrefix}mode self   → owner saja, private & grup\n` +
                                `- ${usedPrefix}mode gc     → semua orang, grup saja\n` +
                                `- ${usedPrefix}mode pc     → semua orang, private saja\n` +
                                `- ${usedPrefix}mode status → cek mode sekarang`
                        );
                        break;
        }
};

handler.help = ['mode <public|self|gc|pc|status>'];
handler.tags = ['main'];
handler.command = /^mode$/i;

export default handler;
