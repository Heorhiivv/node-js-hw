const express = require("express")
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const contactRouter = require("./contact/contact.routes")

dotenv.config()

const PORT = process.env.PORT || 8080

start()

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
}

function declareRoutes(app) {
  app.use("/contacts", contactRouter)
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
