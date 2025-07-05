const router = require("express").Router();
const {
  createReport,
  getReports,
  upvote,
  updateStatus,
} = require("../controllers/reportController");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.get("/", getReports);
router.post("/", verifyToken, upload.single("image"), createReport);
router.put("/:id/upvote", verifyToken, upvote);
router.put("/:id", verifyToken, isAdmin, updateStatus);

module.exports = router;
