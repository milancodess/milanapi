const express = require("express");
const fileUpload = require('express-fileupload');
const { Prodia } = require("prodia.js");
const bodyParser = require('body-parser');
const multer = require('multer');
const stream = require('stream');
const FormData = require('form-data');
const qs = require("qs");
const { GoogleGenerativeAI } = require('@google/generative-ai');
const useragent = require('express-useragent');
const JavaScriptObfuscator = require('javascript-obfuscator');
const unlinkSync = require('fs-extra').unlinkSync;
const createReadStream = require('fs-extra').createReadStream;
const fetch = require("node-fetch");
const Jimp = require("jimp");
const jimp = require('jimp');
const crypto = require('crypto');
const { PassThrough } = require("stream");
const cheerio = require("cheerio");
const { createScreenshot } = require("./screenshot.js");
const request = require("request");
const stringSimilarity = require("string-similarity");
const superagent = require('superagent');
const fs = require("fs");
const { v4: uuidv4 } = require('uuid');
const axios = require("axios");
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { fileURLToPath } = require("url");
const { URL } = require('url');
const genAI = new GoogleGenerativeAI(process.env.AIzaSyBD3z1Hk3atVVLmHCqQiTejo_YJHUCkNs8);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const prodia = new Prodia("fd8c21c4-a464-4e3e-a0cc-6d7cc4f32dd3");
const port = process.env.PORT || 5000;
const app = express();
const wrapText = async (ctx, text, maxWidth) => {
  return new Promise((resolve) => {
    if (ctx.measureText(text).width < maxWidth) return resolve([text]);
    if (ctx.measureText('W').width > maxWidth) return resolve(null);
    const words = text.split(' ');
    const lines = [];
    let line = '';
    while (words.length > 0) {
      let split = false;
      while (ctx.measureText(words[0]).width >= maxWidth) {
        const temp = words[0];
        words[0] = temp.slice(0, -1);
        if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
        else {
          split = true;
          words.splice(1, 0, temp.slice(-1));
        }
      }
      if (ctx.measureText(`${line}${words[0]}`).width < maxWidth)
        line += `${words.shift()} `;
      else {
        lines.push(line.trim());
        line = '';
      }
      if (words.length === 0) lines.push(line.trim());
    }
    return resolve(lines);
  });
};
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(express.static(path.join(__dirname, "public")));
app.use(limiter);
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(useragent.express());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.set('json spaces', 2);
const apikey = [
    "xyzmilan"
];
const milan = [
  "milanxd"
];

app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "dashboard","home.html"));
});

app.get("/home", (req, res) => {
res.sendFile(path.join(__dirname, "dashboard","home.html"));
});

app.get("/docs", (req, res) => {
res.sendFile(path.join(__dirname, "dashboard", "docs.html"));
});
  
app.get("/dp", (req, res) => {
    const key = req.query.apikey
    const result = {}

    res.header("Content-type", "application/json; charset=utf-8")

    if (!apikey.includes(key)) {
        result.code = 403
        result.message = "Invalid API key, please contact admin to get key"
        return res.send(JSON.stringify(result, null, 2))
    }
    try {
        const data = JSON.parse(fs.readFileSync("./db.json"))
        const randomIndex1 = Math.floor(Math.random() * data.length)
        result.code = 200
        result.male = data[randomIndex1].link1
       result.female = data[randomIndex1].link2
        result.author = data[randomIndex1].By
        res.send(JSON.stringify(result, null, 2))
        console.log(result)
    } catch (err) {
        console.log(err)
        result.code = 500
        result.message = "Internal Server Error"
        res.send(JSON.stringify(result, null, 2))
    }
})

app.get("/quote", (req, res) => {
  res.header("Content-type", "application/json; charset=utf-8");

  try {
    const filePath = path.resolve(__dirname, "quotes.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    let quotes;

    if (req.query.anime) {
      quotes = data.filter((quote) =>
        stringSimilarity.compareTwoStrings(quote.anime.toLowerCase(), req.query.anime.toLowerCase()) >= 0.5
      );
    } else {
      quotes = data;
    }

    if (quotes.length === 0) {
      res.write(JSON.stringify({
        code: 404,
        message: "No quotes found"
      }, null, 2));
      res.write("\n");
      res.end(JSON.stringify({
        author: "Milan Bhandari",
        contact: "https://www.facebook.com/milancodes"
      }, null, 2));
      return;
    }

    const randomIndex = Math.floor(Math.random() * quotes.length);
    res.write(JSON.stringify({
      code: 200,
      character: quotes[randomIndex].character,
      quote: quotes[randomIndex].quote,
      anime: quotes[randomIndex].anime
    }, null, 2));
    res.write("\n");
    res.end(JSON.stringify({
      author: "Milan Bhandari",
      contact: "https://www.facebook.com/milancodes"
    }, null, 2));
  } catch (err) {
    console.error(err);
    res.write(JSON.stringify({
      code: 500,
      message: "Internal Server Error"
    }, null, 2));
    res.write("\n");
    res.end(JSON.stringify({
      author: "Milan Bhandari",
      contact: "https://www.facebook.com/milancodes"
    }, null, 2));
  }
});

app.get("/screenshot", (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  createScreenshot(url)
    .then((stream) => {
      res.setHeader("Content-Type", "image/png");
      stream.pipe(res);
    })
    .catch((error) => {
      console.error("Error generating screenshot:", error);
      res.status(500).json({ error: "Failed to generate screenshot" });
    });
})

app.get("/wallpaper", (req, res) => {
	const query = req.query.q;
axios.get(`https://www.wallpaperflare.com/search?wallpaper=${query}`, {
		headers: {
			"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
			"cookie": "_ga=GA1.2.1687805424.1659404793; _gid=GA1.2.207306077.1659404793; __gads=ID=180a8dc84ba486a8-228fe01468d5005b:T=1659404754:RT=1659404754:S=ALNI_MYKyYUVdRZkf9fQHbqZ_pWbxlFS5g; __gpi=UID=0000082771779007:T=1659404754:RT=1659404754:S=ALNI_MbP_5p8zTpiuluWHudHo-RKEAKi0w"
		}
	})
	.then(({ data }) => {
		const $ = cheerio.load(data);
		const images = [];
		$('#gallery > li > figure > a').each(function(a, b) {
			images.push($(b).find('img').attr('data-src'));
		});
    const result = {
      result:`${images}`
    };
		res.json(result);
	})
	.catch(err => {
		console.error(err);
		res.status(500).send("Something went wrong.");
	})
})

app.get("/pinterest", (req, res) => {
    var query = req.query.query
    if (!query) return res.json({ error: 'Missing query' })
    var headers = {
        'authority': 'www.pinterest.com',
        'cache-control': 'max-age=0',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'sec-gpc': '1',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'same-origin',
        'sec-fetch-dest': 'empty',
        'accept-language': 'en-US,en;q=0.9',
        'cookie': 'csrftoken=92c7c57416496066c4cd5a47a2448e28; g_state={"i_l":0}; _auth=1; _pinterest_sess=TWc9PSZBMEhrWHJZbHhCVW1OSzE1MW0zSkVid1o4Uk1laXRzdmNwYll3eEFQV0lDSGNRaDBPTGNNUk5JQTBhczFOM0ZJZ1ZJbEpQYlIyUmFkNzlBV2kyaDRiWTI4THFVUWhpNUpRYjR4M2dxblJCRFhESlBIaGMwbjFQWFc2NHRtL3RUcTZna1c3K0VjVTgyejFDa1VqdXQ2ZEQ3NG91L1JTRHZwZHNIcDZraEp1L0lCbkJWUytvRis2ckdrVlNTVytzOFp3ZlpTdWtCOURnbGc3SHhQOWJPTzArY3BhMVEwOTZDVzg5VDQ3S1NxYXZGUEEwOTZBR21LNC9VZXRFTkErYmtIOW9OOEU3ektvY3ZhU0hZWVcxS0VXT3dTaFpVWXNuOHhiQWdZdS9vY24wMnRvdjBGYWo4SDY3MEYwSEtBV2JxYisxMVVsV01McmpKY0VOQ3NYSUt2ZDJaWld6T0RacUd6WktITkRpZzRCaWlCTjRtVXNMcGZaNG9QcC80Ty9ZZWFjZkVGNURNZWVoNTY4elMyd2wySWhtdWFvS2dQcktqMmVUYmlNODBxT29XRWx5dWZSc1FDY0ZONlZJdE9yUGY5L0p3M1JXYkRTUDAralduQ2xxR3VTZzBveUc2Ykx3VW5CQ0FQeVo5VE8wTEVmamhwWkxwMy9SaTNlRUpoQmNQaHREbjMxRlRrOWtwTVI5MXl6cmN1K2NOTFNyU1cyMjREN1ZFSHpHY0ZCR1RocWRjVFZVWG9VcVpwbXNGdlptVzRUSkNadVc1TnlBTVNGQmFmUmtrNHNkVEhXZytLQjNUTURlZXBUMG9GZ3YwQnVNcERDak16Nlp0Tk13dmNsWG82U2xIKyt5WFhSMm1QUktYYmhYSDNhWnB3RWxTUUttQklEeGpCdE4wQlNNOVRzRXE2NkVjUDFKcndvUzNMM2pMT2dGM05WalV2QStmMC9iT055djFsYVBKZjRFTkRtMGZZcWFYSEYvNFJrYTZSbVRGOXVISER1blA5L2psdURIbkFxcTZLT3RGeGswSnRHdGNpN29KdGFlWUxtdHNpSjNXQVorTjR2NGVTZWkwPSZzd3cwOXZNV3VpZlprR0VBempKdjZqS00ybWM9; _b="AV+pPg4VpvlGtL+qN4q0j+vNT7JhUErvp+4TyMybo+d7CIZ9QFohXDj6+jQlg9uD6Zc="; _routing_id="d5da9818-8ce2-4424-ad1e-d55dfe1b9aed"; sessionFunnelEventLogged=1'
    };

    var options = {
        url: 'https://www.pinterest.com/search/pins/?q=' + encodeURI(query) + '&rs=typed&term_meta[]=' + encodeURI(query) + '%7Ctyped',
        headers: headers
    };

    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            const arrMatch = body.match(/https:\/\/i\.pinimg\.com\/originals\/[^.]+\.jpg/g);
            return res.json({
                count: arrMatch.length,
                data: arrMatch,
                author : {
    "name": "MilanXD",
    "contact": "https://www.facebook.com/milanxd.bh"
              }
            })
        }
    }

    request(options, callback);
})

app.get('/html', async (req, res) => {
  try {
    const url = req.query.site;
    if (!url) {
      res.send('URL parameter missing');
    } else {
      const searchUrl = `${url}`;
      const searchResponse = await axios.get(searchUrl);
      const htmlCode = searchResponse.data;

      const modifiedHtmlCode = escapeHtml(htmlCode);

      res.setHeader('Content-Type', 'text/plain');
      res.send(modifiedHtmlCode);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message || 'Something went wrong.');
  }
});

function escapeHtml(html) {
  return html;
}

app.get('/pet', async (req, res) => {
  const uid = req.query.uid;
  let profilePicUrl;
  if (!uid) {
    const url = req.query.url;
    if (!url) {
      return res.json({ message: 'Enter the UID or imageUrl parameter' });
    }
    profilePicUrl = url;
  } else {
    profilePicUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  }

  try {
    const animatedGif = await petPetGif(profilePicUrl, {
      resolution: 512,
    });

    res.set({ 'Content-Type': 'image/gif' });
    res.send(animatedGif);
  } catch (err) {
    console.error(err);
    return res.json({ error: 'Error! An error occurred. Please try again later' });
  }
});

app.get("/github", async (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.json({ status: false, message: "Please provide a username parameter" });
  }
  
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();
    res.json({ author: "Milan Codes", result: data });
  } catch (error) {
    console.error(error);
    res.json({ status: false, message: "An error occurred. Please try again later" });
  }
});

app.get('/avoid', (req, res) => {
  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ error: 'Please provide a valid UID' });
  }

  const profilePicUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const templateURL = 'https://i.postimg.cc/0ybcwbg5/New-Project-45-C254-DA1.png';
  const textImageURL = 'https://i.postimg.cc/pT8SnyF5/New-Project-46-F5-B5-BA8.png';

  axios
    .get(profilePicUrl, { responseType: 'arraybuffer' })
    .then(async (response) => {
      const profilePic = await Jimp.read(response.data);
      const template = await Jimp.read(templateURL);
      const textImage = await Jimp.read(textImageURL);
profilePic.resize(template.bitmap.width, Jimp.AUTO);
      const y = Math.max((template.bitmap.height - profilePic.bitmap.height) / 1 + 0, 9);
      template.composite(profilePic, 0, 125);
textImage.resize(template.bitmap.width, Jimp.AUTO);
      template.composite(textImage, 0, 225);
      template.background(0);
      const outputBuffer = await template.getBufferAsync(Jimp.MIME_PNG);
      const imagePath = `${uid}_edited.png`;
      fs.writeFileSync(imagePath, outputBuffer);
      res.sendFile(imagePath, { root: __dirname }, (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({ error: 'Error sending the image' });
        }
        fs.unlinkSync(imagePath); // Delete the temporary image file
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error: 'There was an error processing the image' });
    });
});
      
app.get('/mark', async (req, res) => {
  const { text } = req.query;
  if (!text) return res.send('Enter the content of the write on the post');
  const pathImg = './image.png';
  const getPorn = (await axios.get('https://i.imgur.com/3j4GPdy.jpg', { responseType: 'arraybuffer' })).data;
  fs.writeFileSync(pathImg, Buffer.from(getPorn, 'utf-8'));
  const baseImage = await loadImage(pathImg);
  const canvas = createCanvas(baseImage.width, baseImage.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
  ctx.font = "400 45px Arial";
  ctx.fillStyle = "#000000";
  ctx.textAlign = "start";
  let fontSize = 45;
  while (ctx.measureText(text).width > 2250) {
    fontSize--;
    ctx.font = `400 ${fontSize}px Arial`;
  }
  const wrapText = (ctx, text, maxWidth) => {
    return new Promise(resolve => {
      if (ctx.measureText(text).width < maxWidth) return resolve([text]);
      if (ctx.measureText('W').width > maxWidth) return resolve(null);
      const words = text.split(' ');
      const lines = [];
      let line = '';
      while (words.length > 0) {
        let split = false;
        while (ctx.measureText(words[0]).width >= maxWidth) {
          const temp = words[0];
          words[0] = temp.slice(0, -1);
          if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
          else {
            split = true;
            words.splice(1, 0, temp.slice(-1));
          }
        }
        if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) line += `${words.shift()} `;
        else {
          lines.push(line.trim());
          line = '';
        }
        if (words.length === 0) lines.push(line.trim());
      }
      return resolve(lines);
    });
  };
  const lines = await wrapText(ctx, text, 440);
  ctx.fillText(lines.join('\n'), 95,420);//comment
  ctx.beginPath();
  const imageBuffer = canvas.toBuffer();
  fs.writeFileSync(pathImg, imageBuffer);
  res.attachment('image.png');
  const stream = fs.createReadStream(pathImg);
  stream.pipe(res);
  stream.on('close', () => fs.unlinkSync(pathImg));
});    
  
app.get("/shit", (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.json({ message: 'Enter the URL parameter' });
  }
  const profilePicUrl = `${url}`;
  canvacord.Canvas.shit(profilePicUrl)
  .then(triggerd => {
    res.set({ "Content-Type": "image/gif" });
    res.send(triggerd);
  })
  .catch(err => {
    console.error(err);
    return res.json({ error: "Error! An error occurred. Please try again later" });
  });
});

app.get("/itunes", async (req, res) => {
  try {
    const query = req.query.query;
    const { data } = await axios.get('https://itunes.apple.com/search', {
      params: {
        term: query,
        media: 'music',
        entity: 'song',
        limit: 1,
        explicit: 'no'
      }
    });
    const { results } = data;
    if (!reults.length) {
      return res.status(404).json({ error: 'Could not find any results.' });
    }
    const [result] = results.map((r) => ({
      url: r.trackViewUrl,
      name: r.trackName,
      artist: r.artistName,
      album: r.collectionName,
      release_date: r.releaseDate?.split("T")[0] || '',
      price: "$" + (r.trackPrice?.toFixed(2) || 0),
      length: Math.round(r.trackTimeMillis / 1000) + "s",
      genre: r.primaryGenreName,
      thumbnail: r.artworkUrl100
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred.' });
  }
});

app.get('/encrypt', (req, res) => {
  const code = req.query.code;
  if (!code) {
    res.status(400).json({ error: 'Please enter a code.' });
    return;
  }
	
  const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    numbersToExpressions: true,
    simplify: true,
    shuffleStringArray: true,
    splitStrings: true,
    stringArrayThreshold: 1,
    target: 'node'
  }).getObfuscatedCode();

  const response = {
    obfuscatedCode,
    author: {
      name: 'MilanXD',
      contact: 'https://www.facebook.com/milanxd.bh'
    }
  };

  res.json(response);
});

app.get('/iginfo', async (req, res) => {
const username = req.query.username;
if (!username) return res.json({ error: 'Missing data to launch the program ' });

const options = {
  method: 'GET',
  url: 'https://instagram210.p.rapidapi.com/ig_profile',
  params: {ig: username},
  headers: {
    'X-RapidAPI-Key': 'a1195f61acmsh6a9dad0b9230160p12c85fjsnde352bd0fbcd',
    'X-RapidAPI-Host': 'instagram210.p.rapidapi.com'
  }
};

axios.request(options).then(function (response) {
	console.log(response.data);
  return res.json(response.data)
}).catch(function (error) {
	console.error(error);
});
})

const API_TOKEN = "01f3498531d840e0b267a48824a78655";
async function transcribeAudio(api_token, audio_url) {
  const headers = {
    authorization: api_token,
    "content-type": "application/json",
  };
  const response = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    body: JSON.stringify({ audio_url }),
    headers,
  });
  const responseData = await response.json();
  const transcriptId = responseData.id;
  const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
  while (true) {
    const pollingResponse = await fetch(pollingEndpoint, { headers });
    const transcriptionResult = await pollingResponse.json();
    if (transcriptionResult.status === "completed") {
      return transcriptionResult;
    }
    else if (transcriptionResult.status === "error") {
      throw new Error(`Transcription failed: ${transcriptionResult.error}`);
    }
    else {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

app.get('/transcribe', async (req, res) => {
  const audioUrl = req.query.url;
  if (!audioUrl) return res.json({ error:"URL parameter is missing. Please provide a valid audio URL" })
  try {
    const transcript = await transcribeAudio(API_TOKEN, audioUrl);
    res.json({ transcript: transcript.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/demoted', async (req, res) => {
  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ error: 'Please provide a valid UID' });
  }

  const profilePicUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const templateURL = "https://i.postimg.cc/25fpg9Qd/New-Project-45-076-A17-A.png";

		axios.get(profilePicUrl, { responseType: "arraybuffer" }).then(async (response) => {
			const profilePic = await Jimp.read(response.data);
			profilePic.resize(300, 300); // Resize the profile picture to a desired size
			profilePic.greyscale(); // Convert the profile picture to black and white
			const template = await Jimp.read(templateURL);
			template.resize(profilePic.bitmap.width, profilePic.bitmap.height);
			const x = (profilePic.bitmap.width - template.bitmap.width) / 2;
			const y = (profilePic.bitmap.height - template.bitmap.height) / 2;
			profilePic.composite(template, x, y);
			const outputBuffer = await profilePic.getBufferAsync(Jimp.MIME_PNG);
      const imagePath = `${uid}_edited.png`;
      fs.writeFileSync(imagePath, outputBuffer);
      res.sendFile(imagePath, { root: __dirname }, (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({ error: 'Error sending the image' });
        }
        fs.unlinkSync(imagePath); // Delete the temporary image file
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error: 'There was an error processing the image' });
    });
});

app.get('/promoted', async (req, res) => {
  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ error: 'Please provide a valid UID' });
  }

  const profilePicUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
		const templateURL = "https://i.postimg.cc/nrrNqyxx/New-Project-45-0-AB23-CE.png";

		axios.get(profilePicUrl, { responseType: "arraybuffer" }).then(async (response) => {
			const profilePic = await Jimp.read(response.data);
			profilePic.resize(300, 300); // Resize the profile picture to a desired size
			const template = await Jimp.read(templateURL);
			template.resize(profilePic.bitmap.width, profilePic.bitmap.height);
			const x = (profilePic.bitmap.width - template.bitmap.width) / 2;
			const y = (profilePic.bitmap.height - template.bitmap.height) / 2;
			profilePic.composite(template, x, y);
			const outputBuffer = await profilePic.getBufferAsync(Jimp.MIME_PNG);
      const imagePath = `${uid}_edited.png`;
      fs.writeFileSync(imagePath, outputBuffer);
      res.sendFile(imagePath, { root: __dirname }, (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({ error: 'Error sending the image' });
        }
        fs.unlinkSync(imagePath); // Delete the temporary image file
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error: 'There was an error processing the image' });
    });
});  

app.get('/enhance', async (req, res) => {
  const imageUrl = req.query.imageUrl;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL not provided' });
  }

  try {
    const axiosInstance = axios.create();
    const axiosResponse = await axiosInstance.get(
      encodeURI(`https://nams.live/upscale.png?{"image":"${imageUrl}","model":"4x-UltraSharp"}`),
      { responseType: 'arraybuffer' } // Use arraybuffer for binary response
    );

    const buffer = Buffer.from(axiosResponse.data, 'binary');
    res.set('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
});

app.get('/infra', (req, res) => {
try {
    const query = req.query.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required.' });
    }

    const apiUrl = 'https://api.deepinfra.com/v1/openai/chat/completions';
    const headers = {
    'accept': 'text/event-stream',
       'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
       'content-type': 'application/json',
       'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
       'sec-ch-ua-mobile': '?1',
       'sec-ch-ua-platform': '"Android"',
       'sec-fetch-dest': 'empty',
       'sec-fetch-mode': 'cors',
       'sec-fetch-site': 'same-site',
       'x-deepinfra-source': 'web-embed',
       'Referer': 'https://deepinfra.com/',
       'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

    const requestData = {
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      messages: [
        { role: 'system', content:'Be a helpful assistant.'},
        { role: 'user', content: query },
      ],
      stream: false,
    };

axios.post(apiUrl, requestData, { headers })
      .then(response => {
        res.json(response.data);
      })
      .catch(error => {
        res.status(500).json({ error: error.message });
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/download', async (req, res) => {
  try {
    const pin = req.query.url; 
    const url = "https://getindevice.com/wp-json/aio-dl/video-data/";
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "Sec-Ch-Ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\"",
      "Sec-Ch-Ua-Mobile": "?1",
      "Sec-Ch-Ua-Platform": "\"Android\"",
      "Referer": "https://getindevice.com/pinterest-video-downloader/",
      "Referrer-Policy": "no-referrer-when-downgrade"
    };
    const data = `url=${pin}&token=milanxyz`;

    const response = await axios.post(url, data, { headers });
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/imgur', async (req, res) => {
    const link = req.query.link;

    if (!link) return res.json({ error: 'Missing link to launch the program' });

    try {
        const response = await axios.post('https://api.imgur.com/3/image', {
            image: encodeURI(link)
        }, {
            headers: {
                'Authorization': 'Client-ID 6d0dba3a66763d9'
            }
        });

        const upload = response.data;
        res.json({
                status: 'success',
                image: upload.data.link
        });
    } catch (error) {
        res.json({ error: 'Something went wrong with your link' });
    }
});

app.get('/tinyurl', (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.json({ error: 'Please enter the url first.' });
  }

  axios.post('https://tinyurl.com/api-create.php?url=', { url })
    .then(function (response) {
      const data = response.data;
      return res.json({
        url: data,
        author: 'Milan Codes'
      });
    })
    .catch(function (error) {
      return res.json({ error: 'An error occurred while processing the request' });
    });
});

app.get('/spotify', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    const getOriginalUrl = async () => {
      try {
        const response = await fetch(url);
        return response.url;
      } catch (error) {
        throw new Error("Please input a valid URL");
      }
    };

    const originalUrl = await getOriginalUrl(url);
    const trackId = originalUrl.split("track/")[1].split("?")[0];
    const headers = {
      Origin: "https://spotifydown.com",
      Referer: "https://spotifydown.com/",
    };

    let apiUrl = "";
    if (url.includes("spotify.link")) {
      apiUrl = `https://api.spotifydown.com/metadata/track/${trackId}`;
    } else if (url.includes("open.spotify.com")) {
      apiUrl = `https://api.spotifydown.com/download/${trackId}`;
    } else {
      return res.status(400).json({ message: "Invalid Spotify URL" });
    }

    const response = await axios.get(apiUrl, { headers });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}); 

app.get('/ocr', async (req, res) => {
  const imageUrl = req.query.imageUrl;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Missing imageUrl parameter' });
  }

  const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=AIzaSyAV-SXt0qiF5aHdn-Zgcl4Gr61_gxx28qs`;

  const requestBody = {
    requests: [{
      image: {
        source: {
          imageUri: imageUrl
        }
      },
      features: [{
        type: "DOCUMENT_TEXT_DETECTION"
      }]
    }]
  };

  try {
    const visionApiResponse = await fetch(visionApiUrl, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/json',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
        'Sec-Ch-Ua-Mobile': '?1',
        'Sec-Ch-Ua-Platform': '"Android"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'X-Client-Data': 'CIP9ygE=',
        'Referer': 'https://brandfolder.com/',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      },
      body: JSON.stringify(requestBody)
    });

    const visionApiResult = await visionApiResponse.json();
    res.json(visionApiResult);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/rashifal', (req, res) => {
    const url = 'https://www.hamropatro.com/rashifal';

    axios.get(url)
        .then(response => {
            const $ = cheerio.load(response.data);

            const h3Elements = $('h3');
            const descElements = $('.desc p');

            const rashiNames = [
                "मेष", "बृष", "मिथुन", "कर्कट",
                "सिंह", "कन्या", "तुला", "बृश्चिक",
                "धनु", "मकर", "कुम्भ", "मीन"
            ];

            const results = [];
       descElements.each((index, element) => {
                const rashi = index + 1; 
                const name = rashiNames[index];
                const text = $(element).text();
                results.push({ rashi, name, text });
            });

            res.json(results);
        })
        .catch(error => {
            res.status(500).json({ error: `Failed to retrieve the page. Error: ${error.message}` });
        });
});

const url = 'https://kathmandupost.com';
app.get('/tkp', async (req, res) => {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const paragraphs = $('p').map((index, element) => $(element).text().trim()).get();
    const links = $('div.image.pull-right a').map((index, element) => $(element).attr('href')).get();

    const imageLinks = $('div.image.pull-right figure a img.lazy.img-responsive').map((index, element) => $(element).attr('data-src')).get();
    const result = [];
    for (let i = 0; i < paragraphs.length; i++) {
      result.push({
        news: paragraphs[i],
        link: links[i] ? url + links[i] : null,
        image: imageLinks[i] || null,
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/news', async (req, res) => {
  try {
    const newsUrl = req.query.newsUrl;

    if (!newsUrl) {
      return res.status(400).json({ error: 'Missing newsUrl parameter' });
    }

    const response = await axios.get(newsUrl);
    const html = response.data;

    const $ = cheerio.load(html);

    const author = $('h5.text-capitalize a').text().trim();

    const updatedTimes = [];
    $('div.updated-time').each((index, element) => {
      
      const published = $(element).contents().filter(function() {
        return this.nodeType === 3; 
      }).text().trim();
      updatedTimes.push({ published });
    });

    const news = $('section.story-section p').text().trim();

    res.json({
      author: author,
      updatedTimes: updatedTimes,
      news: news
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const publicDirectory = path.join(__dirname,'public');
if (!fs.existsSync(publicDirectory)) {
  fs.mkdirSync(publicDirectory);
}

app.get('/imagine', async (req, res) => {
  const prompt = req.query.prompt;
  const model = req.query.model;

  if (!prompt) {
    return res.status(400).json({ error: 'Please provide a prompt.' });
  }

  try {
    const imageUrls = await generateImages(prompt.toString(), model);
    const combinedImagePath = await combineImages(imageUrls);
    const author = {
      name: "MilanXD",
      contact: "https://www.facebook.com/milanxd.bh"
    };
    
    const modifiedImageUrls = imageUrls.reduce((acc, curr, index) => {
      acc[`image${index + 1}`] = curr;
      return acc;
    }, {});

    return res.json({ combinedImageUrl: combinedImagePath, imageUrls: modifiedImageUrls, author });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'An error occurred while generating the image.' });
  }
});



async function generateImages(prompt, model) {
  const models = [
  "3Guofeng3_v34.safetensors [50f420de]",
  "absolutereality_V16.safetensors [37db0fc3]",
  "absolutereality_v181.safetensors [3d9d4d2b]",
  "amIReal_V41.safetensors [0a8a2e61]",
  "analog-diffusion-1.0.ckpt [9ca13f02]",
  "anythingv3_0-pruned.ckpt [2700c435]",
  "anything-v4.5-pruned.ckpt [65745d25]",
  "anythingV5_PrtRE.safetensors [893e49b9]",
  "AOM3A3_orangemixs.safetensors [9600da17]",
  "blazing_drive_v10g.safetensors [ca1c1eab]",
  "cetusMix_Version35.safetensors [de2f2560]",
  "childrensStories_v13D.safetensors [9dfaabcb]",
  "childrensStories_v1SemiReal.safetensors [a1c56dbb]",
  "childrensStories_v1ToonAnime.safetensors [2ec7b88b]",
  "Counterfeit_v30.safetensors [9e2a8f19]",
  "cuteyukimixAdorable_midchapter3.safetensors [04bdffe6]",
  "cyberrealistic_v33.safetensors [82b0d085]",
  "dalcefo_v4.safetensors [425952fe]",
  "deliberate_v2.safetensors [10ec4b29]",
  "deliberate_v3.safetensors [afd9d2d4]",
  "dreamlike-anime-1.0.safetensors [4520e090]",
  "dreamlike-diffusion-1.0.safetensors [5c9fd6e0]",
  "dreamlike-photoreal-2.0.safetensors [fdcf65e7]",
  "dreamshaper_6BakedVae.safetensors [114c8abb]",
  "dreamshaper_7.safetensors [5cf5ae06]",
  "dreamshaper_8.safetensors [9d40847d]",
  "edgeOfRealism_eorV20.safetensors [3ed5de15]",
  "EimisAnimeDiffusion_V1.ckpt [4f828a15]",
  "elldreths-vivid-mix.safetensors [342d9d26]",
  "epicrealism_naturalSinRC1VAE.safetensors [90a4c676]",
  "ICantBelieveItsNotPhotography_seco.safetensors [4e7a3dfd]",
  "juggernaut_aftermath.safetensors [5e20c455]",
  "lofi_v4.safetensors [ccc204d6]",
  "lyriel_v16.safetensors [68fceea2]",
  "majicmixRealistic_v4.safetensors [29d0de58]",
  "mechamix_v10.safetensors [ee685731]",
  "meinamix_meinaV9.safetensors [2ec66ab0]",
  "meinamix_meinaV11.safetensors [b56ce717]",
  "neverendingDream_v122.safetensors [f964ceeb]",
  "openjourney_V4.ckpt [ca2f377f]",
  "pastelMixStylizedAnime_pruned_fp16.safetensors [793a26e8]",
  "portraitplus_V1.0.safetensors [1400e684]",
  "protogenx34.safetensors [5896f8d5]",
  "Realistic_Vision_V1.4-pruned-fp16.safetensors [8d21810b]",
  "Realistic_Vision_V2.0.safetensors [79587710]",
  "Realistic_Vision_V4.0.safetensors [29a7afaa]",
  "Realistic_Vision_V5.0.safetensors [614d1063]",
  "redshift_diffusion-V10.safetensors [1400e684]",
  "revAnimated_v122.safetensors [3f4fefd9]",
  "rundiffusionFX25D_v10.safetensors [cd12b0ee]",
  "rundiffusionFX_v10.safetensors [cd4e694d]",
  "sdv1_4.ckpt [7460a6fa]",
  "v1-5-pruned-emaonly.safetensors [d7049739]",
  "v1-5-inpainting.safetensors [21c7ab71]",
  "shoninsBeautiful_v10.safetensors [25d8c546]",
  "theallys-mix-ii-churned.safetensors [5d9225a4]",
  "timeless-1.0.ckpt [7c4971d4]",
  "toonyou_beta6.safetensors [980f6b15]",
  "dreamshaperXL10_alpha2.safetensors [c8afe2ef]",
  "dynavisionXL_0411.safetensors [c39cc051]",  
  "juggernautXL_v45.safetensors [e75f5471]",
  "realismEngineSDXL_v10.safetensors [af771c3f]",
  "sd_xl_base_1.0.safetensors [be9edd61]",
  "sd_xl_base_1.0_inpainting_0.1.safetensors [5679a81a]",
  "turbovisionXL_v431.safetensors [78890989]"
];

  const selectedModel = model ? models[Number(model) - 1] : "absolutereality_v181.safetensors [3d9d4d2b]";

  if (!selectedModel) {
    throw new Error("Invalid model parameter");
  }

  const imagePromises = [];

  for (let i = 0; i < 4; i++) {
    let job = await prodia.generateImage({
      model: selectedModel,
      prompt: prompt,
      seed: -1,
      negative_prompt: "",
      aspect_ratio: "square"
    });

    while (job.status !== "succeeded") {
      await new Promise((resolve) => setTimeout(resolve, 250));
      job = await prodia.getJob(job.job);
    }

    imagePromises.push(job.imageUrl);
  }

  return Promise.all(imagePromises);
}

async function combineImages(imageUrls) {
  const images = await Promise.all(imageUrls.map(url => Jimp.read(url)));

  const imageWidth = images[0].bitmap.width;
  const imageHeight = images[0].bitmap.height;

  const combinedImageWidth = imageWidth * 2;
  const combinedImageHeight = imageHeight * 2;

  const combinedImage = new Jimp(combinedImageWidth, combinedImageHeight);

  const image1X = 0;
  const image1Y = 0;
  const image2X = imageWidth;
  const image2Y = 0;
  const image3X = 0;
  const image3Y = imageHeight;
  const image4X = imageWidth;
  const image4Y = imageHeight;

  combinedImage.composite(images[0], image1X, image1Y);
  combinedImage.composite(images[1], image2X, image2Y);
  combinedImage.composite(images[2], image3X, image3Y);
  combinedImage.composite(images[3], image4X, image4Y);

  const uniqueFilename = `combinedImage.jpg`;
  const combinedImgPath = path.join(__dirname, 'public', uniqueFilename);

  await combinedImage.writeAsync(combinedImgPath);

  // Construct external URL based on your provided format
  const externalUrl = `https://www.bhandarimilan.info.np/public/combinedImage.jpg`;

  return externalUrl;
}

app.get('/public/combinedImage.jpg', (req, res) => {
  const combinedImagePath = path.join(__dirname, 'public', 'combinedImage.jpg');
  res.sendFile(combinedImagePath);
});

app.get('/clips', async (req, res) => {
	const query = req.query.query;
  if (!query) {
    return res.status(400).send('Query parameter is required');
  }
  try {

    const clipsApi = `https://clip.cafe/?s=${query}&ss=s`;
    const response = await axios.get(clipsApi);
    const html = response.data;

    const $ = cheerio.load(html);

    const results = [];

    const clipPromises = $('.searchResultClip').map(async (index, element) => {
      const time = $(element).find('.clipTitle .videoDuration').text();
      const movie = $(element).find('.clipMovie a').text();
      const linkk = $(element).find('.searchResultClipImg a').attr('href');
      const link = `https://clip.cafe/${linkk}`;

      try {
        const response = await axios.get(link);
        const html = response.data;
        const $ = cheerio.load(html);
        let video = $('source[type="video/mp4"]').attr('src');
        const quote = $('h1.quote-title').text();

        results.push({ movie, time, link, quote, video});
      } catch (error) {
        console.error('Error:', error.message);
      }
    }).get();

    await Promise.all(clipPromises);

    res.json({ results });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const CLIENT_ID = 'f3335b183f444e44a68ab7a6c886dbb1';
const CLIENT_SECRET = '51306a1a768746459321ff76f88a0c39';

app.get('/spotisearch', async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).send('Query parameter is required');
  }
  try {
    function msToMinutesAndSeconds(duration_ms) {
  const minutes = Math.floor(duration_ms / 60000);
  const seconds = ((duration_ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${(seconds < 10 ? '0' : '')}${seconds}`;
    }
    const tokenResponse = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      params: {
        grant_type: 'client_credentials'
      },
      headers: {
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      params: {
        query: query,
        type: 'track'
      }
    });

const tracks = searchResponse.data.tracks.items.map(item => ({
      name: item.name,
      artist: item.artists.map(artist => artist.name).join(', '),
      release_date: item.album.release_date,
      duration: msToMinutesAndSeconds(item.duration_ms),
      link: item.external_urls.spotify,
      image_url: item.album.images.length > 0 ? item.album.images[0].url : null
    }));

    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/9anime', async (req, res) => {
    const query = req.query.query;
    const url = `https://9animetv.to/search?keyword=${query}`;

    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        const results = [];

        $('.film-poster').each((index, element) => {
            const $element = $(element);
            const textTick = $element.find('.tick-eps').text().trim();
            const imageLink = $element.find('.film-poster-img').attr('data-src');
            const altText = $element.find('.film-poster-img').attr('alt');
            const hrefValue = $element.find('.film-poster-ahref').attr('href');
            const aHref = hrefValue ? `https://9animetv.to${hrefValue}` : '';
          results.push({
                anime: altText,
                episode: textTick,
                image: imageLink,
                link: aHref
            });
        });

        res.json(results);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Failed to fetch data.");
    }
});

app.get('/fbuid', async (req, res) => {
  let originalLink = req.query.link;

  const linkWithoutQuery = originalLink.split('?')[0];
  
  let username;
  if (linkWithoutQuery.includes('fb.me/') || linkWithoutQuery.includes('facebook.com/') || linkWithoutQuery.includes('m.me/')) {
    username = linkWithoutQuery.split('/').pop();
  } else {
    const parts = linkWithoutQuery.split('/');
    username = parts[parts.length - 1];
  }

  const link = `https://www.facebook.com/${username}`;

  const url = 'https://fchat-app.salekit.com:4039/api/v1/facebook/get_uid';
  const headers = {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\"",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": "\"Android\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "Referer": "https://fbuid.net/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
  };

  const body = new URLSearchParams();
  body.append('link', link);

  try {
      const response = await fetch(url, {
          method: "POST",
          headers: headers,
          body: body
      });
      const data = await response.json();
      res.json(data);
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/seeresult', async (req, res) => {
    const { name, symbolNo } = req.query;

    try {
        const response = await axios.post('https://results.ekantipur.com/submit/see.php', 
            `fullname=${name}&mobile=9847564915&symbol=${symbolNo}&district=kathmandu`, {
            headers: {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'x-requested-with': 'XMLHttpRequest',
                'Referer': 'https://results.ekantipur.com/see-results-with-marksheet.php',
                'Refrrer-Policy': 'strict-origin-when-cross-origin'
            }
        });

        res.send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while submitting the form');
    }
});

app.get('/spotiplaylist', async (req, res) => {
  const playlistUrl = req.query.url;

  if (!playlistUrl) {
    return res.status(400).send("The 'url' query parameter is required.");
  }

  try {
    const response = await axios.get('https://spotifydownloaders.com/api/getSpotifyDetails', {
      headers: {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "sec-ch-ua": "\"Not-A.Brand\";v=\"99\", \"Chromium\";v=\"124\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "Referer": "https://spotifydownloaders.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      params: {
        url: playlistUrl
      }
    });

    // Modify the response
    const modifiedResponse = response.data;
    
    if (modifiedResponse.tracks) {
      modifiedResponse.tracks = modifiedResponse.tracks.map(track => {
        if (track.uri && track.uri.startsWith('spotify:track:')) {
          const trackId = track.uri.split(':')[2];
          return {
            ...track,
            url: `https://open.spotify.com/track/${trackId}`,
            uri: undefined // Remove the uri field
          };
        }
        return track;
      });
    }

    res.send(modifiedResponse);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

app.get('/reddit', async (req, res) => {
  try {
    const url = req.query.url; 

    if (!url) {
      return res.status(400).send('URL query parameter is required.');
    }

    const response = await axios.post('https://redvid.io/en/fetch', {
      url: url,
      _token: 'ueiNjO6jNhEsXtFXWtH2FMrFUlh8BE1gBdQHuF3Y'
    }, {
      headers: {
        "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    "sec-ch-ua": "\"Not-A.Brand\";v=\"99\", \"Chromium\";v=\"124\"",
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": "\"Android\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "cookie": "cf_clearance=YUQpWp1mDXKcm46OI.0jhXY90N8Y7y9FHealCkbqFRI-1721152387-1.0.1.1-yk1gSVrN66kT0tChF2_PMVhxFVjpCQ7BkOz4h2Rs9JB9nNNJ.5HDMXaJ2kA_LpkRIQNyoEb65_ntal2QcEOBqQ; XSRF-TOKEN=eyJpdiI6InVMbmRxZUxJQnFNK2ZTZlcwdzBZbXc9PSIsInZhbHVlIjoiWmt4TGFzU2I0eVl6TDFpRUN4OUJibWZHSURpb1JMK0lldjZaa09LZnVOcWZBM2RyRlhPaHdLVGxuZ2FNUTluc2tFZTNqemIxUS9xR3hENS9VVVA0UHY3K0QweDZ4a1ltNHU3dTYzbTlzUmNkNDIrNjJVaVEzcHZWSkdHV3ZzNnkiLCJtYWMiOiJhZmJjNDc4OGJiMzhmMGVmYWJlM2RmNWIxNmIyYWU3ZTVlODJiNmQ0MDVlZDdmYjBmMmY5NjZmYWY1N2RiYjkxIiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6IjFWZUl5a0UzSjVrRzVjSW8vNSsxZVE9PSIsInZhbHVlIjoieWVuRjVQcEJ5cDhCWFNBRGhDL2FOdjZuU2FYK0FKS3EreXlBY0g4b0VpTFN3QmNBS21tbStnSlpQamMvMjdjYmkyV3pETzhzQzErUjNUbTJIVERBcURMVXpteGNhVmFlUE9nQUQrZ3ltdk1MdzhnL2xQNjE3cE1HM3BVRm5TakciLCJtYWMiOiIwNTgzNmJkMzQ0ZmE2ZTcyMjM5MzcxMTcxYmEyNzhmN2M0YWRmNzk1NWY3MzUxMTM0Y2RkNmUwMDAxOThkNGUzIiwidGFnIjoiIn0%3D",
    "Referer": "https://redvid.io/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      withCredentials: true // Include cookies in the request
    });

    res.json(response.data); // Send the response data back to the client
  } catch (error) {
    console.error('Error making POST request:', error);
    res.status(500).send('Error making request');
  }
});

async function generateImage(prompt) {
  const form = new FormData();
  form.append('prompt', prompt);

  try {
    const response = await axios.post(
      'https://photoeditor.ai/api/v1/generate-image/',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'cookie': 'cf-c=NP; cf-t=1',
          'Referer': 'https://photoeditor.ai/ai-image-generator',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        }
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Error generating image: ${error.message}`);
  }
}

async function fetchImageDetails(uid) {
  const url = `https://photoeditor.ai/api/v1/generate-image/${uid}/`;

  try {
    const response = await axios.get(url, {
      headers: {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "sec-ch-ua": "\"Not-A.Brand\";v=\"99\", \"Chromium\";v=\"124\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "cookie": "cf-c=NP; cf-t=1",
        "Referer": "https://photoeditor.ai/ai-image-generator",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching image details: ${error.message}`);
  }
}

async function waitForImage(uid, timeout = 60000, interval = 5000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const details = await fetchImageDetails(uid);
    if (details.status !== 'processing') {
      return details;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error('Image processing timed out');
}

app.get('/imagine69', async (req, res) => {
  const prompt = req.query.prompt || 'Cat';

  try {
    const imageData = await generateImage(prompt);
    const uid = imageData.uid;
    if (!uid) {
      throw new Error('UID not found in response from generate-image API');
    }
    const imageDetails = await waitForImage(uid);
    res.json(imageDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/ytb', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).send({ error: 'Query parameter "q" is required' });
    }

    try {
        const searchResults = await searchYouTube(query);
        const videoDetails = await Promise.all(searchResults.map(video => getVideoDetails(video.url)));
        res.json(videoDetails);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

async function searchYouTube(query) {
    const results = await ytSearch(query);
    return results.videos.slice(0, 15);
}

async function getVideoDetails(videoUrl) {
    const info = await ytdl.getInfo(videoUrl);
    const videoDetails = {
        title: info.videoDetails.title,
        thumbnail: info.videoDetails.thumbnails[0].url,
        url: videoUrl,
        downloadable_audio: ytdl.chooseFormat(info.formats, { filter: 'audioonly' }).url,
        downloadable_video: ytdl.chooseFormat(info.formats, { quality: 'highest' }).url,
        channel: info.videoDetails.author.name,
    };
    return videoDetails;
}

app.get('/executec', async (req, res) => {
  const cLangCode = req.query.code;

  if (!cLangCode) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const response = await axios.post('https://onecompiler.com/api/code/exec', {
      name: "C",
      title: "C Language Hello World",
      version: "latest",
      mode: "c_cpp",
      description: null,
      extension: "c",
      languageType: "programming",
      active: true,
      properties: {
        language: "c",
        docs: true,
        tutorials: true,
        cheatsheets: true,
        filesEditable: true,
        filesDeletable: true,
        files: [
          {
            name: "Main.c",
            content: cLangCode
          }
        ],
        newFileOptions: [
          {
            helpText: "New Text file",
            name: "sample${i}.txt",
            content: "Sample text file!"
          }
        ]
      },
      visibility: "public"
    }, {
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'authorization': 'Bearer undefined',
        'content-type': 'application/json',
        'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'cookie': '_ga=GA1.2.198543036.1723055976; _gid=GA1.2.1258452523.1723055976; _gat=1',
        'Referer': 'https://onecompiler.com/c',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/gemini', async (req, res) => {
  try {
    const prompt = req.query.prompt;
    const imageUrl = req.query.imageUrl;

    if (!prompt) {
      return res.status(400).send({ error: 'Prompt query parameter is required' });
    }

    let result;
    if (imageUrl) {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');

      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/png'
          }
        }
      ]);
    } else {
      result = await model.generateContent(prompt);
    }

    const generatedResponse = await result.response;
    const text = await generatedResponse.text();

    res.send({ generatedText: text });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

const downloadMedia = async (url) => {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  return response.data;
};

// Function to send file to Discord webhook
const sendToDiscord = async (mediaStream, fileName) => {
  const webhookUrl = 'https://discord.com/api/webhooks/1271489651491864769/KRjprYi50iAff-J7k5vtq1_ShVGKKG2NLILKnTlcNRYqaki617xeJ5bSbDGN8WvRKUqd';
  const formData = new FormData();
  formData.append('file', mediaStream, fileName);

  try {
    const response = await axios.post(webhookUrl, formData, {
      headers: formData.getHeaders(),
    });
    console.log('File uploaded successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error.response ? error.response.data : error.message);
    throw error;
  }
};

app.get('/discord', async (req, res) => {
  const mediaUrl = req.query.mediaUrl;
  if (!mediaUrl) {
    return res.status(400).send('No mediaUrl provided.');
  }

  const fileName = mediaUrl.split('/').pop();

  try {
    const mediaStream = await downloadMedia(mediaUrl);
    const discordResponse = await sendToDiscord(mediaStream, fileName);
    res.status(200).send({
      message: 'File is being uploaded to Discord.',
      fileDetails: {
        originalName: fileName,
      },
      discordResponse,
    });
  } catch (error) {
    res.status(500).send('Error uploading file to Discord.');
  }
});

app.get('/usertik', async (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).send('Username query parameter is required');
  }

  try {
    const response = await axios.post('https://tikwm.com/api/user/posts', new URLSearchParams({
      unique_id: username,
      count: '100',
      cursor: '0',
      web: '1',
      hd: '1'
    }), {
      headers: {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': 'current_language=en',
        'Referer': 'https://tikwm.com/',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });

    const data = response.data.data.videos.map(video => ({
      title: video.title,
      cover: `https://tikwm.com${video.cover}`,
      wmplay: `https://tikwm.com${video.wmplay}`
    }));

    res.json(data);
  } catch (error) {
    console.error('Error fetching TikTok user posts:', error);
    res.status(500).send('Internal Server Error');
  }
});

const githubAPIurl = 'https://api.github.com/repos/milan2nd/upload69/contents/cacheImages/';
const githubToken = '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';

const CUSTOM_DOMAIN_URL = 'https://www.milanb.com.np/cacheImages/';

app.use(express.json());

const downloadImage = async (imageUrl) => {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    return response.data;
  } catch (error) {
    console.error(`Error downloading image from URL: ${imageUrl}`);
    console.error(error);
    throw new Error('Failed to download image.');
  }
};

const generateFilename = (originalName) => {
  const dateNow = new Date().toISOString().replace(/[:.]/g, '-');
  const fileExtension = path.extname(originalName);
  const baseName = path.basename(originalName, fileExtension);
  return `${baseName}-${dateNow}${fileExtension}`;
};

app.get('/upload69', async (req, res) => {
  const { imageUrl } = req.query;

  if (!imageUrl) {
    return res.status(400).send('Image URL is required.');
  }

  try {
    const imageBuffer = await downloadImage(imageUrl);
    const fileName = generateFilename(path.basename(new URL(imageUrl).pathname));

    const base64Image = imageBuffer.toString('base64');

    const data = {
      message: `Upload ${fileName}`,
      content: base64Image,
    };

    const uploadUrl = `${githubAPIurl}${fileName}`;
    await axios.put(uploadUrl, data, {
      headers: {
        Authorization: `token ${githubToken}`,
        'Content-Type': 'application/json',
      },
    });

    const rawUrl = `${CUSTOM_DOMAIN_URL}${fileName}`;
    res.json({ url: rawUrl });
  } catch (error) {
    console.error(`Error uploading image to GitHub. URL: ${imageUrl}`);
    console.error(error);
    res.status(500).send('Error downloading or uploading image.');
  }
});

const githubUrlAPI = 'https://api.github.com/repos/milan2nd/upload69/contents/';

const CUSTOM_DOMAIN = 'www.milanb.com.np';

function generateRandomString(length) {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
}

app.get('/sharecode', async (req, res) => {
    const { sharecodes, filename } = req.query;

    if (!sharecodes) {
        return res.status(400).send('The sharecodes parameter is required.');
    }

    try {
        const fileName = filename ? `${filename}.txt` : `${generateRandomString(16)}.txt`;
        const base64Content = Buffer.from(sharecodes).toString('base64');

        const githubUrl = githubUrlAPI + `sharecodes/${fileName}`;

        await axios.put(githubUrl, JSON.stringify({
            message: 'Upload text file',
            content: base64Content
        }), {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
            }
        });

        const url = `https://${CUSTOM_DOMAIN}/sharecodes/${fileName}`;
        res.json({ url });

    } catch (error) {
        console.error('Error uploading text file:', error);
        res.status(500).send('Error uploading text file.');
    }
});

app.get('/igstory', async (req, res) => {
    const username = req.query.username;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const response = await axios.get(`https://api-ig.storiesig.info/api/story?url=https://www.instagram.com/stories/${username}/`, {
            headers: {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9",
                "sec-ch-ua": "\"Not-A.Brand\";v=\"99\", \"Chromium\";v=\"124\"",
                "sec-ch-ua-mobile": "?1",
                "sec-ch-ua-platform": "\"Android\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "Referer": "https://storiesig.info/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch story' });
    }
});

const models = [
  "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
  "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
  "https://api-inference.huggingface.co/models/alvdansen/frosting_lane_flux",
  "https://api-inference.huggingface.co/models/VideoAditor/Flux-Lora-Realism",
  "https://api-inference.huggingface.co/models/digiplay/AbsoluteReality_v1.8.1",
  "https://api-inference.huggingface.co/models/cagliostrolab/animagine-xl-3.1",
  "https://api-inference.huggingface.co/models/WizWhite/wizard-s-vintage-board-games",
  "https://api-inference.huggingface.co/models/alvdansen/BandW-Manga",
  "https://api-inference.huggingface.co/models/alvdansen/frosting_lane_redux",
  "https://api-inference.huggingface.co/models/alvdansen/archfey_anime",
  "https://api-inference.huggingface.co/models/alvdansen/m3lt",
  "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2",
  "https://api-inference.huggingface.co/models/alvdansen/phantasma-anime",
  "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
  "https://api-inference.huggingface.co/models/alvdansen/midsommarcartoon",
  "https://api-inference.huggingface.co/models/hakurei/waifu-diffusion"
];

app.get('/flux', async (req, res) => {
  const inputs = req.query.inputs;
  const modelQuery = req.query.model;
  const modelIndex = parseInt(modelQuery, 10);

  const modelUrl = models[!isNaN(modelIndex) && modelIndex >= 0 && modelIndex < models.length ? modelIndex : 0];

  try {
    const response = await axios.post(
      modelUrl,
      { inputs: inputs },
      {
        headers: {
          "Authorization": "Bearer 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",
          "Content-Type": "application/json"
        },
        responseType: 'stream'
      }
    );

    res.setHeader('Content-Type', 'image/png');
    response.data.pipe(res);
  } catch (error) {
    console.error('Error querying model:', error);
    res.status(500).json({ error: 'Failed to query model' });
  }
});

app.get('/milanbhandari', async (req, res) => {
  try {
    const { data } = await axios.get('https://www.milan-bhandari.com.np/');
    const $ = cheerio.load(data);

    const blogs = [];

    $('article.blog[data-page="blog"] .blog-posts-list .blog-post-item').each((index, element) => {
      const title = $(element).find('header h2.article-title').text().trim();
      const url = $(element).find('a').attr('href');
      const imgSrc = $(element).find('figure.blog-banner-box img').attr('src');
      const category = $(element).find('.blog-meta .blog-category').text().trim();
      const time = $(element).find('.blog-meta time').text().trim();
      const itemTitle = $(element).find('h3.blog-item-title').text().trim();
      const blogText = $(element).find('.blog-text').text().trim();

      blogs.push({
        index,
        title,
        url,
        imgSrc,
        category,
        time,
        itemTitle,
        blogText,
      });
    });

    res.json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while scraping the website.');
  }
});

app.get('/ai2', (req, res) => {
try {
    const query = req.query.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required.' });
    }

    const apiUrl = 'https://api.deepinfra.com/v1/openai/chat/completions';
    const headers = {
    'accept': 'text/event-stream',
       'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
       'content-type': 'application/json',
       'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
       'sec-ch-ua-mobile': '?1',
       'sec-ch-ua-platform': '"Android"',
       'sec-fetch-dest': 'empty',
       'sec-fetch-mode': 'cors',
       'sec-fetch-site': 'same-site',
       'x-deepinfra-source': 'web-embed',
       'Referer': 'https://deepinfra.com/',
       'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

    const requestData = {
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
      messages: [
  {
    role: 'system',
    content: 'Be a helpful assistant'
  },
  { 
    role: 'user', 
    content: query 
  },
      ],
      stream: false,
    };

axios.post(apiUrl, requestData, { headers })
      .then(response => {
        res.json(response.data);
      })
      .catch(error => {
        res.status(500).json({ error: error.message });
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const baseUrl = 'https://asurascanslation.com/?s=';

app.get('/manga', async (req, res) => {
    const query = req.query.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const { data } = await axios.get(`${baseUrl}${encodeURIComponent(query)}`);
        const $ = cheerio.load(data);

        const results = [];

        $('div.bs').each((i, element) => {
            const link = $(element).find('a').attr('href');
            const title = $(element).find('a').attr('title');
            const imageUrl = $(element).find('img').attr('src');
            const episodes = $(element).find('div.epxs').text().trim();

            results.push({
                title,
                link,
                imageUrl,
                episodes 
            });
        });

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Error scraping the website' });
    }
});

app.get('/details', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const details = {};

        $('.tsinfo.bixbox .imptdt').each((i, element) => {
            const text = $(element).text().trim();
            const keyMatch = text.match(/^(.+?)\s*\/\/\s*there\s*should\s*be\s*=.*$/);
            const valueMatch = text.match(/\/\/\s*there\s*should\s*be\s*=\s*(.*)$/);

            if (keyMatch && valueMatch) {
                const key = keyMatch[1].trim();
                const value = valueMatch[1].trim();
                details[key] = value;
            }
        });

        details.title = $('.info-desc .entry-title').text().trim();
        details.genres = $('.wd-full .mgen a').map((i, el) => $(el).text().trim()).get();
        details.description = $('.entry-content.entry-content-single p').text().trim();
        
        const chapters = [];
        $('#chapterlist li').each((i, element) => {
            const chapterNum = $(element).attr('data-num');
            const chapterLink = $(element).find('a').attr('href');
            const chapterTitle = $(element).find('.chapternum').text().trim();
            const chapterDate = $(element).find('.chapterdate').text().trim();

            chapters.push({
                chapterNum: parseInt(chapterNum, 10), // Convert chapter number to integer
                chapterLink,
                chapterTitle,
                chapterDate
            });
        });

        details.chapters = chapters.sort((a, b) => a.chapterNum - b.chapterNum);

        res.json(details);
    } catch (error) {
        res.status(500).json({ error: 'Error scraping the details page' });
    }
});

const decodeUrl = (url) => url.replace(/\\\//g, '/');

const generateAllImageUrls = (baseUrl, highestNumber) => {
    const urls = [];
    for (let i = highestNumber; i >= 1; i--) {
        urls.push(`${baseUrl}${i}.webp`);
    }
    return urls;
};

const extractImageUrlsAndBaseUrl = (scriptContent) => {
    const imageUrls = [];
    let baseUrl = '';
    const imageRegex = /"images":\[\s*(?:(?:["'](.*?)["']\s*,\s*)*["'](.*?)["']\s*)?\]/g;
    let match;

    while ((match = imageRegex.exec(scriptContent)) !== null) {
        if (match[1]) imageUrls.push(decodeUrl(match[1]));
        if (match[2]) imageUrls.push(decodeUrl(match[2]));
    }

    if (imageUrls.length > 0) {
        baseUrl = imageUrls[0].split('/').slice(0, -1).join('/') + '/';
    }

    return { imageUrls, baseUrl };
};

app.get('/chapter', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const scriptContent = $('script').filter(function() {
            return $(this).html().includes('ts_reader.run');
        }).html();

        if (!scriptContent) {
            return res.status(404).json({ error: 'ts_reader.run script not found' });
        }
        
        const { imageUrls, baseUrl } = extractImageUrlsAndBaseUrl(scriptContent);

        if (imageUrls.length === 0) {
            return res.status(404).json({ error: 'No images found in the chapter' });
        }

        const highestNumber = Math.max(...imageUrls.map(url => {
            const match = url.match(/(\d+)\.webp$/);
            return match ? parseInt(match[1], 10) : 0;
        }));

        const allImageUrls = generateAllImageUrls(baseUrl, highestNumber);

        res.json({
            images: allImageUrls
        });
    } catch (error) {
        res.status(500).json({ error: 'Error scraping the chapter page' });
    }
});

app.get('/squadbusters', async (req, res) => {
    const uid = req.query.uid;
    if (!uid) {
        return res.status(400).json({ error: 'uid parameter is required' });
    }

    try {
        const response = await axios.get(`https://squrs.com/profile/${uid}`);
        const html = response.data;

        const $ = cheerio.load(html);

        const name = $('.text-2xl.font-bold').first().text().trim();
        const uidFromHtml = $('.text-2xl.font-bold a').first().text().trim();

        const levelText = $('.flex.flex-col.space-y-1.5.p-5').first().find('.font-bold').text().trim();
        const levelMatch = levelText.match(/(\d+)\s*\/\s*(\d+)\s*(\d+(\.\d+)?)%/);
        const level = levelMatch ? levelMatch[0] : null;

        const experienceText = $('.flex.flex-col.space-y-1.5.p-5').eq(1).find('.font-bold').text().trim();
        const experienceMatch = experienceText.match(/(\d{1,3}(,\d{3})*)\s*\/\s*(\d{1,3}(,\d{3})*)\s*(\d+(\.\d+)?)%/);
        const experience = experienceMatch ? experienceMatch[0] : null;

        const portalEnergyText = $('.flex.flex-col.space-y-1.5.p-5').eq(2).find('.font-bold').text().trim();
        const portalEnergyMatch = portalEnergyText.match(/(\d{1,3}(,\d{3})*)\s*\/\s*(\d{1,3}(,\d{3})*)\s*(\d+(\.\d+)?)%/);
        const worldJourney = portalEnergyMatch ? portalEnergyMatch[0] : null;

        const top1Text = $('.flex.flex-col.space-y-1.5.p-5').eq(3).find('.font-bold').text().trim();
        const top3Text = $('.flex.flex-col.space-y-1.5.p-5').eq(4).find('.font-bold').text().trim();
        const partyText = $('.flex.flex-col.space-y-1.5.p-5').eq(5).find('.font-bold').text().trim();

        const battleChestsOpenedText = $('.flex.flex-col.space-y-1.5.p-5').eq(6).find('.font-bold').text().trim();
        const lastChestText = $('.flex.flex-col.space-y-1.5.p-5').eq(7).find('.font-bold').text().trim();
        
        const nextChestText = $('.flex.flex-col.space-y-1.5.p-5').eq(8).find('.font-bold').text().trim();
        
        const upcomingEpicChestsText = $('.text-2xl.font-bold').eq(5).text().trim();
        const upcomingEpicChestsCountText = $('h3.text-2xl.font-bold.text-center').first().text().trim();

        const upcomingEpicChests = upcomingEpicChestsCountText.replace('+', '').trim();
        const extractedData = {
            Name: name,
            Uid: uidFromHtml || uid,
            Lvl: level,
            "Exp Ivl": experience,
            "World journey (PE)": worldJourney,
            "Battle stats": {
                "Top 1": top1Text,
                "Top 3": top3Text,
                "Party": partyText
            },
            "Chest Cycle": {
                "Battle chests opened": battleChestsOpened,
                "Last chest in cycle": lastChestInCycle
            }
        };

        res.json(extractedData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
});

app.get('/sb', async (req, res) => {
    const uid = req.query.uid;
    if (!uid) {
        return res.status(400).json({ error: 'uid parameter is required' });
    }

    try {
        const response = await axios.get(`https://squrs.com/profile/${uid}`);
        const html = response.data;

        const $ = cheerio.load(html);

        const name = $('.text-2xl.font-bold').first().text().trim().split(' (')[0]; // Extract only the name part
        const uidFromHtml = $('.text-2xl.font-bold a').first().text().trim().split('(')[1].split(')')[0]; // Extract uid without parentheses
        const xpLevel = $('.grid.grid-cols-3.py-2').eq(0).find('.font-bold').text().trim();
        const xpTotal = $('.grid.grid-cols-3.py-2').eq(1).find('.font-bold').text().trim();

        // Extract portal energy text
        const portalEnergy = $('.grid.grid-cols-3.py-2').find('.font-bold').eq(0).text().trim();

        // Get the Squad League details and remove label "Squad League:"
        const squadLeague = $('.grid.grid-cols-2.py-2').find('.font-bold').eq(0).text().trim();
        // Extract battle stats Top 1, Top 3, and Party text

	const top1 = $("div:contains('Top 1')").next().find('.font-bold').text().trim();
        const top3 = $("div:contains('Top 3')").next().find('.font-bold').text().trim();
        const party = $("div:contains('Party')").next().find('.font-bold').text().trim();
	    
        // Extract upcoming epic chests
        const battleChestsOpened = $('.mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.xs\\:grid-cols-1.sm\\:my-4.md\\:grid-cols-1 .mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.xs\\:grid-cols-1.sm\\:my-4.md\\:grid-cols-2 .font-bold').eq(0).text().trim();
        const lastChestInCycle = $('.mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.xs\\:grid-cols-1.sm\\:my-4.md\\:grid-cols-1 .mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.xs\\:grid-cols-1.sm\\:my-4.md\\:grid-cols-2 .font-bold').eq(1).text().trim();

        const lastChestName = $('.mx-auto.my-4.grid.max-w-4xl.grid-cols-5.gap-4.px-4 .text-xs.font-bold.text-center.opacity-50').eq(0).text().trim();
        const nextChestName = $('.mx-auto.my-4.grid.max-w-4xl.grid-cols-5.gap-4.px-4 .text-xs.font-bold.text-center').eq(1).text().trim();

        const upcomingEpicChests = [];
              $('.mx-auto.my-4.grid.max-w-4xl.grid-cols-5.gap-4.px-4 .text-2xl.font-bold.text-center').each(function() {
              upcomingEpicChests.push($(this).text().trim());
         });

        const upcomingEpicChestsString = upcomingEpicChests.join(',');
	    
	    const extractedData = {
            Name: name,
            Uid: uidFromHtml,
            xpLevel: xpLevel,
            xpTotal: xpTotal,
	    portalEnergy: portalEnergy,
            squadLeague: squadLeague,
            "Battle stats": {
                "Top 1": top1,
                "Top 3": top3,
                "Party": party
            },
            "Chest Cycle": {
                "Battle chests opened": battleChestsOpened,
                "Last chest in cycle": lastChestInCycle,
	        "Last chest": lastChestName,
                "Next chest": nextChestName,
		"Upcoming Epic Chests": upcomingEpicChestsString
            }
        };

        res.json(extractedData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
});

app.get('/mocky', (req, res) => {
  const { prompt } = req.query;
  
  if (!prompt) {
    return res.status(400).json({ error: "Query parameter 'prompt' is required" });
  }

  const randomNum = Math.floor(100000000000 + Math.random() * 900000000000);

  fetch("https://api.mocky.io/api/mock", {
    headers: {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
      "sec-ch-ua": "\"Not-A.Brand\";v=\"99\", \"Chromium\";v=\"124\"",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": "\"Android\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "Referer": "https://designer.mocky.io/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    body: JSON.stringify({
      status: 200,
      content: prompt,
      content_type: "application/json",
      charset: "UTF-8",
      secret: `milan${randomNum}`,
      expiration: "never"
    }),
    method: "POST"
  })
  .then(response => response.json())
  .then(data => {
    if (data && data.link) {
      res.json({ link: data.link });
    } else {
      res.status(500).json({ error: 'Link not found in response!' });
    }
  })
  .catch(error => res.status(500).json({ error: 'Something went wrong!' }));
});

app.listen(port, "0.0.0.0", function () {
    console.log(`Listening on port ${port}`)
})       
