const jwt = require("jsonwebtoken");
const errorHandler = require("../utils/errorHandler");
const Customer = require("../models/Customer/customerModel");
const Inspector = require("../models/Inspector/inspectorModel");
const InspectionCompany = require("../models/InspectionCompany/inspectionCompamyModel");

const verifyUser = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return next(errorHandler(401, "Unauthorized access. Please login"));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(errorHandler(403, "Token has expired. Please log in again."));
      }
      if (err.name === "JsonWebTokenError") {
        return next(errorHandler(403, "Invalid token."));
      }
      return next(errorHandler(500, "Token verification failed."));
    }

    let user =
      (await Customer.findById(decoded.id).select("-password")) ||
      (await Inspector.findById(decoded.id).select("-password")) ||
      (await InspectionCompany.findById(decoded.id).select("-password"));

    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    req.user = user;
    req.role = user.role; 

    next();
  } catch (error) {
    return next(errorHandler(500, "Verification failed: " + error.message));
  }
};

module.exports = verifyUser;
