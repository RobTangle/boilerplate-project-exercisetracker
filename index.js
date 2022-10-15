const cors = require("cors");
require("dotenv").config();
//body parser:
const bodyParser = require("body-parser");
const morgan = require("morgan");

const express = require("express");
const app = express();

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

const { Schema } = mongoose;

const ExcersiceSchema = new Schema({
  userId: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
});

const UserSchema = new Schema({
  username: String,
});

const User = mongoose.model("User", UserSchema);
const Exercise = mongoose.model("Exercise", ExcersiceSchema);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  console.log(req.body);
  try {
    const newUser = new User({
      username: req.body.username,
    });
    newUser.save((error, data) => {
      if (error) {
        res.status(400).send("Error al guardar newUser");
        return console.log("Error al guardar newUser");
      } else {
        res.status(200).send(data);
      }
    });
  } catch (error) {}
});

app.get("/api/users", (req, res) => {
  try {
    User.find({}, (error, data) => {
      if (error) return res.status(400).send({ error: "error en la búsqueda" });
      return res.status(200).send(data);
    });
  } catch (error) {}
});

app.post("/api/users/:_id/exercises", (req, res) => {
  try {
    console.log(req.body);
    console.log(`params _id: ${req.params._id}`);
    let userFound = {};
    User.findById(req.params._id, (error, data) => {
      if (error) {
        return res.status(404).send({ error: "The user wasn't found" });
      } else {
        userFound = data;
        console.log(userFound);
      }
    });
    let date = req.body.date;
    if (!date) {
      date = new Date();
    }
    const newExercise = new Exercise({
      userId: req.params._id,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: date,
    });
    newExercise.save((error, data) => {
      if (error) {
        return res.status(400).send({ error: "Oops. Something went wrong." });
      } else {
        const { description, duration, date, _id } = data;
        const response = {
          _id: req.params._id,
          username: userFound.username,
          date: date.toDateString(),
          duration: duration,
          description: description,
        };
        console.log(response);
        return res.status(200).send(response);
      }
    });
  } catch (error) {
    return res
      .status(400)
      .send({ error: "Hubo un error grave! " + error.message });
  }
});

app.get("/api/users/:_id/logs", (req, res) => {
  const { from, to, limit } = req.query;
  const { _id } = req.params;
  User.findById(_id, (error, data) => {
    if (error) {
      res.send("Error! Sorry...");
    } else {
      let dateObj = {};
      if (from) {
        dateObj["$gte"] = new Date(from);
      }
      if (to) {
        dateObj["$lte"] = new Date(to);
      }
      let filter = {
        userId: _id,
      };
      if (from || to) {
        filter.date = dateObj;
      }
      let nonNullLimit = limit ?? 500;
      Exercise.find(filter)
        .limit(+nonNullLimit)
        .exec((error, data) => {
          if (error) {
            res.json([]);
          } else {
            const count = data.length;
            const rawLog = data;
            const { username, _id } = data;
            const log = rawLog.map((l) => ({
              description: l.description,
              duration: l.duration,
              date: l.date.toDateString(),
            }));
            res.json({ username, count, _id, log });
          }
        });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

// Conectar DB en MongoDB
// Armar schemas de:

// Excercise:
// {
//   username: "fcc_test",
//   description: "test",
//   duration: 60,
//   date: "Mon Jan 01 1990",
//   _id: "5fb5853f734231456ccb3b05"
// }

// User:
// {
//   username: "fcc_test",
//   _id: "5fb5853f734231456ccb3b05"
// }

// Log:
// {
//   username: "fcc_test",
//   count: 1,
//   _id: "5fb5853f734231456ccb3b05",
//   log: [{
//     description: "test",
//     duration: 60,
//     date: "Mon Jan 01 1990",
//   }]
// }
