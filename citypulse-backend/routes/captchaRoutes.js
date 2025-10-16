// routes/captchaRoutes.js (CommonJS version)
const express = require("express");
const axios = require("axios");

const router = express.Router();

// Verify Google reCAPTCHA
router.post("/verify", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Captcha token is missing" });
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token,
        },
      }
    );

    const data = response.data;

    if (!data.success || (data.score !== undefined && data.score < 0.5)) {
      return res.status(403).json({ message: "Captcha verification failed" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Captcha verification failed:", err);
    res.status(500).json({ message: "Captcha verification error" });
  }
});

module.exports = router;
