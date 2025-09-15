const express = require("express");
const router = express.Router();
const {
  getAvailableEnquiries,
  placeBid,
  cancelBid,
  getMyBids,
  getLowestBidsPerEnquiry
} = require("../../controllers/inspector/inspectorController");
const verifyUser = require("../../middleware/verifyUser");

router.get("/enquiries", verifyUser, getAvailableEnquiries);
router.post("/bid/:enquiryId", verifyUser, placeBid);
router.delete("/bid/:bidId", verifyUser, cancelBid);
router.get("/my-bids", verifyUser, getMyBids);
router.get("/lowest-bids", verifyUser, getLowestBidsPerEnquiry);

module.exports = router;
