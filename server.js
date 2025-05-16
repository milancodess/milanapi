const express = require("express");
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const unlinkSync = require('fs-extra').unlinkSync;
const createReadStream = require('fs-extra').createReadStream;
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const request = require("request");
const stringSimilarity = require("string-similarity");
const { fetchQueryDetails, fetchLyrics } = require('searchlyrics');
const superagent = require('superagent');
const fs = require("fs");
const axios = require("axios");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { fileURLToPath } = require("url");
const { URL } = require('url');
const port = process.env.PORT || 5000;
const app = express();

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

app.get("/mus", (req, res) => {
res.sendFile(path.join(__dirname, "dashboard", "mus.html"));
});

const CLIENTS = [
  { id: 'f3335b183f444e44a68ab7a6c886dbb1', secret: '51306a1a768746459321ff76f88a0c39' },
  { id: '9494f343828f45d39e4192f7581a9659', secret: 'd26adca0eb894a27b1c80522e29323c7' },
  { id: '8fbc0a797ed1406581d028150cdb35cc', secret: 'c2945ec3875349e69fd37f5f109cbd3b' },
  { id: '65e55cd971bf4c17b2437774342081e4', secret: 'fe71a7ee17c5474eb9f1e3062cc61178' },
  { id: '86d2fcb26ab14685873830c077fc4be4', secret: '240ff41427bd45caac4b67899126c8d2' },
  { id: 'cf6bf55848ef46e29ff31ea13a0e9c96', secret: '275e6a80c7254c88bad5e11201cb8e3b' },
  { id: 'e83326995c994916baa1f5dd00140932', secret: '0f70aa2161eb497ea5dd748a32f70b91' },
  { id: 'b18b2492fe0b42b0800a8c3dd9610d8b', secret: '6449122bba814945ad1747c9914c5318' },
  { id: '68e6cec2672649f7ba6a9ffc3afa8376', secret: '43ff7ca2d24440ed97349ddf81cf0345' },
  { id: '965a198e6d7f47be827cfb55a7eede6c', secret: 'e16c27d2566c4a48821b58c3a3a04e60' },
];

function msToMinutesAndSeconds(duration_ms) {
  const minutes = Math.floor(duration_ms / 60000);
  const seconds = ((duration_ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${(seconds < 10 ? '0' : '')}${seconds}`;
}

function extractIdAndType(url) {
  const regex = /(track|playlist)\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  if (match) {
    return {
      type: match[1],
      id: match[2]
    };
  }
  throw new Error('Invalid Spotify URL');
}

async function getAccessTokenWithFallback(index = 0) {
  if (index >= CLIENTS.length) throw new Error('All client credentials are rate-limited or failed');

  const { id, secret } = CLIENTS[index];

  try {
    const tokenResponse = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      params: {
        grant_type: 'client_credentials'
      },
      headers: {
        'Authorization': 'Basic ' + Buffer.from(id + ':' + secret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return tokenResponse.data.access_token;
  } catch (err) {
    if (err.response && err.response.status === 429) {
      console.warn(`Rate limited on client index ${index}, trying next...`);
      return await getAccessTokenWithFallback(index + 1);
    } else {
      console.error(`Error with client index ${index}:`, err.message);
      return await getAccessTokenWithFallback(index + 1);
    }
  }
}

async function getTrackDetails(trackId, accessToken) {
  const url = `https://api.spotify.com/v1/tracks/${trackId}`;
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const track = response.data;
  return {
    name: track.name,
    artist: track.artists.map(artist => artist.name).join(', '),
    release_date: track.album.release_date,
    duration: msToMinutesAndSeconds(track.duration_ms),
    link: track.external_urls.spotify,
    image_url: track.album.images.length > 0 ? track.album.images[0].url : null
  };
}

async function getPlaylistDetails(playlistId, accessToken) {
  const url = `https://api.spotify.com/v1/playlists/${playlistId}`;
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const playlist = response.data;
  return {
    name: playlist.name,
    description: playlist.description,
    owner: playlist.owner.display_name,
    tracks: playlist.tracks.items.map(item => ({
      name: item.track.name,
      artist: item.track.artists.map(artist => artist.name).join(', '),
      duration: msToMinutesAndSeconds(item.track.duration_ms),
      link: item.track.external_urls.spotify
    })),
    image_url: playlist.images.length > 0 ? playlist.images[0].url : null
  };
}

app.get('/getDetails', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('URL query parameter is required');
  }

  try {
    const { type, id } = extractIdAndType(url);

    const accessToken = await getAccessTokenWithFallback();

    let details;
    if (type === 'track') {
      details = await getTrackDetails(id, accessToken);
    } else if (type === 'playlist') {
      details = await getPlaylistDetails(id, accessToken);
    } else {
      return res.status(400).send('Invalid URL type. Only track or playlist URLs are supported.');
    }

    res.json(details);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
		       
async function scrapeSearchResults(query) {
  const url = `https://ww25.soap2day.day/search/${encodeURIComponent(query)}`;
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const results = [];

    const sections = ['#movies .ml-item', '#tvshows .ml-item'];

    sections.forEach((selector) => {
      const isTv = selector.includes('tv');

      $(selector).each((_, el) => {
        const element = $(el);
        const title = element.find('.h2').text().trim();
        if (!title.toLowerCase().includes(query.toLowerCase())) return;

        const anchor = element.find('a');
        const link = anchor.attr('href');
        const image = anchor.find('img').attr('data-original')?.trim();
        const imdb = element.find('.imdb').text().trim();
        const episode = element.find('.mli-eps i').text().trim();

        const hiddenTip = element.find('#hidden_tip');
        const year = hiddenTip.find('.jt-info a[rel="tag"]').first().text().trim();
        const country = hiddenTip.find('.block').first().find('a').text().trim();
        const genres = [];

        hiddenTip.find('.block').last().find('a').each((_, genre) => {
          genres.push($(genre).text().trim());
        });

        results.push({
          title,
          link,
          image,
          imdb,
          year,
          country: country || null,
          genres,
          type: isTv ? 'tv' : 'movie',
          episodes: episode || undefined,
        });
      });
    });

    return results;
  } catch (err) {
    throw new Error('Failed to scrape: ' + err.message);
  }
}

app.get('/api/movies', async (req, res) => {
  const query = req.query.s;
  if (!query) {
    return res.status(400).json({ error: 'Missing required parameter ?s=' });
  }

  try {
    const results = await scrapeSearchResults(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/movie', async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).json({ error: 'Missing ?url= parameter' });

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const title = $('#bread li.active span').text().trim().replace('Text from here: ', '');
    const poster = $('.thumb.mvi-cover').css('background-image')
      .replace(/^url\(["']?/, '')
      .replace(/["']?\)$/, '');
    const rating = $('#movie-mark').text().trim();

    const servers = [];
    $('#content-embed iframe').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) servers.push(src);
    });

    let description = $('div[itemprop="description"] .f-desc').text().trim();
    
    // Remove last sentence (everything after last period followed by space)
    const lastPeriodIndex = description.lastIndexOf('. ');
    if (lastPeriodIndex !== -1) {
      description = description.substring(0, lastPeriodIndex + 1);
    }
    
    // Additional cleanup in case there's no space after period
    description = description.replace(/(.*)\..*$/, '$1.').trim();

    res.json({ title, poster, rating, servers, description });
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape data', details: error.message });
  }
});

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
        const portalEnergy = $('.rounded-lg .grid .grid-cols-3 .font-bold.text-right.col-span-2').eq(2).text().trim();
        // Get the Squad League details and remove label "Squad League:"
        const squadLeague = $('.grid.grid-cols-2.py-2').find('.font-bold').eq(0).text().trim();
        // Extract battle stats Top 1, Top 3, and Party text
        const top1Text = $('.mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.xs\\:grid-cols-1.sm\\:my-4.sm\\:grid-cols-1 .mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.sm\\:my-4.sm\\:grid-cols-3 .font-bold').eq(0).next().text().trim();
        const top3Text = $('.mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.xs\\:grid-cols-1.sm\\:my-4.sm\\:grid-cols-1 .mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.sm\\:my-4.sm\\:grid-cols-3 .font-bold').eq(2).next().text().trim();
        const partyText = $('.mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.xs\\:grid-cols-1.sm\\:my-4.sm\\:grid-cols-1 .mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.sm\\:my-4.sm\\:grid-cols-3 .font-bold').eq(4).next().text().trim();

        const bustsPerBattle = $('.mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.sm\\:my-4.sm\\:grid-cols-3 .font-bold').eq(6).next().text().trim();
        const bigNPCsPerBattle = $('.mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.sm\\:my-4.sm\\:grid-cols-3 .font-bold').eq(8).next().text().trim();
        const bossesPerBattle = $('.mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.sm\\:my-4.sm\\:grid-cols-3 .font-bold').eq(10).next().text().trim();
        const gemsPerBattle = $('.mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.sm\\:my-4.sm\\:grid-cols-3 .font-bold').eq(12).next().text().trim();
        const picksPerBattle = $('.mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.sm\\:my-4.sm\\:grid-cols-3 .font-bold').eq(14).next().text().trim();
        const fusionsPerBattle = $('.mx-auto.my-4.grid.max-w-4xl.grid-cols-1.gap-4.px-4.sm\\:my-4.sm\\:grid-cols-3 .font-bold').eq(16).next().text().trim();
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
            "Player stats": {
                "Top 1": top1Text.replace('Total:', '').trim(),
                "Top 3": top3Text.replace('Total:', '').trim(),
                "Party": partyText.replace('Total:', '').trim(),
            },
            "Battle Stats": {
                "Busts / Battle": bustsPerBattle.replace('Total:', '').trim(),
                "Big NPCs / Battle": bigNPCsPerBattle.replace('Total:', '').trim(),
                "Bosses / Battle": bossesPerBattle.replace('Total:', '').trim(),
                "Gems / Battle": gemsPerBattle.replace('Total:', '').trim(),
                "Picks / Battle": picksPerBattle.replace('Total:', '').trim(),
                "Fusions / Battle": fusionsPerBattle.replace('Total:', '').trim(),
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
