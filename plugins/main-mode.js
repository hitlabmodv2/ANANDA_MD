let handler = async (m, { conn, usedPrefix, command, args, isOwner }) => {
        if (!isOwner) return global.dfail('owner', m, conn);

        const settings = global.db.data.settings[conn.user.jid];
        const type = (args[0] || '').toLowerCase();

        const getCurrentMode = (s) =>
                !s.public ? 'self' : s.gconly ? 'gc' : s.pconly ? 'pc' : 'public';

        const modeInfo = {
                public: { label: '🌐 PUBLIC', desc: 'Semua orang — private & grup' },
                self:   { label: '🔒 SELF',   desc: 'Owner saja — private & grup' },
                gc:     { label: '👥 GROUP',  desc: 'Semua orang — grup saja' },
                pc:     { label: '💬 PRIVATE', desc: 'Semua orang — private saja' },
        };

        const prevMode = getCurrentMode(settings);

        switch (type) {
                case 'all':
                case 'public': {
                        if (prevMode === 'public') return m.reply(`⚠️ Mode *PUBLIC* sudah aktif sebelumnya.`);
                        settings.public = true;
                        settings.gconly = false;
                        settings.pconly = false;
                        m.reply(
                                `✅ Mode berhasil diubah!\n\n` +
                                `▸ Sebelumnya : ${modeInfo[prevMode].label}\n` +
                                `▸ Sekarang   : ${modeInfo['public'].label}\n\n` +
                                `- Siapa: semua orang\n` +
                                `- Tempat: private chat & grup`
                        );
                        break;
                }

                case 'self': {
                        if (prevMode === 'self') return m.reply(`⚠️ Mode *SELF* sudah aktif sebelumnya.`);
                        settings.public = false;
                        settings.gconly = false;
                        settings.pconly = false;
                        m.reply(
                                `✅ Mode berhasil diubah!\n\n` +
                                `▸ Sebelumnya : ${modeInfo[prevMode].label}\n` +
                                `▸ Sekarang   : ${modeInfo['self'].label}\n\n` +
                                `- Siapa: owner saja\n` +
                                `- Tempat: private chat & grup`
                        );
                        break;
                }

                case 'group':
                case 'gc': {
                        if (prevMode === 'gc') return m.reply(`⚠️ Mode *GROUP (GC)* sudah aktif sebelumnya.`);
                        settings.public = true;
                        settings.gconly = true;
                        settings.pconly = false;
                        m.reply(
                                `✅ Mode berhasil diubah!\n\n` +
                                `▸ Sebelumnya : ${modeInfo[prevMode].label}\n` +
                                `▸ Sekarang   : ${modeInfo['gc'].label}\n\n` +
                                `- Siapa: semua orang\n` +
                                `- Tempat: grup saja (private diabaikan)`
                        );
                        break;
                }

                case 'private':
                case 'pc': {
                        if (prevMode === 'pc') return m.reply(`⚠️ Mode *PRIVATE (PC)* sudah aktif sebelumnya.`);
                        settings.public = true;
                        settings.gconly = false;
                        settings.pconly = true;
                        m.reply(
                                `✅ Mode berhasil diubah!\n\n` +
                                `▸ Sebelumnya : ${modeInfo[prevMode].label}\n` +
                                `▸ Sekarang   : ${modeInfo['pc'].label}\n\n` +
                                `- Siapa: semua orang\n` +
                                `- Tempat: private saja (grup diabaikan)`
                        );
                        break;
                }

                case 'status':
                case 'info':
                case '':
                default: {
                        const cur = modeInfo[prevMode];
                        m.reply(
                                `*Mode Bot Saat Ini:* ${cur.label}\n` +
                                `*Keterangan:* ${cur.desc}\n\n` +
                                `*Pilihan mode:*\n` +
                                `- ${usedPrefix}mode public → semua orang, private & grup\n` +
                                `- ${usedPrefix}mode self   → owner saja, private & grup\n` +
                                `- ${usedPrefix}mode gc     → semua orang, grup saja\n` +
                                `- ${usedPrefix}mode pc     → semua orang, private saja\n` +
                                `- ${usedPrefix}mode status → cek mode sekarang`
                        );
                        break;
                }
        }
};

handler.help = ['mode <public|self|gc|pc|status>'];
handler.tags = ['main'];
handler.command = /^mode$/i;

export default handler;
