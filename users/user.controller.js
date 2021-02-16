const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const Joi = require("joi")
const dotenv = require("dotenv")

const User = require("./User")
dotenv.config()

async function registerUser(req, res) {
  try {
    const {body} = req

    const hashedPassword = await bcrypt.hash(body.password, 14)

    const isEmailExist = await User.findOne({
      email: body.email,
    })

    if (isEmailExist) {
      return res.status(409).send({message: "Email in use"})
    }

    const user = await User.create({
      ...body,
      password: hashedPassword,
    })

    const {email, subscription} = user
    res.status(201).json({
      user: {
        email: email,
        subscription: subscription,
      },
    })
  } catch (error) {
    res.status(400).send(error)
  }
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

module.exports = {
  registerUser,
  validateUser,
  login,
  authorize,
  logout,
  getCurrentUser,
}
