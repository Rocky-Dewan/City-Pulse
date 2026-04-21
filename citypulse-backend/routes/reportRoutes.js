const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const {
  createReport,
  toggleUpvote,
  updateStatus,
  getTopReports,
} = require('../controllers/reportController');

// GET  /api/reports          — Top upvoted reports (public fallback, no auth needed)
router.get('/', getTopReports);

// POST /api/reports          — Submit a new report (auth required, spam check)
router.post('/', verifyToken, createReport);

// PUT  /api/reports/:id/upvote — Toggle upvote on a report (auth required)
router.put('/:id/upvote', verifyToken, toggleUpvote);

// PUT  /api/reports/:id/status — Update report status (admin only)
router.put('/:id/status', verifyToken, requireAdmin, updateStatus);

module.exports = router;
