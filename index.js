require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

// DB Configuration
mongoose
  .connect(process.env.URI_DB)
  .then(function () {
    console.log('DB Connected')
  })
  .catch(function (err) {
    if (err) console.error(err)
  })

const exerciseSchema = new mongoose.Schema({
  username: { type: String, required: true },
  count: { type: Number, required: false },
  log: [{
    date: { type: String, required: false },
    duration: { type: String, required: false },
    description: { type: String, required: false }
  }]
})

const exerciseModel = mongoose.model('exerciseModel', exerciseSchema)

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.router('/api/users')
  .get(async function (req, res, next) {
    const getUsers = await exerciseModel.find({}, { '_id': true, 'username': true }).exec()
    res.json([getUsers])
  })
  .post(async function (req, res, next) {
    const username = req.body.username
    const sendUsername = new exerciseModel({ 'username': username })

    await sendUsername
      .save()
      .then(function () {
        console.log('Document saved')
      })
      .catch(function (err) {
        if (err) console.error(err)
      })
  })

app.get('/api/users/:_id/logs', function (req, res, next) { })

app.post('/api/users/:_id/exercises', function (req, res, next) { })

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
