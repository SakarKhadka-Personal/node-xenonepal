const express = require("express");
const {
  getFinancialStats,
  createManualEntry,
  getManualEntries,
  updateManualEntry,
  deleteManualEntry,
  recalculateOrderProfits,
  forceRecalculateOrderProfits,
  resetAllFinancialData,
} = require("./finance.controller");
const { verifyAdmin } = require("../middleware/adminAuth");

const router = express.Router();

// Apply admin middleware to all routes
router.use(verifyAdmin);

// Admin financial stats routes
// GET /admin/finance/stats - Get financial summary
router.get("/stats", getFinancialStats);

// Manual entry routes
// POST /admin/finance/manual-entries - Create manual income/expense entry
router.post("/manual-entries", createManualEntry);

// GET /admin/finance/manual-entries - Get manual entries with filtering
router.get("/manual-entries", getManualEntries);

// PUT /admin/finance/manual-entries/:id - Update manual entry
router.put("/manual-entries/:id", updateManualEntry);

// DELETE /admin/finance/manual-entries/:id - Delete manual entry
router.delete("/manual-entries/:id", deleteManualEntry);

// POST /admin/finance/recalculate-profits - Recalculate profit data for orders missing it
router.post("/recalculate-profits", recalculateOrderProfits);

// POST /admin/finance/force-recalculate-profits - Force recalculate profit data for all delivered orders
router.post("/force-recalculate-profits", forceRecalculateOrderProfits);

// POST /admin/finance/reset-all-data - Reset all financial data (orders + manual entries)
router.post("/reset-all-data", resetAllFinancialData);

module.exports = router;
