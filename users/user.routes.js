const {Router} = require("express")
const UserController = require("./user.controller")

const router = Router()

router.post("/auth/register", UserController.validateUser, UserController.registerUser)
router.post("/auth/login", UserController.validateUser, UserController.login)
router.post("/auth/logout", UserController.authorize, UserController.logout)

router.get("/users/current", UserController.authorize, UserController.getCurrentUser)

module.exports = router
