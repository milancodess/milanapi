const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 500,
});
app.use(limiter);
app.use(express.json());
app.set('json spaces', 2);


app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "dashboard","home.html"));
});

app.get("/docs", (req, res) => {
res.sendFile(path.join(__dirname, "dashboard", "docs.html"));
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

app.post('/api/movies', async (req, res) => {
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

app.post('/api/movie', async (req, res) => {
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

app.get('/api/html', async (req, res) => {
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
  }});

function escapeHtml(html) {
  return html;
}

app.post('/api/rashifal', (req, res) => {
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

app.post('/api/kathmanduPost', async (req, res) => {
  try {
    const url = 'https://kathmandupost.com';
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

app.post('/api/news', async (req, res) => {
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

app.get('/api/discord', async (req, res) => {
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

app.listen(PORT, "0.0.0.0", function () {
    console.log(`Listening on port ${PORT}`)
})
