const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  resetPassword,
  logoutUser,
} = require("../controllers/user");

// GET /user/logout
router.get("/logout", logoutUser);

// GET /user/signup
router.get("/signup", (req, res) => {
  res.render("signup", {
    error:   req.query.error   || null,
    success: req.query.success || null,
    created: req.query.created || null,
  });
});

// GET /user/login
router.get("/login", (req, res) => {
  res.render("login", {
    error:   req.query.error   || null,
    success: req.query.success || null,
  });
});

// GET /user/forgot-password
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", {
    error:   req.query.error   || null,
    success: req.query.success || null,
  });
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", resetPassword);

module.exports = router;