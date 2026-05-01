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
                                `- Bot respon ke semua orang\n` +
                                `- Private chat & Grup aktif`
                        );
                        break;

                case 'self':
                        settings.public = false;
                        settings.gconly = false;
                        settings.pconly = false;
                        m.reply(
                                `✅ *Mode SELF* aktif\n\n` +
                                `- Bot hanya respon ke owner\n` +
                                `- Private chat & Grup aktif`
                        );
                        break;

                case 'group':
                case 'gc':
                        settings.public = true;
                        settings.gconly = true;
                        settings.pconly = false;
                        m.reply(
                                `✅ *Mode GROUP* aktif\n\n` +
                                `- Bot respon ke semua orang\n` +
                                `- Khusus Grup saja (private diabaikan)`
                        );
                        break;

                case 'private':
                case 'pc':
                        settings.public = true;
                        settings.gconly = false;
                        settings.pconly = true;
                        m.reply(
                                `✅ *Mode PRIVATE* aktif\n\n` +
                                `- Bot respon ke semua orang\n` +
                                `- Khusus Private saja (grup diabaikan)`
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
                        m.reply(
                                `*Mode Bot Saat Ini:* ${modeLabel}\n\n` +
                                `*Pilihan mode:*\n` +
                                `- ${usedPrefix}mode all     → semua orang, private + grup\n` +
                                `- ${usedPrefix}mode self    → owner only, private + grup\n` +
                                `- ${usedPrefix}mode gc      → semua orang, grup saja\n` +
                                `- ${usedPrefix}mode pc      → semua orang, private saja\n` +
                                `- ${usedPrefix}mode status  → cek mode sekarang`
                        );
                        break;
        }
};

handler.help = ['mode <all|self|gc|pc|status>'];
handler.tags = ['main'];
handler.command = /^mode$/i;

export default handler;
