const express = require('express')
require("dotenv").config();

const app = express()
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('Tony')
})

app.listen(port, () => {
    console.log(`SAC attandance app listening at http://localhost:${port}`)
})