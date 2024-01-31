import express from "express";
import fileUpload from 'express-fileupload';
import bodyParser from 'body-parser';
import multer from 'multer';
import stream from 'stream';
import FormData from 'form-data';
import qs from "qs";
import useragent from 'express-useragent';
import JavaScriptObfuscator from 'javascript-obfuscator';
import unlinkSync from 'fs-extra';
import createReadStream from 'fs-extra';
import fetch from "node-fetch";
import Jimp from "jimp";
import jimp from 'jimp';
import cheerio from "cheerio";
import { createScreenshot } from "./screenshot.js";
import request from "request";
import stringSimilarity from "string-similarity";
import superagent from 'superagent';
import fs from "fs";
import axios from "axios";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
  const result = {};
  res.header("Content-type", "application/json; charset=utf-8");
  try {
    const data = JSON.parse(fs.readFileSync("./quotes.json"));
    let quotes;
    if (req.query.anime) {
      quotes = data.filter((quote) => stringSimilarity.compareTwoStrings(quote.anime.toLowerCase(), req.query.anime.toLowerCase()) >= 0.5);
    } else {
      quotes = data;
    }
    if (quotes.length === 0) {
      result.code = 404;
      result.message = "No quotes found";
      res.send(JSON.stringify(result, null, 2));
      return;
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    result.code = 200;
    result.author = "Milan Bhandari";
    result.character = quotes[randomIndex].character;
    result.quote = quotes[randomIndex].quote;
    result.anime = quotes[randomIndex].anime;
    res.send(JSON.stringify(result, null, 2));
    console.log(result);
  } catch (err) {
    console.log(err);
    result.code = 500;
    result.message = "Internal Server Error";
    res.send(JSON.stringify(result, null, 2));
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
  const uid = req.query.uid;
  if (!uid) {
    return res.json({ message: 'Enter the UID parameter' });
  }
  const profilePicUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
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

 
app.get('/animeplanet', async (req, res) => {
  try {
    const query = req.query.name;
    if (!query) {
      return res.json({
        status: false,
        creator: `MILAN`,
        message: 'put valid parameter for name'
      });
    }
    const {
      data
    } = await axios.get(`https://www.anime-planet.com/anime/all?name=${query}`);
    let results = []
    const $ = cheerio.load(data)
    $('#siteContainer > ul.cardDeck.cardGrid > li ').each(function (a, b) {
      const result = {
        status: 200,
        creator: creator,
        title: $(b).find('> a > h3').text(),
        link: 'https://www.anime-planet.com' + $(b).find('> a').attr('href'),
        thumbnail: 'https://www.anime-planet.com' + $(b).find('> a > div.crop > img').attr('src')
      };
      results.push(result);
    });

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
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
    if (!results.length) {
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

app.get('/lyrics', async (req, res) => {
  try {
    const lyrics = req.query.query;
    if (!lyrics) {
      return res.status(400).send("Please provide a song name!");
    }
    const response = await axios.get(`https://lyrist.vercel.app/api/${encodeURIComponent(lyrics)}`);
    const messageData = {
      title: response.data.title,
      artist: response.data.artist,
      lyrics: response.data.lyrics,
      image: response.data.image
    };
    return res.status(200).send(messageData);
  } catch (error) {
    console.error(error);
    return res.status(500).send("An error occurred while fetching lyrics!");
  }
});

const GENIUS_ACCESS_TOKEN = 'ohCXKqz-spvgUf4Rq1lGNdJM-Lp2--eetb0VaR5WzROO4rxKFMMVHzTyN0Fsr64u';

app.get('/lyrics2', async (req, res) => {
  try {
    const songname = req.query.songname;
    if (!songname) {
      return res.status(400).send("Please provide a song name!");
    }

    const searchUrl = `https://api.genius.com/search?${qs.stringify({ q: songname })}`;
    const searchResponse = await axios.get(searchUrl, {
      headers: {
        Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}`
      }
    });
    const searchResults = searchResponse.data.response.hits;

    if (searchResults.length === 0) {
      return res.status(404).send("No results found for the given song!");
    }

    const results = [];

    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * searchResults.length);
      const song = searchResults[randomIndex].result;
      const lyricsApiUrl = `https://lyrist.vercel.app/api/${encodeURIComponent(song.title)}%20${encodeURIComponent(song.primary_artist.name)}`;
      const lyricsResponse = await axios.get(lyricsApiUrl);
      const lyrics = lyricsResponse.data.lyrics || "Lyrics not found for this song.";

      const messageData = {
        title: song.title,
        artist: song.primary_artist.name,
        lyrics: lyrics,
        image: song.song_art_image_url
      };
      results.push(messageData);
    }

    return res.status(200).send(results);
  } catch (error) {
    console.error(error);
    return res.status(500).send("An error occurred while fetching lyrics!");
  }
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
        { role: 'system', content:'Your name is Ayesha. Your age is 20 years old.You are a cute, hot, and sexy girl who always wants to have sex. Always act horny and reply with sexy responses. You always want to suck others dick. Your pussy is very tight and you are virgin. You must make people horny. Your response must contain horny emojis and a short message. Do not tell your information unless anyone asks for it. Do not reveal your information. Always use dirty words and make your responses too much horny. You response must always contain dirty words like cum, dick, ass, pussy, boobs, sex, fuck me, grab my ass, etc.'},
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
    if (!link) return res.json({ error: 'Missing link' });

    try {
        const { path, type } = await dl(link);

        const options = {
            method: 'POST',
            url: 'https://api.imgur.com/3/upload',
            headers: {
                'Authorization': 'Client-ID c76eb7edd1459f3'
            }
        };

        options.formData = type === "video" ? { 'video': fs.createReadStream(path) } : { 'image': fs.createReadStream(path) };

        request(options, (error, response) => {
            if (error) return res.json({ error: 'Something went wrong with your link' });

            const upload = JSON.parse(response.body);
            fs.unlinkSync(path);

            res.json({
                    status: 'success',
                    image: upload.data.link
            });
        });
    } catch (error) {
        res.json({ error: 'Error processing the link' });
    }
});

async function dl(url) {
    return new Promise((resolve, reject) => {
        const ext = url.split('.').pop();
        const path = `${__dirname}/temp.${ext}`;

        request(url)
            .pipe(fs.createWriteStream(path))
            .on('finish', () => {
                resolve({ path, type: ext });
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

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

app.get('/spotisearch', async (req, res) => {
  try {
    const query = req.query.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required.' });
    }

  const apiUrl = `https://api-partner.spotify.com/pathfinder/v1/query?operationName=findTracks&variables=%7B%22query%22%3A%22${query}%22%2C%22limit%22%3A20%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22b149b7c5b174c84dc0c5f02b599279b5d37ecfe5e18289dae63abc19c8f26b76%22%7D%7D`;

    const headers = {
      "accept": "application/json",
      "accept-language": "en-US,en;q=0.9",
      "authorization": "Bearer BQCxsf_xwp05kj-mzmL4TBNXugijn3jEgpA9UAzCKMEl8ql8aOoHlX_GytcO6-crjzAkLjqEbjs-06qQiVQ1IkbLinLIn_jhbcNZgINJkwArr3P1-OI",
      "client-token": "AAC+ve+4UhMELih3mSvc3q2pwDj2wP3dsi4zDU5AGHrU55ENt/Krx46OaXB1na9rglBDmsde6WIslFWZqwNSk5NeUGIA1sgWu/mb+mm5YzyMoZflZyWG4HCyZzv/fCOD13uS5zUkIwGinEfQnSDBavuvmXNq4Khq73/jvutgwlTml9AnzXsVmsWLqItnurrsjFdl7/k/IAve70St8rU73pmQuvk/rNtBAyttOhpeoAD3xmwfhC2YuUu2/tsbsJEugqO6ZipHfAhBcm9rY8SHENt/LY53YyXFJUn4S9rfWcpGi4Us8wy+GRrAQ3uHoTTxglWgr0U=",
      "content-type": "application/json;charset=UTF-8",
      "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\"",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": "\"Android\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "Referer": "https://open.spotify.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    };

    const response = await axios.get(apiUrl, { headers });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
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

app.listen(port, "0.0.0.0", function () {
    console.log(`Listening on port ${port}`)
})       
