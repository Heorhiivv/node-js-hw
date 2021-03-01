const fs = require("fs")

const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const Joi = require("joi")
const dotenv = require("dotenv")
const minifyImage = require("imagemin")
const imageminJpegtran = require("imagemin-jpegtran")
const imageminPngquant = require("imagemin-pngquant")
const Avatar = require("avatar-builder")
const {v4: uuidv4} = require("uuid")
const sgMail = require("@sendgrid/mail")

const User = require("./User")

dotenv.config()

const PORT = process.env.PORT || 8080

async function signUpUser(req, res) {
  try {
    const {body} = req

    const hashedPassword = await bcrypt.hash(body.password, 14)
    const tokenToVerify = await uuidv4()

    const isEmailExist = await User.findOne({
      email: body.email,
    })

    if (isEmailExist) {
      return res.status(409).send({message: "Email in use"})
    }
    const avatarTitle = Date.now()
    const avatar = Avatar.builder(Avatar.Image.margin(Avatar.Image.circleMask(Avatar.Image.identicon())), 128, 128, {
      cache: Avatar.Cache.lru(),
    })
      .create(body)
      .then((buffer) => fs.writeFileSync(`tmp/${avatarTitle}.png`, buffer))
    // avatar.create("allaigre").then((buffer) => fs.writeFileSync("tmp/avatar-allaigre.png", buffer))

    await minifyImage([`tmp/${avatarTitle}.png`], {
      destination: "public/images",
      plugins: [
        imageminJpegtran(),
        imageminPngquant({
          quality: [0.6, 0.8],
        }),
      ],
    })

    const user = await User.create({
      ...body,
      avatarURL: `http://localhost:8080/images/${avatarTitle}.png`,
      password: hashedPassword,
      verificationToken: tokenToVerify,
    })

    const {email, subscription, avatarURL, verificationToken} = user

    await sendVerificationEmail(email, tokenToVerify)

    res.status(201).json({
      user: {
        email: email,
        subscription: subscription,
        avatarURL: avatarURL,
        verificationToken: verificationToken,
      },
    })
  } catch (error) {
    res.status(400).send(error)
  }
}

async function sendVerificationEmail(email, verificationToken) {
  const msg = {
    to: email, // Change to your recipient
    from: "polsta.mama@gmail.com", // Change to your verified sender
    subject: "Sending with SendGrid is Fun",
    html: `Thank you for registration. To verify your email, click 
    <a href="http://localhost:${PORT}/auth/verify/${verificationToken}">here</a>`,
  }
  await sgMail.send(msg)
}

async function verifyUser(req, res) {
  const {
    params: {verificationToken},
  } = req
  const verificationTokenRequest = await User.findOne({
    verificationToken,
  })

  if (!verificationTokenRequest) {
    return res.status(404).send("User not found")
  }

  await User.updateOne({_id: verificationTokenRequest._id}, {$unset: {verificationToken: ""}})
  res.status(200).send("Ok")
}

function validateUser(req, res, next) {
  const validationRules = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
    subscription: Joi.string().default("free"),
  })

  const validationResult = validationRules.validate(req.body)

  if (validationResult.error) {
    return res.status(400).send(validationResult.error.message)
  }

  next()
}

async function login(req, res) {
  const {
    body: {email, password},
  } = req

  const user = await User.findOne({
    email,
  })

  if (!user) {
    return res.status(401).send("Email or password is wrong")
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    return res.status(401).send("Email or password is wrong")
  }

  const token = jwt.sign(
    {
      userId: user._id,
    },
    process.env.JWT_SECRET
  )

  await User.findByIdAndUpdate(user._id, {token: token})

  return res.status(200).json({
    token: token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  })
}

async function authorize(req, res, next) {
  const authorizationHeader = req.get("Authorization")

  if (!authorizationHeader) {
    return res.status(401).send({message: "Not authorized"})
  }

  const token = authorizationHeader.replace("Bearer ", "")

  try {
    const payload = await jwt.verify(token, process.env.JWT_SECRET)
    const {userId} = payload
    const user = await User.findById(userId)

    if (!user) {
      return res.status({message: "Not authorized"})
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).send(error)
  }
}

async function logout(req, res) {
  const {_id} = req.user

  const userWithoutToken = await User.findByIdAndUpdate(_id, {
    token: "",
  })

  if (!userWithoutToken) {
    return res.status(401).json({message: "Not authorized"})
  }

  return res.status(204).send("No Content")
}

async function getCurrentUser(req, res) {
  const {email, subscription} = req.user
  res.status(200).json({
    email: email,
    subscription: subscription,
  })
}

function validateSubscription(req, res, next) {
  const validationRules = Joi.object({
    subscription: Joi.string().valid("free", "pro", "premium").required(),
  })
  const validationResult = validationRules.validate(req.body)

  if (validationResult.error) {
    return res.status(400).send(validationResult.error.message)
  }

  next()
}
async function updateSubscription(req, res) {
  try {
    const {_id} = req.user
    const {subscription} = req.body
    const updateUser = await User.findByIdAndUpdate(
      _id,
      {subscription},
      {
        new: true,
      }
    )
    if (!updateUser) {
      return res.satus(400).send("Not found")
    }
    res.json({
      email: updateUser.email,
      subscription: updateUser.subscription,
    })
  } catch (error) {
    res.status(400).send(error)
  }
}

async function updateUserAvatar(req, res) {
  try {
    const {_id} = req.user
    const {filename} = req.file
    const updateAvatar = await User.findByIdAndUpdate(
      _id,
      {
        avatarURL: `http://localhost:${PORT}/images/${filename}`,
      },
      {
        new: true,
      }
    )

    if (!updateAvatar) res.status(401).send("Not authorized")
    res.json({
      avatarURL: updateAvatar.avatarURL,
    })
  } catch (error) {
    res.status(400).send(error)
  }
}

module.exports = {
  signUpUser,
  validateUser,
  login,
  authorize,
  logout,
  getCurrentUser,
  validateSubscription,
  updateSubscription,
  updateUserAvatar,
  verifyUser,
}
