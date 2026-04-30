import axios from 'axios';

let handler = async (m, { conn, text, usedPrefix, command, args }) => {
  try {
    if (!text) return m.reply(`Contoh: *${usedPrefix + command} lilith*`);

    const render = (result, index) => {
  const btn = new Button()
    .setImage(result[index])
    .setBody(`Result ${index + 1}/${result.length}`);

  let buttons = [];

  if (index > 0) {
    buttons.push({
      text: "Previous Image",
      cmd: `${usedPrefix}pinterestnextpage ${JSON.stringify(result)} ${index - 1}`
    });
  }

  if (index < result.length - 1) {
    buttons.push({
      text: "Next Image",
      cmd: `${usedPrefix}pinterestnextpage ${JSON.stringify(result)} ${index + 1}`
    });
  }

  const navCount = buttons.length;

  buttons.push({
    text: "Random Image",
    cmd: `${usedPrefix}pinterestrandompage ${JSON.stringify(result)}`
  });

  buttons.push({
    text: "Send All (private chat)",
    cmd: `${usedPrefix}pinterestsendall ${JSON.stringify(result)}`
  });

  buttons.forEach(b => btn.addReply(b.text, b.cmd));

  let divider = [];

  if (navCount > 0) divider.push(navCount);

  divider.push(navCount + 2);

  btn.setParams({
    bottom_sheet: {
      in_thread_buttons_limit: 1,
      divider_indices: divider,
      list_title: "Options",
      button_title: "Options"
    },
    limited_time_offer: {
      text: global.namebot,
      url: global.source
    }
  });

  btn.setButton("single_select", {
    title: "Select",
    sections: [
      {
        rows: result.map((v, i) => ({
          title: `Result ${i + 1}`,
          description: index == i ? "Currently":"", 
          id: `${usedPrefix}pinterestnextpage ${JSON.stringify(result)} ${i}`
        }))
      }
    ]
  });

  return btn.run(m.chat, conn, m);
};

    if (command === "pinterestsendall") {
      const result = JSON.parse(args[0]);
      await m.react("⏳");
      await conn.sendAlbumMessage(
        m.sender,
        result.map(v => ({ image: { url: v } })),
        m
      );
      await m.react("✅");
      return m.reply("Terkirim!");
    }

    let result, index = 0;

    if (command === "pinterestnextpage") {
      result = JSON.parse(args[0]);
      index = parseInt(args[1]) || 0;
    } else if (command === "pinterestrandompage") {
      result = JSON.parse(args[0]);
      index = Math.floor(Math.random() * result.length);
    } else {
      result = await pins(text);
      if (!result) return m.reply("No image found.");
    }

    return render(result, index);

  } catch (e) {
    return m.reply("Terjadi kesalahan.\n\n" + e.message);
  }
};

handler.command = [
  "pinsearch",
  "pinterest",
  "pin",
  "pins",
  "pinterestnextpage",
  "pinterestrandompage",
  "pinterestsendall"
];
handler.help = ["pinterest"];
handler.tags = "search";

export default handler;

const pins = async function(query) {
  const link = `https://id.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}%26rs%3Dtyped&data=%7B%22options%22%3A%7B%22applied_unified_filters%22%3Anull%2C%22appliedProductFilters%22%3A%22---%22%2C%22article%22%3Anull%2C%22auto_correction_disabled%22%3Afalse%2C%22corpus%22%3Anull%2C%22customized_rerank_type%22%3Anull%2C%22domains%22%3Anull%2C%22dynamicPageSizeExpGroup%22%3A%22control%22%2C%22filters%22%3Anull%2C%22journey_depth%22%3Anull%2C%22page_size%22%3Anull%2C%22price_max%22%3Anull%2C%22price_min%22%3Anull%2C%22query_pin_sigs%22%3Anull%2C%22query%22%3A%22${encodeURIComponent(query)}%22%2C%22redux_normalize_feed%22%3Atrue%2C%22request_params%22%3Anull%2C%22rs%22%3A%22typed%22%2C%22scope%22%3A%22pins%22%2C%22selected_one_bar_modules%22%3Anull%2C%22seoDrawerEnabled%22%3Afalse%2C%22source_id%22%3Anull%2C%22source_module_id%22%3Anull%2C%22source_url%22%3A%22%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}%26rs%3Dtyped%22%2C%22top_pin_id%22%3Anull%2C%22top_pin_ids%22%3Anull%7D%2C%22context%22%3A%7B%7D%7D`;

  const headers = {
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'priority': 'u=1, i',
    'referer': 'https://id.pinterest.com/',
    'screen-dpr': '1',
    'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133")',
    'sec-ch-ua-full-version-list': '"Not(A:Brand";v="99.0.0.0", "Google Chrome";v="133.0.6943.142", "Chromium";v="133.0.6943.142")',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-model': '""',
    'sec-ch-ua-platform': '"Windows"',
    'sec-ch-ua-platform-version': '"10.0.0"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    'x-app-version': 'c056fb7',
    'x-pinterest-appstate': 'active',
    'x-pinterest-pws-handler': 'www/index.js',
    'x-pinterest-source-url': '/',
    'x-requested-with': 'XMLHttpRequest'
  };

  try {
    const res = await axios.get(link, { headers });
    if (res.data?.resource_response?.data?.results) {
      const urls = res.data.resource_response.data.results
        .map(item => item.images?.orig?.url || null)
        .filter(url => url !== null);

      return urls;
    }
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};