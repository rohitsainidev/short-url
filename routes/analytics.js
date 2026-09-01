const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("analytics/dashboard");
});

module.exports = router;