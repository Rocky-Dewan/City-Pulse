const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

// Rate limiting per IP
const attempts = {};

const sanitizeInput = (val) => (typeof val === "string" ? val.replace(/['";$<>]/g, "") : val);

async function verifyRecaptcha(token) {
  if (!token) return false;
  const secret = process.env.RECAPTCHA_SECRET;
  const resp = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${secret}&response=${token}`
  });
  const j = await resp.json();
  return j.success;
}

function checkRateLimit(ip) {
  const now = Date.now();
  if (!attempts[ip]) attempts[ip] = [];
  attempts[ip] = attempts[ip].filter(t => now - t < 10 * 60 * 1000); // last 10 mins
  if (attempts[ip].length >= 6) return false;
  attempts[ip].push(now);
  return true;
}

exports.signup = async (req, res) => {
  try {
    const ip = req.ip;
    if (!checkRateLimit(ip)) return res.status(429).json({ message: "Too many attempts, try later" });

    const recaptchaValid = await verifyRecaptcha(req.body.recaptchaToken);
    if (!recaptchaValid) return res.status(400).json({ message: "reCAPTCHA verification failed" });

    const {
      firstName, lastName, email, password,
      phone, countryCode, address, city,
      location, gender, age
    } = req.body;

    // Sanitize inputs
    const data = { firstName, lastName, email, password, phone, countryCode, address, city, location, gender, age };
    for (let k in data) data[k] = sanitizeInput(data[k]);

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) return res.status(400).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(data.password, 10);

    const user = new User({ ...data, password: hashed });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const ip = req.ip;
    if (!checkRateLimit(ip)) return res.status(429).json({ message: "Too many attempts, try later" });

    const { email, password, recaptchaToken } = req.body;

    const recaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaValid) return res.status(400).json({ message: "reCAPTCHA verification failed" });

    const user = await User.findOne({ email: sanitizeInput(email) });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
