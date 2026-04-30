const SPEAKERS = {
  1:  'Shikoku Metan (Amaama) — anime girl manis',
  2:  'Shikoku Metan (Normal)',
  3:  'Zundamon (Normal)',
  4:  'Zundamon (Amaama)',
  5:  'Zundamon (Tsuntsun)',
  6:  'Zundamon (Sexy)',
  8:  'Kasukabe Tsumugi (Normal) — energetic',
  9:  'Namine Ritsu (Normal)',
  10: 'Ryusei Aoi (Normal) — tomboy',
  11: 'Genryuu Saya (Normal)',
  14: 'Hau (Normal) — anak kecil',
  16: 'Sayo (Normal) — calm anime girl (default)',
  20: 'Mochiko-san',
  21: 'Kenzaki Mahiro',
  23: 'Whitecul (Normal)',
  27: 'No.7 (Normal)',
  29: 'Chibi-shikiji',
  42: 'Aonuma Manatsu',
  43: 'Momose Sasara',
};

let handler = async (m, { conn, command, text, args }) => {
  const sender = m.sender;
  if (!global.db.data.msgs[sender]) global.db.data.msgs[sender] = {};

  const sub = (args[0] || '').toLowerCase();

  if (!text || sub === 'list' || sub === 'ls') {
    const cur = global.db.data.msgs[sender].voicevox;
    let out = '🎤 *Daftar Suara Anime VoiceVox*\n\n';
    for (const [id, name] of Object.entries(SPEAKERS)) {
      const mark = (+cur === +id) ? '✅ ' : '   ';
      out += `${mark}\`${String(id).padStart(2)}\` — ${name}\n`;
    }
    out += `\nPilih dengan: *${command} <id>*  (mis. *${command} 8*)`;
    out += `\nReset ke default: *${command} reset*`;
    out += `\nSekarang: *${cur != null ? `${cur} — ${SPEAKERS[cur] || 'custom'}` : 'belum dipilih (pakai default 16 — Sayo, calm anime girl)'}*`;
    return m.reply(out);
  }

  if (sub === 'reset' || sub === 'off' || sub === 'default') {
    delete global.db.data.msgs[sender].voicevox;
    delete global.db.data.msgs[sender].voicespeed;
    return m.reply('🔄 Suara & kecepatan dikembalikan ke default (Sayo — calm anime girl, 0.9× santai).');
  }

  if (sub === 'speed' || sub === 'kecepatan') {
    const v = parseFloat(args[1]);
    if (!Number.isFinite(v) || v < 0.5 || v > 2.0) {
      const cur = global.db.data.msgs[sender].voicespeed ?? 0.9;
      return m.reply(
        `🎚️ *Kecepatan suara*\n\nSekarang: *${cur}×*\n\n` +
        `Atur dengan: *${command} speed <angka>* (rentang 0.5 – 2.0)\n` +
        `• 0.85 = sangat santai/lembut\n` +
        `• 0.9  = santai (default, recommended)\n` +
        `• 1.0  = normal asli VoiceVox\n` +
        `• 1.2  = lebih cepat\n\n` +
        `Contoh: *${command} speed 0.85*`
      );
    }
    global.db.data.msgs[sender].voicespeed = v;
    return m.reply(`✅ Kecepatan suara disimpan: *${v}×*\nMakin kecil = makin santai/mulus.`);
  }

  const id = Number(sub);
  if (!Number.isFinite(id) || id < 0 || id > 100) {
    return m.reply(`❌ ID tidak valid. Ketik *${command} list* untuk lihat pilihan.`);
  }

  global.db.data.msgs[sender].voicevox = id;
  const name = SPEAKERS[id] || 'speaker custom';
  m.reply(`✅ Suara disimpan: *${id} — ${name}*\nMulai sekarang Fiora akan bicara dengan suara ini.`);
};

handler.help = ['voice', 'voice <id>', 'voice list', 'voice reset'];
handler.tags = ['ai'];
handler.command = /^(voice|suara|character)$/i;

export default handler;
