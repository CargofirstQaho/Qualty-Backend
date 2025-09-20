const Payment = require("../../models/Payment/paymentModel");
const Customer = require("../../models/Customer/customerModel");
const errorHandler = require("../../utils/errorHandler");
const razorpayInstance = require("../../config/razorpay");
const InspectionEnquiry = require("../../models/Customer/customerEnquiryForm");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");

const createOrderForEnquiry = async (req, res, next) => {
  try {
    if (req.user.role !== "customer") {
      return next(errorHandler(403, "Only customers can initiate payment"));
    }

    const { enquiryId } = req.params;

    const enquiry = await InspectionEnquiry.findById(enquiryId);
    if (!enquiry || enquiry.customer.toString() !== req.user._id.toString()) {
      return next(errorHandler(404, "Enquiry not found or unauthorized"));
    }

    if (enquiry.status !== "draft") {
      return next(
        errorHandler(400, "Payment already initiated or enquiry submitted")
      );
    }

    const customer = await Customer.findById(req.user._id).select(
      "name email phoneNumber"
    );
    if (!customer) {
      return next(errorHandler(404, "Customer profile not found"));
    }

    const amountInPaise = enquiry.inspectionBudget * 100;

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${enquiryId}`,
      payment_capture: 1,
    });

    const payment = await Payment.create({
      enquiry: enquiry._id,
      customer: req.user._id,
      amount: enquiry.inspectionBudget,
      currency: "INR",
      status: "pending",
      phase: "initial",
      razorpayOrderId: razorpayOrder.id,
    });

    res.status(201).json({
      success: true,
      message: "Razorpay order created",
      order: razorpayOrder,
      enquiryId: enquiry._id,
      paymentId: payment._id,
      customerDetails: {
        name: customer.name,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
      },
    });
  } catch (error) {
    next(
      errorHandler(500, "Failed to create Razorpay order: " + error.message)
    );
  }
};

const webHooksController = async (req, res, next) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const isWebhookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      webhookSignature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isWebhookValid) {
      return next(errorHandler(400, "Webhook Signature is not valid"));
    }

    const paymentDetails = req.body.payload.payment.entity;
    const orderId = paymentDetails.order_id;
    const payment = await PaymentModel.findOne({ orderId });
    if (!payment) {
      return next(errorHandler(400, "Payment record not found"));
    }
    payment.status = paymentDetails.status;
    await payment.save();

    const user = await User.findById(payment.userId);
    if (!user) {
      return next(errorHandler(400, "User not found"));
    }
    user.isPremium = true;
    user.membershipType = payment.notes.membershipType;
    await user.save();

    return res.status(200).json({ mes: "Webhook received successfully" });
  } catch (error) {
    console.error(error.message);
    return next(errorHandler(400, error.message));
  }
};

const paymentVerify = async (req, res, next) => {
  const { id } = req.user;
  const user = await User.findById(id);

  try {
    if (user?.isPremium) {
      return res.json({ isPremium: true });
    } else {
      return res.json({ isPremium: false });
    }
  } catch (error) {
    console.error(error.message);
    return next(errorHandler(400, error.message));
  }
};

module.exports = { createOrderForEnquiry, webHooksController, paymentVerify };
