const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Google Login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

// Google Callback
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) {
      console.error("Passport Google Auth Error:", err);
      return res.redirect(
        "/user/login?error=" +
          encodeURIComponent(err.message || "Google authentication error occurred.")
      );
    }

    if (!user) {
      console.error("Passport Google Auth Failed: No user returned", info);
      return res.redirect(
        "/user/login?error=" +
          encodeURIComponent("Google sign-in failed. Please try again.")
      );
    }

    try {
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      const isProduction = process.env.NODE_ENV === "production";

      res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      });

      if (req.session) {
        req.session.user = user;
      }

      return res.redirect("/dashboard");
    } catch (tokenErr) {
      console.error("Token creation error:", tokenErr);
      return res.redirect(
        "/user/login?error=" +
          encodeURIComponent("Failed to generate authentication session.")
      );
    }
  })(req, res, next);
});

module.exports = router;