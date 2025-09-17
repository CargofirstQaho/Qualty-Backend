const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    enquiry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InspectionEnquiry",
      required: true,
    },
    inspector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inspector",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
     customerViewAmount: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["active", "withdrawn", "won", "lost"],
      default: "active",
    },
  },
  { timestamps: true }
);

bidSchema.index({ enquiry: 1, inspector: 1 }, { unique: true });

module.exports = mongoose.model("Bid", bidSchema);
