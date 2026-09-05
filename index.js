// ======================================================
// ENVIRONMENT VARIABLES
// ======================================================
require("dotenv").config();

// ======================================================
// IMPORTS
// ======================================================
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("./config/passport");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// Routes
const dashboardRoute = require("./routes/dashboard");
const analyticsRoute = require("./routes/analytics");
const authRoute = require("./routes/auth");
const urlRoute = require("./routes/url");
const staticRouter = require("./routes/staticRouter");
const userRoute = require("./routes/user");

// Models
const Url = require("./models/url");
const User = require("./models/user");

// ======================================================
// APP
// ======================================================
const app = express();

// Trust reverse proxy (Render, AWS, Heroku) for HTTPS detection & OAuth callbacks
app.set("trust proxy", 1);

// Render provides PORT automatically.
// Locally it will use 8001.
const PORT = process.env.PORT || 8001;

// ======================================================
// CHECK REQUIRED ENVIRONMENT VARIABLES
// ======================================================
console.log("Environment check:");

console.log(
  "MONGODB_URI:",
  process.env.MONGODB_URI ? "Loaded" : "Missing"
);

console.log(
  "GOOGLE_CLIENT_ID:",
  process.env.GOOGLE_CLIENT_ID ? "Loaded" : "Missing"
);

console.log(
  "GOOGLE_CLIENT_SECRET:",
  process.env.GOOGLE_CLIENT_SECRET ? "Loaded" : "Missing"
);

console.log(
  "JWT_SECRET:",
  process.env.JWT_SECRET ? "Loaded" : "Missing"
);

// ======================================================
// MONGODB CONNECTION
// ======================================================
if (!process.env.MONGODB_URI) {
  console.error("ERROR: MONGODB_URI is missing.");
} else {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
    });
}

// ======================================================
// VIEW ENGINE
// ======================================================
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// ======================================================
// MIDDLEWARE
// ======================================================
app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

app.use(cookieParser());

// ======================================================
// SESSION
// ======================================================
app.use(
  session({
    secret: process.env.JWT_SECRET || "defaultsecret",
    resave: false,
    saveUninitialized: false,
  })
);

// ======================================================
// PASSPORT
// ======================================================
app.use(passport.initialize());
app.use(passport.session());

// ======================================================
// STATIC FILES
// ======================================================
app.use(express.static(path.join(__dirname, "public")));

// ======================================================
// GLOBAL USER EXTRACTION MIDDLEWARE
// ======================================================
app.use(async (req, res, next) => {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    req.user = null;
    res.locals.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "defaultsecret"
    );

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

// ======================================================
// LOGOUT
// ======================================================
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

   // Test route
    app.get("/test", (req, res) => {
    res.send("Short URL Backend is Working!");
});

// ======================================================
// ROUTES
// ======================================================
app.use("/dashboard", dashboardRoute);

app.use("/", staticRouter);

app.use("/url", urlRoute);

app.use("/user", userRoute);

app.use("/auth", authRoute);

app.use("/analytics", analyticsRoute);

// ======================================================
// SHORT URL REDIRECT
// ======================================================
app.get("/:shortId", async (req, res) => {
  try {
    const shortId = req.params.shortId;

    // Ignore browser/system files
    if (
      shortId === "favicon.ico" ||
      shortId === "robots.txt"
    ) {
      return res.status(404).end();
    }

    const entry = await Url.findOneAndUpdate(
      {
        shortUrl: shortId,
      },
      {
        $inc: {
          clicks: 1,
        },

        $push: {
          visitHistory: {
            timestamp: new Date(),
            ip:
              req.ip ||
              req.connection.remoteAddress ||
              "127.0.0.1",
          },
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!entry) {
      return res
        .status(404)
        .redirect(
          "/?error=" +
            encodeURIComponent(
              "Short URL not found or has expired."
            )
        );
    }

    let targetUrl = entry.originalUrl.trim();

    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    return res.redirect(targetUrl);
  } catch (error) {
    console.error("Redirect Error:", error);

    return res
      .status(500)
      .redirect(
        "/?error=" +
          encodeURIComponent("Internal Server Error")
      );
  }
});

// ======================================================
// START SERVER
// ======================================================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});