const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const request = require("request");
const FormData = require("form-data");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(limiter);
app.use(express.json());
app.set("json spaces", 2);

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 500,
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.get("/docs", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "docs.html"));
});

async function scrapeSearchResults(query) {
  const url = `https://ww25.soap2day.day/search/${encodeURIComponent(query)}`;
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const results = [];

    const sections = ["#movies .ml-item", "#tvshows .ml-item"];

    sections.forEach((selector) => {
      const isTv = selector.includes("tv");

      $(selector).each((_, el) => {
        const element = $(el);
        const title = element.find(".h2").text().trim();
        if (!title.toLowerCase().includes(query.toLowerCase())) return;

        const anchor = element.find("a");
        const link = anchor.attr("href");
        const image = anchor.find("img").attr("data-original")?.trim();
        const imdb = element.find(".imdb").text().trim();
        const episode = element.find(".mli-eps i").text().trim();

        const hiddenTip = element.find("#hidden_tip");
        const year = hiddenTip
          .find('.jt-info a[rel="tag"]')
          .first()
          .text()
          .trim();
        const country = hiddenTip
          .find(".block")
          .first()
          .find("a")
          .text()
          .trim();
        const genres = [];

        hiddenTip
          .find(".block")
          .last()
          .find("a")
          .each((_, genre) => {
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
          type: isTv ? "tv" : "movie",
          episodes: episode || undefined,
        });
      });
    });

    return results;
  } catch (err) {
    throw new Error("Failed to scrape: " + err.message);
  }
}

app.post("/api/movies", async (req, res) => {
  const query = req.query.s;
  if (!query) {
    return res.status(400).json({ error: "Missing required parameter ?s=" });
  }

  try {
    const results = await scrapeSearchResults(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/movie", async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).json({ error: "Missing ?url= parameter" });

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const title = $("#bread li.active span")
      .text()
      .trim()
      .replace("Text from here: ", "");
    const poster = $(".thumb.mvi-cover")
      .css("background-image")
      .replace(/^url\(["']?/, "")
      .replace(/["']?\)$/, "");
    const rating = $("#movie-mark").text().trim();

    const servers = [];
    $("#content-embed iframe").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src) servers.push(src);
    });

    let description = $('div[itemprop="description"] .f-desc').text().trim();

    // Remove last sentence (everything after last period followed by space)
    const lastPeriodIndex = description.lastIndexOf(". ");
    if (lastPeriodIndex !== -1) {
      description = description.substring(0, lastPeriodIndex + 1);
    }

    // Additional cleanup in case there's no space after period
    description = description.replace(/(.*)\..*$/, "$1.").trim();

    res.json({ title, poster, rating, servers, description });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to scrape data", details: error.message });
  }
});

app.get("/api/html", async (req, res) => {
  try {
    const url = req.query.site;
    if (!url) {
      res.send("URL parameter missing");
    } else {
      const searchUrl = `${url}`;
      const searchResponse = await axios.get(searchUrl);
      const htmlCode = searchResponse.data;

      const modifiedHtmlCode = escapeHtml(htmlCode);

      res.setHeader("Content-Type", "text/plain");
      res.send(modifiedHtmlCode);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message || "Something went wrong.");
  }
});

function escapeHtml(html) {
  return html;
}

app.get("/api/pinterest", (req, res) => {
  var query = req.query.query;
  if (!query) return res.json({ error: "Missing query" });
  var headers = {
    authority: "www.pinterest.com",
    "cache-control": "max-age=0",
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "upgrade-insecure-requests": "1",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
    "sec-gpc": "1",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "same-origin",
    "sec-fetch-dest": "empty",
    "accept-language": "en-US,en;q=0.9",
    cookie:
      'csrftoken=92c7c57416496066c4cd5a47a2448e28; g_state={"i_l":0}; _auth=1; _pinterest_sess=TWc9PSZBMEhrWHJZbHhCVW1OSzE1MW0zSkVid1o4Uk1laXRzdmNwYll3eEFQV0lDSGNRaDBPTGNNUk5JQTBhczFOM0ZJZ1ZJbEpQYlIyUmFkNzlBV2kyaDRiWTI4THFVUWhpNUpRYjR4M2dxblJCRFhESlBIaGMwbjFQWFc2NHRtL3RUcTZna1c3K0VjVTgyejFDa1VqdXQ2ZEQ3NG91L1JTRHZwZHNIcDZraEp1L0lCbkJWUytvRis2ckdrVlNTVytzOFp3ZlpTdWtCOURnbGc3SHhQOWJPTzArY3BhMVEwOTZDVzg5VDQ3S1NxYXZGUEEwOTZBR21LNC9VZXRFTkErYmtIOW9OOEU3ektvY3ZhU0hZWVcxS0VXT3dTaFpVWXNuOHhiQWdZdS9vY24wMnRvdjBGYWo4SDY3MEYwSEtBV2JxYisxMVVsV01McmpKY0VOQ3NYSUt2ZDJaWld6T0RacUd6WktITkRpZzRCaWlCTjRtVXNMcGZaNG9QcC80Ty9ZZWFjZkVGNURNZWVoNTY4elMyd2wySWhtdWFvS2dQcktqMmVUYmlNODBxT29XRWx5dWZSc1FDY0ZONlZJdE9yUGY5L0p3M1JXYkRTUDAralduQ2xxR3VTZzBveUc2Ykx3VW5CQ0FQeVo5VE8wTEVmamhwWkxwMy9SaTNlRUpoQmNQaHREbjMxRlRrOWtwTVI5MXl6cmN1K2NOTFNyU1cyMjREN1ZFSHpHY0ZCR1RocWRjVFZVWG9VcVpwbXNGdlptVzRUSkNadVc1TnlBTVNGQmFmUmtrNHNkVEhXZytLQjNUTURlZXBUMG9GZ3YwQnVNcERDak16Nlp0Tk13dmNsWG82U2xIKyt5WFhSMm1QUktYYmhYSDNhWnB3RWxTUUttQklEeGpCdE4wQlNNOVRzRXE2NkVjUDFKcndvUzNMM2pMT2dGM05WalV2QStmMC9iT055djFsYVBKZjRFTkRtMGZZcWFYSEYvNFJrYTZSbVRGOXVISER1blA5L2psdURIbkFxcTZLT3RGeGswSnRHdGNpN29KdGFlWUxtdHNpSjNXQVorTjR2NGVTZWkwPSZzd3cwOXZNV3VpZlprR0VBempKdjZqS00ybWM9; _b="AV+pPg4VpvlGtL+qN4q0j+vNT7JhUErvp+4TyMybo+d7CIZ9QFohXDj6+jQlg9uD6Zc="; _routing_id="d5da9818-8ce2-4424-ad1e-d55dfe1b9aed"; sessionFunnelEventLogged=1',
  };

  var options = {
    url:
      "https://www.pinterest.com/search/pins/?q=" +
      encodeURI(query) +
      "&rs=typed&term_meta[]=" +
      encodeURI(query) +
      "%7Ctyped",
    headers: headers,
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      const arrMatch = body.match(
        /https:\/\/i\.pinimg\.com\/originals\/[^.]+\.jpg/g
      );
      return res.json({
        count: arrMatch.length,
        data: arrMatch,
        author: {
          name: "milancodess",
          contact: "https://www.facebook.com/milanxd.bh",
        },
      });
    }
  }

  request(options, callback);
});

app.post("/api/rashifal", (req, res) => {
  const url = "https://www.hamropatro.com/rashifal";

  axios
    .get(url)
    .then((response) => {
      const $ = cheerio.load(response.data);

      const h3Elements = $("h3");
      const descElements = $(".desc p");

      const rashiNames = [
        "मेष",
        "बृष",
        "मिथुन",
        "कर्कट",
        "सिंह",
        "कन्या",
        "तुला",
        "बृश्चिक",
        "धनु",
        "मकर",
        "कुम्भ",
        "मीन",
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
    .catch((error) => {
      res.status(500).json({
        error: `Failed to retrieve the page. Error: ${error.message}`,
      });
    });
});

app.post("/api/kathmanduPost", async (req, res) => {
  try {
    const url = "https://kathmandupost.com";
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const paragraphs = $("p")
      .map((index, element) => $(element).text().trim())
      .get();
    const links = $("div.image.pull-right a")
      .map((index, element) => $(element).attr("href"))
      .get();

    const imageLinks = $(
      "div.image.pull-right figure a img.lazy.img-responsive"
    )
      .map((index, element) => $(element).attr("data-src"))
      .get();
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
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/news", async (req, res) => {
  try {
    const newsUrl = req.query.newsUrl;

    if (!newsUrl) {
      return res.status(400).json({ error: "Missing newsUrl parameter" });
    }

    const response = await axios.get(newsUrl);
    const html = response.data;

    const $ = cheerio.load(html);

    const author = $("h5.text-capitalize a").text().trim();

    const updatedTimes = [];
    $("div.updated-time").each((index, element) => {
      const published = $(element)
        .contents()
        .filter(function () {
          return this.nodeType === 3;
        })
        .text()
        .trim();
      updatedTimes.push({ published });
    });

    const news = $("section.story-section p").text().trim();

    res.json({
      author: author,
      updatedTimes: updatedTimes,
      news: news,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const sendToDiscord = async (mediaStream, fileName) => {
  const webhookUrl =
    "https://discord.com/api/webhooks/1271489651491864769/KRjprYi50iAff-J7k5vtq1_ShVGKKG2NLILKnTlcNRYqaki617xeJ5bSbDGN8WvRKUqd";
  const formData = new FormData();
  formData.append("file", mediaStream, fileName);

  try {
    const response = await axios.post(webhookUrl, formData, {
      headers: formData.getHeaders(),
    });
    console.log("File uploaded successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error uploading file:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

app.get("/api/discord", async (req, res) => {
  const mediaUrl = req.query.mediaUrl;
  if (!mediaUrl) {
    return res.status(400).send("No mediaUrl provided.");
  }

  const fileName = mediaUrl.split("/").pop();

  try {
    const mediaStream = await downloadMedia(mediaUrl);
    const discordResponse = await sendToDiscord(mediaStream, fileName);
    res.status(200).send({
      message: "File is being uploaded to Discord.",
      fileDetails: {
        originalName: fileName,
      },
      discordResponse,
    });
  } catch (error) {
    res.status(500).send("Error uploading file to Discord.");
  }
});

app.listen(PORT, "0.0.0.0", function () {
  console.log(`Live on http://localhost:${PORT}`);
});
