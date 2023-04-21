import express from "express"

import fs from "fs"

import cors from "cors"

import rateLimit from "express-rate-limit"

const port = process.env.PORT || 5000

const app = express()

const limiter = rateLimit({

    windowMs: 15 * 60 * 1000, // 15 minutes

    max: 100 // limit each IP to 100 requests per windowMs

})

app.use(express.static("public"))

app.use(limiter)

app.use(cors())

// api key

const apikey = [



    "mr8es2r0hK",

    "0bk3s6IAyq",

    "T6j6vW01A2",

    "mr83ssr0hK",

    "mr8e2r0hK",

    "mr8es2r0hK",

    "mr8esar0hK",

    "mr8esgr0hK",

    "mr8esar0hK"
,

    "milan98471",

    "milanbh83661"

]

app.get("/", (req, res) => {

    res.send("https://github.com/milan-says/image-random-api")

})

app.get("/anime", (req, res) => {

    const key = req.query.apikey

    const result = {}

    result.code = 200

    const imageList = fs.readdirSync("./public/anime")

    const randomImage = imageList[Math.floor(Math.random() * imageList.length)]

    result.url = `127.0.0.1:5000/Anime/${randomImage}`

    result.author = "MILAN"

    result.source = "https://github.com/milan-says/image-random-api"

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

app.get("/dp", (req, res) => {

    const key = req.query.apikey

    const result = {}

    result.code = 200

    const imageList = fs.readdirSync("./public/dp")

    const randomImage = imageList[Math.floor(Math.random() * imageList.length)]

    result.url = `127.0.0.1:5000/Dp/${randomImage}`

    result.author = "MILAN"

    result.source = "https://github.com/milan-says/image-random-api"

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

app.listen(port, "0.0.0.0", function () {

    console.log(`Server listening on port ${port}\n`)

})
