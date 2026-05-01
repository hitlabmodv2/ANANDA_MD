let handler = async (m, { conn, usedPrefix, command, args, isOwner }) => {
        if (!isOwner) return global.dfail('owner', m, conn);

        const settings = global.db.data.settings[conn.user.jid];
        const type = (args[0] || '').toLowerCase();

        const getCurrentMode = (s) =>
                !s.public ? 'self' : s.gconly ? 'gc' : s.pconly ? 'pc' : 'public';

        const modeInfo = {
                public: { label: '🌐 PUBLIC',  desc: 'Semua orang, private & grup aktif' },
                self:   { label: '🔒 SELF',    desc: 'Owner saja, private & grup aktif' },
                gc:     { label: '👥 GROUP',   desc: 'Semua orang, khusus grup saja' },
                pc:     { label: '💬 PRIVATE', desc: 'Semua orang, khusus private saja' },
        };

        const buildStatusPanel = (activeMode) => {
                const lines = Object.entries(modeInfo).map(([key, info]) => {
                        const isActive = key === activeMode;
                        return `${isActive ? '✅' : '☑️'} ${info.label} ${isActive ? '*(aktif)*' : ''}\n   └ ${info.desc}`;
                });
                return (
                        `╔══ 𝙼𝙾𝙳𝙴 𝙱𝙾𝚃 ══╗\n\n` +
                        lines.join('\n\n') +
                        `\n\n╚══════════════╝\n\n` +
                        `*Command:*\n` +
                        `- ${usedPrefix}mode public → aktifkan PUBLIC\n` +
                        `- ${usedPrefix}mode self   → aktifkan SELF\n` +
                        `- ${usedPrefix}mode gc     → aktifkan GROUP\n` +
                        `- ${usedPrefix}mode pc     → aktifkan PRIVATE\n` +
                        `- ${usedPrefix}mode status → cek mode sekarang`
                );
        };

        const prevMode = getCurrentMode(settings);

        switch (type) {
                case 'all':
                case 'public': {
                        const alreadyActive = prevMode === 'public';
                        if (!alreadyActive) {
                                settings.public = true;
                                settings.gconly = false;
                                settings.pconly = false;
                        }
                        m.reply(
                                (alreadyActive
                                        ? `ℹ️ Mode *PUBLIC* sudah aktif sebelumnya, tidak ada perubahan.\n\n`
                                        : `✅ Mode berhasil diubah!\n▸ Sebelumnya : ${modeInfo[prevMode].label}\n▸ Sekarang   : ${modeInfo['public'].label}\n\n`) +
                                buildStatusPanel('public')
                        );
                        break;
                }

                case 'self': {
                        const alreadyActive = prevMode === 'self';
                        if (!alreadyActive) {
                                settings.public = false;
                                settings.gconly = false;
                                settings.pconly = false;
                        }
                        m.reply(
                                (alreadyActive
                                        ? `ℹ️ Mode *SELF* sudah aktif sebelumnya, tidak ada perubahan.\n\n`
                                        : `✅ Mode berhasil diubah!\n▸ Sebelumnya : ${modeInfo[prevMode].label}\n▸ Sekarang   : ${modeInfo['self'].label}\n\n`) +
                                buildStatusPanel('self')
                        );
                        break;
                }

                case 'group':
                case 'gc': {
                        const alreadyActive = prevMode === 'gc';
                        if (!alreadyActive) {
                                settings.public = true;
                                settings.gconly = true;
                                settings.pconly = false;
                        }
                        m.reply(
                                (alreadyActive
                                        ? `ℹ️ Mode *GROUP (GC)* sudah aktif sebelumnya, tidak ada perubahan.\n\n`
                                        : `✅ Mode berhasil diubah!\n▸ Sebelumnya : ${modeInfo[prevMode].label}\n▸ Sekarang   : ${modeInfo['gc'].label}\n\n`) +
                                buildStatusPanel('gc')
                        );
                        break;
                }

                case 'private':
                case 'pc': {
                        const alreadyActive = prevMode === 'pc';
                        if (!alreadyActive) {
                                settings.public = true;
                                settings.gconly = false;
                                settings.pconly = true;
                        }
                        m.reply(
                                (alreadyActive
                                        ? `ℹ️ Mode *PRIVATE (PC)* sudah aktif sebelumnya, tidak ada perubahan.\n\n`
                                        : `✅ Mode berhasil diubah!\n▸ Sebelumnya : ${modeInfo[prevMode].label}\n▸ Sekarang   : ${modeInfo['pc'].label}\n\n`) +
                                buildStatusPanel('pc')
                        );
                        break;
                }

                case 'status':
                case 'info':
                case '':
                default: {
                        m.reply(buildStatusPanel(prevMode));
                        break;
                }
        }
};

handler.help = ['mode <public|self|gc|pc|status>'];
handler.tags = ['main'];
handler.command = /^mode$/i;

export default handler;
