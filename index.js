require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

// DB Configuration
mongoose
  .connect(process.env["URI_DB"])
  .then(function () {
    console.log("DB Connected");
  })
  .catch(function (err) {
    if (err) console.error(err);
  });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: {
    type: String,
    default: new Date(Date.now()).toISOString().substring(0, 10),
  },
  idUser: { type: String, required: true },
});

const userModel = mongoose.model("userModel", userSchema);

const exerciseModel = mongoose.model("exerciseModel", exerciseSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app
  .route("/api/users")
  .get(async function (req, res, next) {
    const getUsers = await userModel
      .find({}, { username: true, _id: true })
      .exec();

    res.json(getUsers);
  })
  .post(async function (req, res, next) {
    const username = req.body.username;
    const sendUsername = new userModel({
      username: username,
    });

    await sendUsername
      .save()
      .then(function () {
        console.log("Document saved");
      })
      .catch(function (err) {
        if (err) {
          console.error(err);
          res.json({ Error: err });
        }
      });

    res.json({ username: username, _id: sendUsername._id });
  });

app.get("/api/users/:_id/logs/", async function (req, res, next) {
  const { _id } = req.params;
  const { from, to, limit = 0 } = req.query;
  const getUser = await userModel.findById(_id).exec();
  let docs;

  if (from !== undefined && to !== undefined) {
    const getExercise = await exerciseModel
      .find({
        idUser: _id,
        date: { $gte: from, $lte: to },
      })
      .select("description duration date")
      .limit(parseInt(limit))
      .exec();

    docs = getExercise;
  } else {
    const getExercise = await exerciseModel
      .find({ idUser: _id })
      .select("description duration date")
      .limit(parseInt(limit))
      .exec();

    docs = getExercise;
  }

  const countLog = await exerciseModel.countDocuments({ idUser: _id });

  res.json({
    username: getUser.username,
    count: countLog,
    _id: getUser._id,
    log: docs.map(item => {
      return {
        description: item.description,
        duration: item.duration,
        date: new Date(item.date).toDateString(),
      };
    })
  });
});

app.post("/api/users/:_id/exercises", async function (req, res, next) {
  const idUser = req.params._id,
    desc = req.body.description,
    dura = req.body.duration,
    date = req.body.date;

  const getUser = await userModel.findById(idUser);

  const saveExercise = new exerciseModel({
    idUser: idUser,
    description: desc,
    duration: dura,
    date: date,
  });

  saveExercise
    .save()
    .then(function (data) {
      res.json({
        _id: data.idUser,
        username: getUser.username,
        date: new Date(data.date).toDateString(),
        duration: data.duration,
        description: data.description,
      });
    })
    .catch(function (err) {
      if (err) console.error(err);
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
