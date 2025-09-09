const express = require("express")
const router = express.Router();
const verifyUser  = require("../../middleware/verifyUser")
const raiseEnquiryController = require("../../controllers/customer/enquiryFormController")

router.post("/raise-enquiry", verifyUser, raiseEnquiryController);

module.exports = router