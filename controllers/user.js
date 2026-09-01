const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// REGISTER USER
async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;

    // Basic field check
    if (!name || !email || !password) {
      return res.redirect("/user/signup?error=All+fields+are+required");
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.redirect("/user/signup?error=Please+enter+a+valid+email+address");
    }

    // Password length
    if (password.length < 8) {
      return res.redirect("/user/signup?error=Password+must+be+at+least+8+characters");
    }

    // Duplicate email check
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.redirect("/user/signup?error=This+email+is+already+registered.+Please+sign+in.");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    // Auto-login newly registered user
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.cookie("token", token, { httpOnly: true });
    if (req.session) {
      req.session.user = newUser;
    }

    // Redirect to signup with success flag — popup will show and redirect to dashboard
    return res.redirect("/user/signup?created=1");

  } catch (error) {
    console.error("Register error:", error);
    return res.redirect("/user/signup?error=Something+went+wrong.+Please+try+again.");
  }
}


// LOGIN USER
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // Basic field check
    if (!email || !password) {
      return res.redirect("/user/login?error=Email+and+password+are+required");
    }

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.redirect("/user/login?error=Please+enter+a+valid+email+address");
    }

    // Find user (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.redirect("/user/login?error=No+account+found+with+this+email");
    }

    // Google-only account
    if (!user.password) {
      return res.redirect("/user/login?error=This+account+uses+Google+Sign-In.+Please+continue+with+Google.");
    }

    // Password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.redirect("/user/login?error=Incorrect+password.+Please+try+again.");
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set cookie
    res.cookie("token", token, { httpOnly: true });

    // Save session
    req.session.user = user;

    return res.redirect("/dashboard");

  } catch (error) {
    console.error("Login error:", error);
    return res.redirect("/user/login?error=Something+went+wrong.+Please+try+again.");
  }
}


// RESET / FORGOT PASSWORD
async function resetPassword(req, res) {
  try {
    const { email, password, confirmPassword } = req.body;

    // Basic check
    if (!email || !password || !confirmPassword) {
      return res.redirect("/user/forgot-password?error=All+fields+are+required");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.redirect("/user/forgot-password?error=Please+enter+a+valid+email+address");
    }

    // Password length
    if (password.length < 8) {
      return res.redirect("/user/forgot-password?error=Password+must+be+at+least+8+characters");
    }

    // Confirm match
    if (password !== confirmPassword) {
      return res.redirect("/user/forgot-password?error=Passwords+do+not+match");
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.redirect("/user/forgot-password?error=No+account+found+with+this+email+address");
    }

    // Check if Google-only account
    if (!user.password && user.googleId) {
      return res.redirect("/user/forgot-password?error=This+account+uses+Google+Sign-In.+Please+sign+in+with+Google.");
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    // Redirect to login with success message
    return res.redirect("/user/login?success=Password+reset+successfully!+Please+sign+in+with+your+new+password.");

  } catch (error) {
    console.error("Forgot password error:", error);
    return res.redirect("/user/forgot-password?error=Something+went+wrong.+Please+try+again.");
  }
}


// LOGOUT USER (Redirect to Landing Page)
async function logoutUser(req, res) {
  try {
    res.clearCookie("token", { path: "/" });
    res.clearCookie("token");
    if (req.session) {
      req.session.destroy(() => {
        return res.redirect("/");
      });
    } else {
      return res.redirect("/");
    }
  } catch (error) {
    console.error("Logout error:", error);
    res.clearCookie("token", { path: "/" });
    res.clearCookie("token");
    return res.redirect("/");
  }
}


module.exports = {
  registerUser,
  loginUser,
  resetPassword,
  logoutUser,
};