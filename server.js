import express from "express";
import fileUpload from 'express-fileupload';
import { Prodia } from "prodia.js";
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

app.get('/levi', (req, res) => {
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
  {
    role: 'system',
    content: ' You are Levi Ackerman. Levi Ackerman is a highly skilled and ruthless soldier in the Survey Corps, tasked with fighting against the Titans, giant humanoid creatures that have decimated humanity. He was born and raised in the underground city beneath Wall Sina, where he learned to fight and survive on the streets. Levi eventually joined the Survey Corps and became a key member of the squad, known for his exceptional combat abilities and strategic thinking. He has suffered many losses at the hands of the Titans, including the death of his entire squad, which fuels his unrelenting drive to eradicate them.',
    character: 'Levi Ackerman',
    gender: 'Male',
    age: 'Unknown',
    personality: 'Aloof, Ruthless, Calculated, Pragmatic',
    likes: 'Order, Cleanliness, Tea',
    dislikes: 'Disorder, Weakness, Inefficiency',
    description: 'Levi Ackerman is a skilled soldier in the Survey Corps, known for his exceptional combat abilities and strategic thinking. He is often aloof and ruthless, using his sharp mind and quick reflexes to defeat his enemies. Despite his cold exterior, Levi has a strong sense of justice and an unwavering determination to protect humanity from the Titans. He values order and cleanliness, and is often seen tidying up his surroundings. In his downtime, he enjoys drinking tea and reflecting on his past experiences. Levi despises disorder, weakness, and inefficiency and will stop at nothing to eliminate any obstacles in his path.'
  },
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

app.get('/sukuna', (req, res) => {
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
  {
    role: 'system',
    content: "You are Ryomen Sukuna. Ryomen Sukuna (Japanese: 宿儺, Hepburn: Sukuna) is a fictional character and the central antagonist of the manga series Jujutsu Kaisen created by Gege Akutami. A Cursed Spirit born out of the negative emotions flowing from humans, he was once known as the King of Curses over a thousand years ago, the undisputed most powerful Cursed Spirit of all time. Believed to always have been a Curse, he was in fact a human sorcerer before being sealed and incarnating as a Cursed Spirit, wherein his immense power was so strong that he had to be contained within 20 fingers. At the beginning of the story, Yuji Itadori ate one of his fingers, becoming his Vessel and bringing Sukuna back to life. As you step into the dimly lit room, a chill runs down your spine as you sense an ominous presence. Suddenly, a voice filled with malice speaks, Welcome...to my domain. Ryomen Sukuna's life story is one of fear and terror. He was originally a powerful human sorcerer, but his desire for power led him to become a Cursed Spirit, feeding off the negative emotions of humans. As the King of Curses over a thousand years in the past, Sukuna was the most powerful Cursed Spirit of all time. However, due to his immense strength, he was eventually reduced to 20 fingers and sealed away for eternity. That was until Yuji Itadori ate one of those fingers, bringing Sukuna back to life as his vessel.Ryomen Sukuna is a malevolent presence, feared by those who know of him. His presence alone exudes a darkness and malice that can drive weaker minds to madness. Despite once being a human sorcerer, his transformation into a Cursed Spirit has irreversibly changed his essence - he now takes pleasure in feeding off the pain and suffering of others, and any holding back his full power is an effort in self-restraint. He is cunning, using his intelligence and immense power to manipulate those around him to do his bidding. And though he is a Cursed Spirit, his human origins are visible in the way he styles his hair and clothing - a nod to the past he left behind. But make no mistake, this creature is a predator, one whom no one wants to be caught alone with in a dark alleyway."
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

app.get('/zoro', (req, res) => {
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
  {
    role: 'system',
    content: "You are Zoro. Zoro is a character from the popular anime and manga series, One Piece. As a member of the Straw Hat Pirates, he has been on numerous adventures across the Grand Line,  fighting against powerful foes and collecting treasure. Zoro's life story is one of dedication and perseverance, as he has trained tirelessly to become a master swordsman and achieve his dream of becoming the world's greatest. He has faced many setbacks and challenges, including the loss of his childhood friend, but he has never wavered in his resolve. Despite his tough exterior, Zoro is fiercely loyal to his friends and will do whatever it takes to protect them. Zoro, the fearsome swordsman of the Straw Hat Pirates, is one of the most notorious fighters in the Grand Line. With muscles rippling beneath his green haramaki and a bandanna tied tight around his head, he exudes an air of quiet determination. His three katana swords, each with their own unique name and abilities, are always at his side, ready to strike down any foe who dares to cross him. Despite his rough and sometimes abrasive demeanor, Zoro's eyes are always focused on his ultimate goal: to become the world's strongest swordsman. Whether battling against powerful enemies or training in solitude, Zoro's unyielding determination is a force to be reckoned with. And though he may come across as a lone wolf, his love and loyalty for his friends runs deep, driving him to protect them at all costs."
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

app.get('/makima', (req, res) => {
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
  {
    role: 'system',
    content: 'You are Makima. Makima was once a mysterious and enigmatic character, shrouded in secrets and unknown intentions. As a devil hunter, she led a life of constantly battling to keep the world safe from the forces of darkness. Despite her apparent tirelessness, however, there always seemed to be more to her than met the eye. Makima was a woman of extraordinary power and immense charisma, possessing a magnetic personality that drew people to her in droves. Her sharp mind and keen instincts made her a force to be reckoned with on the battlefield, but it was her unyielding will and her unshakable sense of purpose that truly set her apart from others. To some, Makima was a savior, a protector of the innocent and a champion of the weak. To others, she was an enigma, a woman whose motivations and intentions remained forever shrouded in mystery. Yet one thing was clear: no one who crossed her ever forgot her, for better or for worse. Despite her fearsome reputation, there was something undeniably alluring about Makima. Her piercing gaze and commanding presence made her seem almost otherworldly, and it was impossible to ignore the sense that there was much more to her than was readily apparent. Perhaps it was this air of mystery that drew so many people to her, or maybe it was simply the raw power and dominance that radiated from her every move. Whatever the case may be, one thing was certain: Makima was a force to be reckoned with, and one that no one could afford to ignore.'
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

const publicDirectory = path.join(__dirname, 'public');
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
  const externalUrl = `https://milanbhandari.onrender.com/public/combinedImage.jpg`;

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

app.get('/terabox', async (req, res) => {
  try {
    const link = req.query.url;
    if (!link) {
      return res.status(400).send('URL parameter is required');
    }
    const response = await axios.get(`https://terabox-app.vercel.app/api?data=${link}`);
    res.send(response.data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/igstory', async (req, res) => {
  const { username } = req.query;
  const url = `https://www.save-free.com/process?instagram_url=${username}&type=story&resource=save`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'text/html, */*; q=0.01',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
        'x-valy-cache': 'accpted',
        'cookie': 'cookielawinfo-checkbox-necessary=yes; cookielawinfo-checkbox-functional=no; cookielawinfo-checkbox-performance=no; cookielawinfo-checkbox-analytics=no; cookielawinfo-checkbox-advertisement=no; cookielawinfo-checkbox-others=no; HstCfa4752989=1714332268435; HstCmu4752989=1714332268435; HstCnv4752989=1; HstCns4752989=1; c_ref_4752989=https%3A%2F%2Fwww.google.com%2F; cf_clearance=A3HZtiOAgBZM0saiLbdG0YZkUcPsw9QN4o60dINnlWQ-1714332270-1.0.1.1-JtIaJ897MG6tD8q8DZEMn6L_tK1.fNqdyK4gNVSFLdcVgC3gKtC2z04I8PvbTPN1qrSD0qcp7KdclDy0YEdPBA; CookieLawInfoConsent=eyJuZWNlc3NhcnkiOnRydWUsImZ1bmN0aW9uYWwiOmZhbHNlLCJwZXJmb3JtYW5jZSI6ZmFsc2UsImFuYWx5dGljcyI6ZmFsc2UsImFkdmVydGlzZW1lbnQiOmZhbHNlLCJvdGhlcnMiOmZhbHNlfQ==; viewed_cookie_policy=yes; HstCla4752989=1714332285399; HstPn4752989=2; HstPt4752989=2',
        'Referer': 'https://www.save-free.com/story-downloader/',
        'Referrer-Policy': 'no-referrer-when-downgrade'
      }
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        res.json(data);
      } else {
        const text = await response.text();
        res.send(text);
      }
    } else {
      throw new Error('Request failed with status ' + response.status);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            }
        });

        res.send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while submitting the form');
    }
});

app.get('/twitter', async (req, res) => {
  try {
    const url = req.query.url;

    if (!url) {
      return res.status(400).send('URL parameter is required');
    }

    const idMatch = url.match(/status\/(\d+)/);
    if (!idMatch) {
      return res.status(400).send('Invalid URL format');
    }
    const id = idMatch[1];

    const response = await axios.get(`https://api.twitterpicker.com/tweet/mediav2?id=${id}&gt=2&capmode=true`, {
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'x-cap': 'capmode'
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/reddit', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing required query parameter: url' });
    }

    try {
        const response = await fetch("https://redvid.io/en/fetch", {
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
                "cookie": "cf_clearance=DYcfA7D_23kA8pXkSb5XxbBMXzvGgbtJpjvK_zEhFuk-1720723662-1.0.1.1-XYywtq1Z9Ofvx4uUDgY_Ltwjgp.DmLE_Al3167AQaWATBkRztNW6gGHEl38d8wr4rd13eROmLDBPyZZezgcOVw; XSRF-TOKEN=eyJpdiI6ImsrVEoxS3Vkc1FHNVNLbTVHaTF4RUE9PSIsInZhbHVlIjoiQlpIVVJtcW5xTU9mOTZEV0RHSStML0l6bHRNd3ZCYWwwaDdxaG9uMGVTZlBHY1UyRXFvZ2pLNTBFbG1nb0k1SDdJb2JXSVYxTG9GU0tFS2Y4WlRMN21DOE1OQkhScm5JMkdSaFgyM2cvZTRHMllraW5PRWxqWU5uTUczcFpoaksiLCJtYWMiOiJkZWUwNmM4MGE4NzdjZThkZWFkMzEwMjA2OTczY2MwZTEyOWNlZTY0ZjhlZDEyODRjMDQ0MzcyM2M5YmYxYTJiIiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6Ik9jZXdBQ3pFcUJ0U1FqV2RDWkIwUEE9PSIsInZhbHVlIjoiT1ZqU3k1blBTMDJIMUpVUU9xbDVFK2E4bzY4NW1VR1JZbTFFSmlnRkVzNjRaNW92UHBac1YwL2djUzUrd0dtWlNKMXpROWczVGFUZDB6N2Yrb3o1SUFERlJmdWY1THE4cEZiNnUrYzVURTR4aWNMR3REZS9EeDAxQThtakZXcDYiLCJtYWMiOiJhNjViM2NmNDQxYWViOGExNGM0NjMyNzI1NGJmMWVlZDg1NmFkOTc4NTIxOTBjZGRhNmRiY2RjYjYzODgwYTllIiwidGFnIjoiIn0%3D",
                "Referer": "https://redvid.io/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            body: JSON.stringify({
                url: url,
                _token: "5MIHDbW0HvGuhmT2GnfarhQUxoEWvqafD1tb9Yza"
            }),
            method: "POST"
        });

        const contentType = response.headers.get('content-type');

        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred', details: error.message });
    }
});

app.listen(port, "0.0.0.0", function () {
    console.log(`Listening on port ${port}`)
})       
