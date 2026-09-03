const express = require("express");
const router = express.Router();

const Url = require("../models/url");
const Contact = require("../models/contact");

// ======================================================
// HOME PAGE
// ======================================================

router.get("/", async (req, res) => {
    try {
        const urls = await Url.find()
            .sort({ createdAt: -1 })
            .limit(10);

        const user =
            req.user ||
            res.locals.user ||
            (req.session && req.session.user) ||
            null;

        res.render("home", {
            urls,
            user,
            baseUrl: `${req.protocol}://${req.get("host")}`,
            shortUrl: req.query.shortUrl || null,
            originalUrl: req.query.originalUrl || null
        });

    } catch (error) {
        console.error("Home Page Error:", error);

        const user =
            req.user ||
            res.locals.user ||
            (req.session && req.session.user) ||
            null;

        res.render("home", {
            urls: [],
            user,
            baseUrl: `${req.protocol}://${req.get("host")}`,
            shortUrl: null,
            originalUrl: null
        });
    }
});


// ======================================================
// MY URLS (Redirect to Dashboard My URLs)
// ======================================================

router.get("/myurls", (req, res) => {
    return res.redirect("/dashboard/myurls");
});


// ======================================================
// CONTACT FORM
// ======================================================

router.post("/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all fields."
            });
        }

        const newContact = await Contact.create({
            name: name.trim(),
            email: email.trim(),
            message: message.trim()
        });

        return res.status(200).json({
            success: true,
            message: "Message sent successfully!",
            data: newContact
        });

    } catch (error) {
        console.error("Contact Form Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send message. Please try again."
        });
    }
});


// ======================================================
// LOGOUT
// ======================================================

router.get("/logout", (req, res) => {
    res.clearCookie("token", {
        path: "/"
    });

    res.clearCookie("token");

    if (req.session) {
        req.session.destroy((error) => {
            if (error) {
                console.error("Session Destroy Error:", error);
            }

            return res.redirect("/");
        });
    } else {
        return res.redirect("/");
    }
});


// ======================================================
// EXPORT
// ======================================================

module.exports = router;