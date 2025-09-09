const InspectionEnquiry = require("../../models/Customer/customerEnquiryForm");
const Customer = require("../../models/Customer/customerModel");
const errorHandler = require("../../utils/errorHandler");

const raiseEnquiryController = async (req, res, next) => {
  try {
    if (req.user.role !== "customer") {
      return next(errorHandler(403, "Only customers can raise enquiries"));
    }

    const customer = await Customer.findById(req.user._id).select("publishRequirements documents");

    if (!customer) {
      return next(errorHandler(404, "Customer not found"));
    }

    if (
      customer.publishRequirements &&
      (!customer.documents?.tradeLicense || !customer.documents?.importExportCertificate)
    ) {
      return next(
        errorHandler(
          403,
          "You must upload both Trade License and Import Export Certificate before raising an enquiry"
        )
      );
    }

    const {
      inspectionTypes,
      physicalParameters,
      chemicalParameters,
      ...rest
    } = req.body;

    const enquiryData = {
      ...rest,
      customer: req.user._id,
      inspectionTypes: {
        physical: inspectionTypes?.physical || false,
        chemical: inspectionTypes?.chemical || false,
      },
    };

    if (inspectionTypes?.physical) {
      enquiryData.physicalParameters = physicalParameters;
    }

    if (inspectionTypes?.chemical) {
      enquiryData.chemicalParameters = chemicalParameters;
    }

    const newEnquiry = await InspectionEnquiry.create(enquiryData);

    res.status(201).json({
      success: true,
      message: "Inspection enquiry raised successfully",
      enquiry: newEnquiry,
    });
  } catch (error) {
    next(errorHandler(500, "Failed to raise enquiry: " + error.message));
  }
};

module.exports = raiseEnquiryController;
