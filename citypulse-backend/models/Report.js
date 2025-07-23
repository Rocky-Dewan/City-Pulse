// models/Report.js
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  image: String, // URL
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Resolved"],
    default: "Pending",
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

reportSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Report", reportSchema);
