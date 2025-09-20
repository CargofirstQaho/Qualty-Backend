const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  enquiry: { type: mongoose.Schema.Types.ObjectId, ref: "InspectionEnquiry", required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  phase: { type: String, enum: ["initial", "mid", "final"], default: "initial" },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  paymentMode: String, 
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
