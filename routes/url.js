const express = require("express");
const router = express.Router();
const Url = require("../models/url");
const checkAuth = require("../middleware/auth");

const {
  handleGenerateNewShortURL,
} = require("../controllers/url");

router.post("/", checkAuth, handleGenerateNewShortURL);

// routes/url.js (add this)
router.delete("/delete/:id", async (req, res) => {
  try {
    await Url.findByIdAndDelete(req.params.id);
    res.status(200).send("Deleted");
  } catch (error) {
    res.status(500).send("Error");
  }
});

//editttttttttttt
router.put("/edit/:id", async (req, res) => {
    try {

        const { originalUrl } = req.body;

        await Url.findByIdAndUpdate(
            req.params.id,
            { originalUrl }
        );

        res.status(200).json({
            success: true
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false
        });

    }
});

module.exports = router;