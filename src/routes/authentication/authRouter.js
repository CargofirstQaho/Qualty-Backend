const express = require("express")
const router = express.Router();
const { getUserProfileController,logoutController,signInController,signUpController } = require("../../controllers/authentication/authentication");
const {handleValidationErrors,signInValidation,signUpValidation} = require("../../middleware/validation");
const verifyUser = require("../../middleware/verifyUser");

router.post("/signup",signUpValidation(),handleValidationErrors,signUpController)
router.post("/signin",signInValidation(),handleValidationErrors,signInController)
router.post("/logout",handleValidationErrors,logoutController)
router.get("/profile",verifyUser,getUserProfileController)
module.exports = router