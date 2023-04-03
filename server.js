require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const applicationRouter = require("./routes/applications.router");
const resourceRouter = require("./routes/resources.router");

const app = express();

// cors
app.use(cors());
// logging middleware
app.use(morgan("dev", {}));

// register only 5xx responses to error.log file
app.use(
  morgan("common", {
    stream: fs.createWriteStream(path.join(__dirname, "error.log"), {
      flags: "a",
    }),
    skip: function (req, res) {
      return res.statusCode < 500;
    },
  })
);

app.use(bodyParser.json({ limit: "100000mb" }));
app.use(bodyParser.urlencoded({ limit: "100000mb", extended: true }));

let databaseConnected = false;

// routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the API",
    status: databaseConnected ? "Online" : "Offline",
    about: "A nodejs API for storing and serving images, videos, pdfs, etc.",
    howToGuide: "Please visit https://github.com/sabberEmon",
  });
});

app.use("/api/applications", applicationRouter);
app.use("/api/resources", resourceRouter);

// serve files
app.use("/uploads", express.static("uploads"));

// database connection
const connectWithRetry = () => {
  mongoose.set("strictQuery", true);
  return mongoose
    .connect(process.env.MONGODB_CONNECTION_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      databaseConnected = true;
      console.log("database connected");
    })
    .catch((err) => {
      console.log(
        "database connection failed, retrying after 5 seconds...",
        err
      );
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

// listen
const PORT = process.env.PORT || 9000;

app
  .listen(PORT, () => {
    // create uploads dir if not exists
    if (!fs.existsSync(path.join(__dirname, "uploads"))) {
      fs.mkdirSync(path.join(__dirname, "uploads"));
    }

    // create images, videos, audios, documents, others dir if not exists
    const uploadsPath = path.join(__dirname, "uploads");
    const imagesPath = path.join(uploadsPath, "images");
    const videosPath = path.join(uploadsPath, "videos");
    const audiosPath = path.join(uploadsPath, "audios");
    const documentsPath = path.join(uploadsPath, "documents");
    const othersPath = path.join(uploadsPath, "others");

    if (!fs.existsSync(imagesPath)) {
      fs.mkdirSync(imagesPath);
    }

    if (!fs.existsSync(videosPath)) {
      fs.mkdirSync(videosPath);
    }

    if (!fs.existsSync(audiosPath)) {
      fs.mkdirSync(audiosPath);
    }

    if (!fs.existsSync(documentsPath)) {
      fs.mkdirSync(documentsPath);
    }

    if (!fs.existsSync(othersPath)) {
      fs.mkdirSync(othersPath);
    }

    console.log(`server is running on port ${PORT}`);
  })
  .on("error", (err) => {
    console.log(err);
  });
