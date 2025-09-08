const { check, validationResult } = require("express-validator");

const passwordRules = () =>
  check("password")
    .isLength({ min: 8, max: 20 }).withMessage("Password must be between 8 and 20 characters")
    .matches(/[A-Z]/).withMessage("Must include at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Must include at least one lowercase letter")
    .matches(/\d/).withMessage("Must include at least one number")
    .matches(/[!@#$%^&*(){}:"<>?,.|]/).withMessage("Must include at least one special character");

const emailRule = (field = "email") =>
  check(field, "Invalid email format").isEmail();

const mobileRule = (field = "mobileNumber") =>
  check(field, "Invalid mobile number").matches(/^\d{6,15}$/);

const countryCodeRule = () =>
  check("countryCode", "Invalid country code").matches(/^\+\d{1,4}$/);

const signUpValidation = () => {
  return [
    check("role", "Role is required").isIn(["customer", "inspector", "inspection company"]),

    (req, res, next) => {
      const role = req.body.role;

      let validations = [];

      if (role === "customer") {
        validations = [
          check("name", "Name is required").isString().isLength({ min: 2 }),
          emailRule(),
          passwordRules(),
          countryCodeRule(),
          mobileRule(),
          check("address", "Address too long").optional().isLength({ max: 100 }),
          check("publishRequirements").optional().isBoolean(),
          check("documents.tradeLicense", "Trade license is required")
            .if(check("publishRequirements").equals("true"))
            .notEmpty(),
          check("documents.importExportCertificate", "Import/Export certificate is required")
            .if(check("publishRequirements").equals("true"))
            .notEmpty(),
        ];
      }

      if (role === "inspector") {
        validations = [
          check("name", "Name is required").isString().isLength({ min: 2 }),
          emailRule(),
          passwordRules(),
          countryCodeRule(),
          mobileRule(),
          check("address", "Address too long").optional().isLength({ max: 100 }),
          check("inspectorType", "Inspector type must be 'indian' or 'international'")
            .isIn(["indian", "international"]),
          check("acceptsRequests").optional().isBoolean(),
          check("identityDocuments.aadhaarCard", "Aadhaar card is required")
            .if(check("acceptsRequests").equals("true"))
            .notEmpty(),
          check("billingDetails.accountNumber", "Account number is required")
            .if(check("acceptsRequests").equals("true"))
            .notEmpty(),
          check("billingDetails.bankName", "Bank name is required")
            .if(check("acceptsRequests").equals("true"))
            .notEmpty(),
          check("billingDetails.ifscCode", "IFSC code is required")
            .if(check("acceptsRequests").equals("true"))
            .notEmpty(),
          check("commodities").isArray().withMessage("Commodities must be an array"),
          check("commodities.*.commodity", "Commodity is required").notEmpty(),
          check("commodities.*.experienceYears", "Experience must be a number")
            .isInt({ min: 0, max: 50 }),
        ];
      }

      if (role === "inspection company") {
        validations = [
          check("contactPersonName", "Contact person name is required").isString().isLength({ min: 2 }),
          emailRule("companyEmail"),
          passwordRules(),
          countryCodeRule(),
          check("companyPhoneNumber", "Invalid company phone number").matches(/^\d{6,15}$/),
          mobileRule(),
          check("companyName", "Company name is required").isString().isLength({ min: 2 }),
          check("businessLicenseNumber", "License number is required").notEmpty(),
          check("companyAddress", "Address is required").isLength({ min: 5 }),
          check("website", "Invalid website URL").optional().isURL(),
          check("yearEstablished", "Invalid year").isInt({ min: 1900, max: new Date().getFullYear() }),
          check("employeeCount", "Invalid employee count").isIn(["1-10", "11-50", "51-200", "201-500", "500+"]),
          check("servicesOffered", "Too long").optional().isLength({ max: 1000 }),
          check("companyType", "Company type must be 'indian' or 'international'")
            .isIn(["indian", "international"]),
          check("gstNumber", "Invalid GST number")
            .if(check("companyType").equals("indian"))
            .matches(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/),
          check("panNumber", "Invalid PAN number")
            .if(check("companyType").equals("indian"))
            .matches(/^[A-Z]{5}\d{4}[A-Z]{1}$/),
          check("cinNumber", "Invalid CIN number")
            .if(check("companyType").equals("indian"))
            .matches(/^[A-Z]{1}\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/),
          check("documents.businessLicense", "Business license is required").notEmpty(),
          check("documents.incorporationCertificate", "Incorporation certificate is required").notEmpty(),
          check("documents.insuranceDocument", "Insurance document is required").notEmpty(),
        ];
      }

      Promise.all(validations.map(validation => validation.run(req)))
        .then(() => next())
        .catch(next);
    },
  ];
};

const signInValidation = () => [
  emailRule(),
  check("password", "Password must be at least 8 characters").isLength({ min: 8 }),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

module.exports = {
  handleValidationErrors,
  signUpValidation,
  signInValidation,
};
