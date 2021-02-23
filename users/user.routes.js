const path = require('path');

const {Router} = require("express")
const UserController = require("./user.controller")

const multer = require('multer');
const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'tmp')
  },
  filename: function (req, file, cb) {
    const { ext } = path.parse(file.originalname);
    cb(null, `${Date.now()}${ext}`)
  },
})

const upload = multer({ storage });

async function minifyImage(req, res, next) {
  const data = await imagemin(
   [`${req.file.destination}/${req.file.filename}`], {
      destination: "public/images",
      plugins: [
        imageminJpegtran(),
        imageminPngquant({
          quality: [0.6, 0.8],
        }),
      ],
    }
  )
  next()
}

router.post("/auth/register", UserController.validateUser, UserController.registerUser)
router.post("/auth/login", UserController.validateUser, UserController.login)
router.post("/auth/logout", UserController.authorize, UserController.logout)

router.get("/users/current", UserController.authorize, UserController.getCurrentUser)

router.patch('/users/current', UserController.authorize, UserController.validateSubscription, UserController.updateSubscription)

router.patch('/users/avatars', UserController.authorize, upload.single('avatar'), minifyImage, UserController.updateUserAvatar,)

module.exports = router
