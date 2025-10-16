// server.js (CommonJS version)
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const path = require("path");

// Initialize app
const app = express();

// 🧠 Security Middlewares
app.use(helmet()); // Adds security headers
app.use(
  cors({
    origin: ["http://localhost:3000"], // frontend origin
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize()); // Prevent NoSQL injection

// 🛡️ Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 429,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

// 🗂️ Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🛣️ Routes
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const captchaRoutes = require("./routes/captchaRoutes"); // optional

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/captcha", captchaRoutes);

// 🧰 Global Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

// 🧩 Health Check
app.get("/", (req, res) => res.send("✅ CityPulse Backend is Running!"));

// 🚀 Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
  })
  .then(() => {
    console.log("🟢 MongoDB Connected Successfully");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server Running on port ${PORT}`));
  })
  .catch((err) => console.error("🔴 MongoDB Connection Error:", err));
