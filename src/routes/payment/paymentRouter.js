const express = require("express");
const router = express.Router();
const { createOrderForEnquiry } = require("../../controllers/payment/paymentController");
const verifyUser = require("../../middleware/verifyUser");

router.post("/createOrder/:enquiryId", verifyUser, createOrderForEnquiry);



module.exports = router;
