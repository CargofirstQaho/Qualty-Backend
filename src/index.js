const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/database")
const authRoutes = require("./routes/authentication/authRouter")
const customerRoutes = require("./routes/customer/customerRouter")
const inspectorRoutes = require("./routes/inspector/inspectorRouter")

const PORT = process.env.PORT || 3000;
const app = express();

const isProd = process.env.NODE_ENV === "production";
const FRONTEND_URL = isProd
  ? process.env.FRONTEND_URL_PROD
  : process.env.FRONTEND_URL_DEV;

app.use(cors({
  origin:FRONTEND_URL,
  credentials:true,
}
)); 

app.use(express.json());
app.use(cookieParser()); 

app.use("/auth",authRoutes);
app.use("/customer",customerRoutes);
app.use("/inspector", inspectorRoutes);

 
const serverAndDBconnect = async () => {   
  try { 
    await connectDB();
    app.listen(PORT, () => console.log("Server running on port:" + PORT));
  } catch (error) {
    console.error("Failed to connect to DB or server:", error.message);
    process.exit(1);
  } 
};
serverAndDBconnect();

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";
  return res.status(statusCode).json({ success: false, message });
});
