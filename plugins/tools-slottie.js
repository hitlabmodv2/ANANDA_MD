import { prepareWAMessageMedia } from "baileys";
import JSZip from "jszip";
import sizeOf from "image-size";
import { getBuffer } from "../lib/tools.js";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";

export async function injectMedia(bufferZip, path = "animation/animation_secondary.json", buffer, type = "image", hd) {
  const zip = await JSZip.loadAsync(bufferZip);
  if (!zip.file(path)) throw "JSON path tidak ditemukan";

  let data;

  if (type === "video") {
    const toStream = b => {
      const s = new Readable();
      s.push(b);
      s.push(null);
      return s;
    };

    const duration = await new Promise((res, rej) => {
      ffmpeg.ffprobe(toStream(buffer), (e, d) => e ? rej(e) : res(d.format.duration));
    });

    if (duration > 10) throw "Maksimal 10 detik";

    const chunks = [];
    await new Promise((res, rej) => {
      ffmpeg(toStream(buffer))
        .inputFormat("mp4")
        .outputOptions([
          hd ? "-vf fps=15" : "-vf fps=15,scale=128:-1:flags=lanczos",
          "-f image2pipe",
          "-vcodec mjpeg"
        ])
        .on("error", rej)
        .on("end", res)
        .pipe()
        .on("data", c => chunks.push(c));
    });

    const big = Buffer.concat(chunks);
    const frames = [];
    let i = 0;

    while (i < big.length) {
      if (big[i] === 0xff && big[i + 1] === 0xd8) {
        let start = i;
        i += 2;
        while (i < big.length) {
          if (big[i] === 0xff && big[i + 1] === 0xd9) {
            let end = i + 2;
            frames.push(big.slice(start, end));
            i = end;
            break;
          }
          i++;
        }
      } else i++;
    }

    if (!frames.length) throw "Frame kosong";

    const { width, height } = sizeOf(frames[0]);

    const assets = [];
    const layers = [];

    frames.forEach((buf, i) => {
      const id = `img_${i}`;
      assets.push({
        id,
        w: width,
        h: height,
        u: "",
        p: `data:image/jpeg;base64,${buf.toString("base64")}`,
        e: 1
      });

      layers.push({
        ddd: 0,
        ind: i + 1,
        ty: 2,
        nm: id,
        refId: id,
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [width / 2, height / 2, 0] },
          a: { a: 0, k: [width / 2, height / 2, 0] },
          s: { a: 0, k: [65, 65, 100] }
        },
        ip: i,
        op: i + 1,
        st: i,
        bm: 0
      });
    });

    data = { v:"5.12.1", fr:15, ip:0, op:frames.length, w:width, h:height, nm:"VideoToLottie", ddd:0, assets, layers };
  } else {
    const { width, height, type: t } = sizeOf(buffer);
    const mime = t === "jpg" ? "jpeg" : (t || "png");
    const dataUri = `data:image/${mime};base64,${buffer.toString("base64")}`;

    const animations = [
      {v:"5.12.1",fr:60,ip:0,op:240,w:width,h:height,nm:"Jumpscare",ddd:0,assets:[{id:"image_0",w:width,h:height,u:"",p:dataUri,e:1}],layers:[{ddd:0,ind:1,ty:2,nm:"Layer_Muter",refId:"image_0",sr:1,ks:{o:{a:1,k:[{t:0,s:[0]},{t:5,s:[100]}]},r:{a:0,k:0},p:{a:1,k:[{t:0,s:[width/2,height/2,0]},{t:8,s:[width/2-5,height/2+5,0]},{t:12,s:[width/2+5,height/2-5,0]},{t:16,s:[width/2-2,height/2+8,0]},{t:20,s:[width/2,height/2,0]},{t:240,s:[width/2,height/2,0]}]},a:{a:0,k:[width/2,height/2,0]},s:{a:1,k:[{t:0,s:[25,25,100]},{t:6,s:[140,140,100]},{t:240,s:[140,140,100]}]}},ao:0,ip:0,op:240,st:0,bm:0}]},
      {v:"5.12.1",fr:60,ip:0,op:600,w:width,h:height,nm:"SpinPause",ddd:0,assets:[{id:"image_0",w:width,h:height,u:"",p:dataUri,e:1}],layers:[{ddd:0,ind:1,ty:2,nm:"Layer_Spin",refId:"image_0",sr:1,ks:{o:{a:0,k:100},r:{a:1,k:[{t:0,s:[0]},{t:180,s:[360]},{t:300,s:[360]},{t:600,s:[720]}]},p:{a:0,k:[width/2,height/2,0]},a:{a:0,k:[width/2,height/2,0]},s:{a:1,k:[{t:0,s:[100,100,100]},{t:200,s:[100,100,100]},{t:250,s:[102,102,100]},{t:300,s:[100,100,100]},{t:600,s:[100,100,100]}]}},ao:0,ip:0,op:600,st:0,bm:0}]}
    ];
    
    const scaleLottie = (data, factor = 0.65) => {
  if (!data.layers) return data;

  for (const layer of data.layers) {
    const ks = layer.ks;
    if (!ks || !ks.s) continue;

    const s = ks.s;

    if (s.a === 1 && Array.isArray(s.k)) {
      s.k = s.k.map(kf => ({
        ...kf,
        s: [
          kf.s[0] * factor,
          kf.s[1] * factor,
          kf.s[2]
        ]
      }));
    } else if (s.a === 0 && Array.isArray(s.k)) {
      s.k = [
        s.k[0] * factor,
        s.k[1] * factor,
        s.k[2]
      ];
    }
  }

  return data;
};

    let anu = animations[Math.floor(Math.random() * animations.length)];
    data = scaleLottie(anu, 0.65);
  }

  zip.file(path, JSON.stringify(data));

  const metadata = {"sticker-pack-id":"1776695712936","sticker-pack-name":"Nixel","sticker-pack-publisher":"","accessibility-text":"Seekor dinosaurus hijau tersentak kaget, mulutnya terbuka. Tanda seru muncul di samping wajahnya.","emojis":["‼️","🦖","😱"],"is-from-user-created-pack":1};

  zip.file("animation/animation.json.overridden_metadata", JSON.stringify(metadata));

  return await zip.generateAsync({ type: "nodebuffer" });
}

function getRandomLink() {
  const link = ["https://cdn.ornzora.eu.cc/11a001bc-8c58-4b19-83b8-59cb52dccdd8-FIORA.zip","https://cdn.ornzora.eu.cc/c2be700b-3939-4ad3-bb4c-9df0c16ce685-FIORA.zip","https://cdn.ornzora.eu.cc/157534b8-bebc-4949-8ded-69e07c72ce9d-FIORA.zip","https://cdn.ornzora.eu.cc/a7578a45-05cf-419a-996d-3119dca00ed1-FIORA.zip","https://cdn.ornzora.eu.cc/c4dedb76-e708-48b3-ae28-e71fa594b556-FIORA.zip","https://cdn.ornzora.eu.cc/6461d69e-11de-41a7-9879-81785db458dc-NIXEL","https://cdn.ornzora.eu.cc/fd9d702c-3eb7-479e-a8fd-29bdaa68d940-NIXEL","https://cdn.ornzora.eu.cc/c4fc55f2-878c-489d-94a0-0e452e12fcf3-NIXEL","https://cdn.ornzora.eu.cc/b1740776-c1eb-4f9c-b621-05a20da9529f-NIXEL","https://cdn.ornzora.eu.cc/16b6f758-9a47-4b5c-a29e-837b6e94734b-NIXEL","https://cdn.ornzora.eu.cc/1ee36a55-ed3f-4757-81c4-4dce740dfe61-NIXEL","https://cdn.ornzora.eu.cc/8a938423-fb4c-4673-b187-61c072345479-NIXEL","https://cdn.ornzora.eu.cc/0cec8c37-770e-496a-9e99-addb01da1535-NIXEL","https://cdn.ornzora.eu.cc/b1c0a7a1-c137-4a85-ab5e-0096ba8e5ede-NIXEL","https://cdn.ornzora.eu.cc/43089b11-0bc9-408d-8989-f0ec188b352f-NIXEL","https://cdn.ornzora.eu.cc/e8b2e048-7177-476a-996f-9b776416b29c-NIXEL"];
  return link[Math.floor(Math.random() * link.length)];
}

let handler = async (m, { conn, text }) => {
	let mess = m.quoted ? m.quoted : m
  if (!mess || !/image|sticker|video/i.test(mess.mtype)) return m.reply("Reply gambar/stiker/video");

  const media = await mess.download();
  const isVideo = /video/i.test(mess.mtype);

  if (isVideo && mess.seconds > 10) return m.reply("Maksimal 10 detik!");
  
  await m.react("🔎") 

  const buffer = await injectMedia(
    await getBuffer(getRandomLink()),
    "animation/animation_secondary.json",
    media,
    isVideo ? "video" : "image", 
    text == 'hd'
  );

  const msg = (await prepareWAMessageMedia({ sticker: buffer }, { upload: conn.waUploadToServer })).stickerMessage;
  
  await m.react("") 
  return await conn.relayMessage(m.chat, {
    lottieStickerMessage: {
      message: {
        stickerMessage: {
          url: msg.url,
          fileSha256: msg.fileSha256,
          fileEncSha256: msg.fileEncSha256,
          mediaKey: msg.mediaKey,
          mimetype: "application/was",
          height: 64,
          width: 64,
          directPath: msg.directPath,
          fileLength: "33332",
          mediaKeyTimestamp: "1776507063",
          isAnimated: true,
          stickerSentTs: "1776507322960",
          isAvatar: false,
          isAiSticker: false,
          isLottie: true
        }
      }
    }
  }, { timestamp: Date.now() });
};

handler.command = handler.help = ["slottie", "lottie"];
handler.tags = "tools";

export default handler;