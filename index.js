const path = require('path')

const express = require("express")
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const multer = require('multer')

const contactRouter = require("./contact/contact.routes")
const userRouter = require('./users/user.routes')

dotenv.config()

const PORT = process.env.PORT || 8080

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');
  },
  filename: function (req, file, cb) {
    const { ext } = path.parse(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

function start() {
  const app = initServer()
  connectToMiddlewares(app)
  declareRoutes(app)
  connectToDb()
  listen(app)
}

function initServer() {
  return express()
}

function connectToMiddlewares(app) {
  app.use(express.json());
  app.use(cors({ origin: '*' }));
  app.use(morgan('dev'));
  app.use(express.static('public'));
}

function declareRoutes(app) {
  app.use('/contacts', contactRouter);
  app.use('', userRouter);
  app.post('/images', upload.single('avatar'), (req, res) => {
    res.send({ file: req.file, ...req.body})
  })
}

async function connectToDb() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database connection successful");
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  };
};

function listen(app) {
  app.listen(PORT, () => {
    console.log("Server is listening on port:", PORT);
  });
};

start()
