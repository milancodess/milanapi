import express from "express";
import fetch from "node-fetch"
import request from "request";
import fs from "fs";

import cors from "cors";
import rateLimit from "express-rate-limit";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 5000;
const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use(express.static(path.join(__dirname, "public")));
app.use(limiter);
app.use(cors());

// api key
const apikey = [
    "xyzmilan"
];

app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "dashboard","home.html"));
});

app.get("/index", (req, res) => {
res.sendFile(path.join(__dirname, "dashboard", "index.html"));
});


  
app.get("/dp", (req, res) => {

    const result = {}

    res.header("Content-type", "application/json; charset=utf-8")



    try {
        const data = JSON.parse(fs.readFileSync("./db.json"))
        const randomIndex1 = Math.floor(Math.random() * data.length)
        
        
        result.code = 200
        result.male = data[randomIndex1].link1
       result.female = data[randomIndex1].link2
        result.author = data[randomIndex1].By
        result.source = "MILANxLOUFI"

        res.send(JSON.stringify(result, null, 2))
        console.log(result)
    } catch (err) {
        console.log(err)
        result.code = 500
        result.message = "Internal Server Error"
        res.send(JSON.stringify(result, null, 2))
    }
})

app.get("/pubg", (req, res) => {
	const query = req.query.query
    const key = req.query.apikey
    const result = {}
    res.header("Content-type", "application/json; charset=utf-8")
    if (!apikey.includes(key)) {
        result.code = 403
        result.message = "Unauthorized access"
        return res.send(JSON.stringify(result, null, 2))
    }
    try {
        const data = JSON.parse(fs.readFileSync("./pubg/db.json"))
        const character = data.find(item =>
item.id.toLowerCase() === query.toLowerCase())
        if (character) {
            result.code = 200      
           result.id = character.id
          result.name = character.name
          result.team = character.team
          result.joindate = character.joindate
          result.bio = character.bio
          result.pic = character.pic
          result.nationality = character.nationality
          result.status = character.status
            res.send(JSON.stringify(result, null, 2))
            console.log(result)
        } else {
            result.code = 404
            result.message = "Character not found"
            res.send(JSON.stringify(result, null, 2))
        }
    } catch (err) {
        console.log(err)
        result.code = 500
        result.message = "Internal server error"
        res.send(JSON.stringify(result, null, 2))
    }
})

app.get("/memes", (req, res) => {
    const key = req.query.apikey
    const result = {}

    res.header("Content-type", "application/json; charset=utf-8")

    if (!apikey.includes(key)) {
        result.code = 403
        result.message = "Invalid API key, please contact admin to get key"
        return res.send(JSON.stringify(result, null, 2))
    }

    try {
        const data = JSON.parse(fs.readFileSync("./memes/db.json"))
        const randomIndex1 = Math.floor(Math.random() * data.length)
        
        
        result.code = 200
        result.link = "Milan Bhandari"
        result.link = data[randomIndex1].link
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

app.get("/ayaka", (req, res) => {
    const key = req.query.apikey
    const result = {}

    res.header("Content-type", "application/json; charset=utf-8")

    if (!apikey.includes(key)) {
        result.code = 403
        result.message = "Invalid API key, please contact admin to get key"
        return res.send(JSON.stringify(result, null, 2))
    }

    try {
        const data = JSON.parse(fs.readFileSync("./ayaka/db.json"))
        const randomIndex1 = Math.floor(Math.random() * data.length)
        
        
        result.code = 200
        result.link = "Milan Bhandari"
        result.link = data[randomIndex1].link
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
    const key = req.query.apikey
    const result = {}

    res.header("Content-type", "application/json; charset=utf-8")

    if (!apikey.includes(key)) {
        result.code = 403
        result.message = "Invalid API key, please contact admin to get key"
        return res.send(JSON.stringify(result, null, 2))
    }

    try {
        const data = JSON.parse(fs.readFileSync("./quote/db.json"))
        const randomIndex1 = Math.floor(Math.random() * data.length)
        
        
        result.code = 200
        result.author = "Milan Bhandari"
        result.character = data[randomIndex1].character
      result.quote = data[randomIndex1].quote
        result.anime = data[randomIndex1].anime

        res.send(JSON.stringify(result, null, 2))
        console.log(result)
    } catch (err) {
        console.log(err)
        result.code = 500
        result.message = "Internal Server Error"
        res.send(JSON.stringify(result, null, 2))
    }
})


app.get("/kanda", (req, res) => {

    const result = {}

    res.header("Content-type", "application/json; charset=utf-8")



    try {
        const data = JSON.parse(fs.readFileSync("./kanda/db.json"))
        const randomIndex1 = Math.floor(Math.random() * data.length)
        
        
        result.code = 200
        result.author = "MILAN"
        result.link = data[randomIndex1].link

        res.send(JSON.stringify(result, null, 2))
        console.log(result)
    } catch (err) {
        console.log(err)
        result.code = 500
        result.message = "Internal Server Error"
        res.send(JSON.stringify(result, null, 2))
    }
})
          
app.get("/car", (req, res) => {
    const key = req.query.apikey
    const result = {}

    res.header("Content-type", "application/json; charset=utf-8")

    if (!apikey.includes(key)) {
        result.code = 403
        result.message = "Invalid API key, please contact admin to get key"
        return res.send(JSON.stringify(result, null, 2))
    }

    try {
        const data = JSON.parse(fs.readFileSync("./car/db.json"))
        const randomIndex1 = Math.floor(Math.random() * data.length)
        
        
        result.code = 200
        result.link = "Milan Bhandari"
        result.link = data[randomIndex1].link
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

app.get("/hentai", (req, res) => {
 
    const result = {}

    res.header("Content-type", "application/json; charset=utf-8")



    try {
        const data = JSON.parse(fs.readFileSync("./hentai/db.json"))
        const randomIndex1 = Math.floor(Math.random() * data.length)
        
        
        result.code = 200
        result.author = "MILAN"
        result.url = data[randomIndex1].url

        res.send(JSON.stringify(result, null, 2))
        console.log(result)
    } catch (err) {
        console.log(err)
        result.code = 500
        result.message = "Internal Server Error"
        res.send(JSON.stringify(result, null, 2))
    }
})

app.get("/nsfw", (req, res) => {
    const key = req.query.apikey
    const result = {}

    res.header("Content-type", "application/json; charset=utf-8")

    if (!apikey.includes(key)) {
        result.code = 403
        result.message = "Invalid API key, please contact admin to get key"
        return res.send(JSON.stringify(result, null, 2))
    }

    try {
        const data = JSON.parse(fs.readFileSync("./nsfw/db.json"))
        const randomIndex1 = Math.floor(Math.random() * data.length)
        
        
        result.code = 200
        result.author = "MILAN"
        result.url = data[randomIndex1].url

        res.send(JSON.stringify(result, null, 2))
        console.log(result)
    } catch (err) {
        console.log(err)
        result.code = 500
        result.message = "Internal Server Error"
        res.send(JSON.stringify(result, null, 2))
    }
})

app.get("/audio", (req, res) => {
    const key = req.query.apikey
    const result = {}
    result.code = 200
    const imageList = fs.readdirSync("./public/audio")
    const randomImage = imageList[Math.floor(Math.random() * imageList.length)]
    result.url = `https://milanbhandari.imageapi.repl.co/audio/${randomImage}`
    result.author = "MILAN"
    res.header("Content-type", "application/json; charset=utf-8")
    if (apikey.includes(key)) {
        res.send(JSON.stringify(result, null, 2))
        console.log(result)
    } else {
        const result = {}
        result.code = 403
        result.message = "Invalid API key, please contact admin to get key"
        res.send(JSON.stringify(result, null, 2))
    }
})

app.get("/listanime", (req, res) => {
	  const query = req.query.query
    const key = req.query.apikey
    const result = {}
    res.header("Content-type", "application/json; charset=utf-8")
    if (!apikey.includes(key)) {
        result.code = 403
        result.message = "Unauthorized access"
        return res.send(JSON.stringify(result, null, 2))
    }
    try {
        const data = JSON.parse(fs.readFileSync("./listanime/db.json"))
        const character = data.find(item =>
item.id.toLowerCase() === query.toLowerCase())
        if (character) {
           result.code = 200      
           result.name = character.name
           result.id = character.id 
           result.color = character.color
           res.send(JSON.stringify(result, null, 2))
            console.log(result)
        } else {
            result.code = 404
            result.message = "Character not found"
            res.send(JSON.stringify(result, null, 2))
        }
    } catch (err) {
        console.log(err)
        result.code = 500
        result.message = "Internal server error"
        res.send(JSON.stringify(result, null, 2))
    }
})
        
app.get("/lyrics", (req, res) => {
	const query = req.query.query
    const result = {}
    res.header("Content-type", "application/json; charset=utf-8")
 
    try {
        const data = JSON.parse(fs.readFileSync("./lyrics/db.json"))
        const music = data.find(item =>
item.song.toLowerCase() === query.toLowerCase())
        if (music) {
            result.code = 200      
            result.song = music.song
            result.lyrics = music.lyrics
		result.img = music.img
		result.artist = music.artist
            res.send(JSON.stringify(result, null, 2))
            console.log(result)
        } else {
            result.code = 404
            result.message = "Lyrics not found"
            res.send(JSON.stringify(result, null, 2))
        }
    } catch (err) {
        console.log(err)
        result.code = 500
        result.message = "Internal server error"
        res.send(JSON.stringify(result, null, 2))
    }
})

app.get("/superhero", (req, res) => {
	const query = req.query.query
    const result = {}
    res.header("Content-type", "application/json; charset=utf-8")
    try {
        const data = JSON.parse(fs.readFileSync("./superhero/db.json"))
        const character = data.find(item =>
item.name.toLowerCase() === query.toLowerCase())
        if (character) {
            result.code = 200      
            result.id = character.id
            result.name = character.name
            result.slug = character.slug
            result.powerstats = character.powerstats
            result.intelligence = character.intelligence
            result.strength = character.strength
            result.speed = character.speed
            result.combat = character.combat
            result.durability = character.durability
            result.power = character.power
            result.appearance = character.appearance
            result.gender = character.gender
            result.race = character.race
            result.height = character.height
            result.weight = character.weight
            result.eyeColor = character.eyeColor
            result.hairColor = character.hairColor
            result.biography = character.biography
            result.fullName = character.fullName
            result.alterEgos = character.alterEgos
            result.aliases = character.placeOfBirth
            result.firstAppearance = character.firstAppearance
            result.publisher = character.publisher
            result.alignment = character.alignment
            result.work = character.work
            result.occupation = character.occupation
            result.connections = character.connections
            result.groupAffiliation = character.groupAffiliation
            result.relatives = character.relatives
            result.images = character.images
            result.xs = character.xs
            result.sm = character.sm
            result.md = character.md
            result.lg = character.lg
            res.send(JSON.stringify(result, null, 2))
            console.log(result)
        } else {
            result.code = 404
            result.message = "Character not found"
            res.send(JSON.stringify(result, null, 2))
        }
    } catch (err) {
        console.log(err)
        result.code = 500
        result.message = "Internal server error"
        res.send(JSON.stringify(result, null, 2))
    }
})

  app.get("/iso", (req, res) => {
	const query = req.query.query
    const result = {}
    res.header("Content-type", "application/json; charset=utf-8")
    try {
        const data = JSON.parse(fs.readFileSync("./iso/db.json"))
        const country = data.find(item =>
item.name.toLowerCase() === query.toLowerCase())
        if (country) {
            result.code = 200      
            result.name = country.name
            result.alpha2 = country.alpha2
            result.alpha3 = country.alpha3
            result.countrycode = country.countrycode
            result.iso31662 = country.iso31662
            result.regioncode = country.regioncode
            result.subregioncode = country.subregioncode
            res.send(JSON.stringify(result, null, 2))
            console.log(result)
        } else {
            result.code = 404
            result.message = "Country not found"
            res.send(JSON.stringify(result, null, 2))
        }
    } catch (err) {
        console.log(err)
        result.code = 500
        result.message = "Internal server error"
        res.send(JSON.stringify(result, null, 2))
    }
})





app.listen(port, "0.0.0.0", function () {
    console.log(`Listening on port ${port}`)
  
})
	
