const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  phone: { type: String },
  countryCode: { type: String, default: "+880" },
  address: { type: String },
  city: { type: String },
  location: { type: String },
  gender: { type: String, enum: ["male", "female", "other"] },
  age: { type: Number, min: 1 },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  googleId: { type: String },
  avatar: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
