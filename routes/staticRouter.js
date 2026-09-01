const express = require("express");
const router = express.Router();
const Url = require("../models/url");

router.get("/", async (req, res) => {
    try {
        const urls = await Url.find().sort({ createdAt: -1 }).limit(10);
        const user = req.user || res.locals.user || (req.session && req.session.user) || null;

        res.render("home", {
            urls,
            user,
            baseUrl: `${req.protocol}://${req.get("host")}`,
            shortUrl: req.query.shortUrl || null,
            originalUrl: req.query.originalUrl || null
        });
    } catch (err) {
        console.error(err);
        const user = req.user || res.locals.user || (req.session && req.session.user) || null;
        res.render("home", { urls: [], user, baseUrl: `${req.protocol}://${req.get("host")}`, shortUrl: null, originalUrl: null });
    }
});

router.get("/myurls", async (req, res) => {
    const user = req.session.user;

    if (!user) {
        return res.redirect("/user/login");
    }

    try {
        const urls = await Url.find({ createdBy: user._id }).sort({ createdAt: -1 });

        res.render("myurls", {
            user,
            urls,
        });
    } catch (err) {
        console.error(err);
        res.redirect("/dashboard/myurls");
    }
});

const Contact = require("../models/contact");

router.post("/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: "Please fill in all fields." });
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
    } catch (err) {
        console.error("Contact form error:", err);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to send message. Please try again." 
        });
    }
});

router.get("/logout", (req, res) => {
    res.clearCookie("token", { path: "/" });
    res.clearCookie("token");
    if (req.session) {
        req.session.destroy();
    }
    return res.redirect("/");
});

module.exports = router;
