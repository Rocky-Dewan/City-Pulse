const Report = require("../models/Report");

exports.createReport = async (req, res) => {
  const { title, description, category, latitude, longitude } = req.body;
  const image = req.file?.filename || "";

  const report = new Report({
    title,
    description,
    category,
    image,
    location: {
      coordinates: [longitude, latitude],
    },
    createdBy: req.user.id,
  });

  await report.save();
  res.json(report);
};

exports.getReports = async (req, res) => {
  const reports = await Report.find().populate("createdBy", "name");
  res.json(reports);
};

exports.upvote = async (req, res) => {
  const report = await Report.findById(req.params.id);
  report.upvotes += 1;
  await report.save();
  res.json({ message: "Upvoted" });
};

exports.updateStatus = async (req, res) => {
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  res.json(report);
};
