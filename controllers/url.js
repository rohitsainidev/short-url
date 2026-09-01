const { nanoid } = require("nanoid");
const Url = require("../models/url");

async function handleGenerateNewShortURL(req, res) {
    let { originalUrl } = req.body;

    if (!originalUrl || originalUrl.trim() === "") {
        return res.status(400).redirect("/?error=" + encodeURIComponent("URL is required"));
    }

    originalUrl = originalUrl.trim();
    if (!/^https?:\/\//i.test(originalUrl)) {
        originalUrl = "https://" + originalUrl;
    }

    const shortId = nanoid(5);

    await Url.create({
        originalUrl,
        shortUrl: shortId,
        clicks: 0,
        visitHistory: [],
        createdBy: req.user ? (req.user._id || req.user.id) : undefined,
    });

    return res.redirect(
        "/?shortUrl=" +
        shortId +
        "&originalUrl=" +
        encodeURIComponent(originalUrl)
    );
}

module.exports = {
    handleGenerateNewShortURL,
};