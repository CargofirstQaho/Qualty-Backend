const InspectionEnquiry = require("../../models/Customer/customerEnquiryForm");
const Bid = require("../../models/Inspector/bidModel");
const errorHandler = require("../../utils/errorHandler")

const getAvailableEnquiries = async (req, res, next) => {
  try {
    if (req.user.role !== "inspector") {
      return next(errorHandler(403, "Only inspectors can view enquiries"));
    }

    const enquiries = await InspectionEnquiry.find({
      status: "submitted",
    }).sort({ createdAt: -1 });

    res.json({ success: true, enquiries });
  } catch (error) {
    next(errorHandler(500, "Failed to fetch enquiries: " + error.message));
  }
};

const placeBid = async (req, res, next) => {
  try {
    if (req.user.role !== "inspector") {
      return next(errorHandler(403, "Only inspectors can bid"));
    }

    const { enquiryId } = req.params;
    const { amount, note } = req.body;

    const enquiry = await InspectionEnquiry.findById(enquiryId);
    if (!enquiry || enquiry.status !== "submitted") {
      return next(errorHandler(404, "Enquiry not available for bidding"));
    }

    let bid = await Bid.findOne({
      enquiry: enquiryId,
      inspector: req.user._id,
    });

    if (bid) {
      bid.amount = amount;
      bid.note = note;
      await bid.save();
    } else {
      bid = await Bid.create({
        enquiry: enquiryId,
        inspector: req.user._id,
        amount,
        note,
      });
    }

    res.status(200).json({
      success: true,
      message: "Bid placed successfully",
      bid,
    });
  } catch (error) {
    next(errorHandler(500, "Failed to place bid: " + error.message));
  }
};

const cancelBid = async (req, res, next) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId);
    if (!bid || String(bid.inspector) !== String(req.user._id)) {
      return next(errorHandler(403, "Unauthorized or bid not found"));
    }

    bid.status = "withdrawn";
    await bid.save();

    res.json({ success: true, message: "Bid cancelled", bid });
  } catch (error) {
    next(errorHandler(500, "Failed to cancel bid: " + error.message));
  }
}; 

const getMyBids = async (req, res, next) => {
  try {
    const bids = await Bid.find({ inspector: req.user._id })
      .populate("InspectionEnquiry")
      .sort({ createdAt: -1 });

    res.json({ success: true, bids });
  } catch (error) {
    next(errorHandler(500, "Failed to fetch bids: " + error.message));
  }
};

const getLowestBidsPerEnquiry = async (req, res, next) => {
  try {
    const lowestBids = await Bid.aggregate([
      {
        $match: { status: "active" }
      },
      {
        $group: {
          _id: "$enquiry",
          lowestBidAmount: { $min: "$amount" },
          bidCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "inspectionenquiries",
          localField: "_id",
          foreignField: "_id",
          as: "enquiryDetails"
        }
      },
      {
        $unwind: "$enquiryDetails"
      },
      {
        $project: {
          _id: 0,
          enquiryId: "$enquiryDetails._id",
          title: "$enquiryDetails.selectionSummary",
          location: "$enquiryDetails.inspectionLocation",
          country: "$enquiryDetails.country",
          lowestBidAmount: 1,
          bidCount: 1
        }
      },
      {
        $sort: { lowestBidAmount: 1 }
      }
    ]);

    res.json({ success: true, data: lowestBids });
  } catch (error) {
    next(errorHandler(500, "Failed to aggregate lowest bids: " + error.message));
  }
};

 
module.exports = {
  getAvailableEnquiries,
  placeBid,
  cancelBid,
  getMyBids,
  getLowestBidsPerEnquiry
};
