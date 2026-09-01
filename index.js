const dashboardRoute = require("./routes/dashboard");
require("dotenv").config();   // ✅ Sabse pehle
const analyticsRoute = require("./routes/analytics");
const session = require("express-session");
const passport = require("./config/passport");
const authRoute = require("./routes/auth");
const cookieParser = require("cookie-parser");
const express = require("express");
const path = require("path");
const { connectMongoDB } = require("./connection");
const Url = require("./models/url");
const urlRoute = require("./routes/url");
const staticRouter = require("./routes/staticRouter");
const userRoute = require("./routes/user");
const mongoose = require("mongoose");


const jwt = require("jsonwebtoken");
const User = require("./models/user");

const app = express();
const PORT = 8001;
// MongoDB Connection
 

 mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log("Mongo error:", err));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.JWT_SECRET || "defaultsecret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(express.static(path.join(__dirname, "public")));

// Global User Extraction Middleware (Available to all EJS templates)
app.use(async (req, res, next) => {
  const token = req.cookies && req.cookies.token;
  if (!token) {
    req.user = null;
    res.locals.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultsecret");
    const userId = decoded.id || decoded._id;
    const user = await User.findById(userId).select("-password");
    if (user) {
      req.user = user;
      res.locals.user = user;
    } else {
      req.user = null;
      res.locals.user = null;
    }
  } catch (err) {
    req.user = null;
    res.locals.user = null;
  }
  next();
});

// Logout Handlers (Redirect to / URL Shortener Home Page)
app.get("/user/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.clearCookie("token");
  if (req.session) {
    req.session.destroy(() => {
      return res.redirect("/");
    });
  } else {
    return res.redirect("/");
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.clearCookie("token");
  if (req.session) {
    req.session.destroy(() => {
      return res.redirect("/");
    });
  } else {
    return res.redirect("/");
  }
});

// Routes
app.use("/dashboard", dashboardRoute);
app.use("/", staticRouter);
app.use("/url", urlRoute);
app.use("/user", userRoute);
app.use("/auth", authRoute);
app.use("/analytics", analyticsRoute);

// Redirect Route
app.get("/:shortId", async (req, res) => {
  try {
    const shortId = req.params.shortId;

    if (shortId === "favicon.ico" || shortId === "robots.txt") {
      return res.status(404).end();
    }

    const entry = await Url.findOneAndUpdate(
      { shortUrl: shortId },
      { 
        $inc: { clicks: 1 },
        $push: { 
          visitHistory: { 
            timestamp: new Date(),
            ip: req.ip || req.connection.remoteAddress || "127.0.0.1"
          } 
        }
      },
      { new: true }
    );

    if (!entry) {
      return res.status(404).redirect("/?error=" + encodeURIComponent("Short URL not found or has expired."));
    }

    let targetUrl = entry.originalUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    return res.redirect(targetUrl);
  } catch (error) {
    console.error("Redirect Error:", error);
    return res.status(500).redirect("/?error=" + encodeURIComponent("Internal Server Error"));
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});