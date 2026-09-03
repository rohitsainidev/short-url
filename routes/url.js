const express = require("express");
const router = express.Router();
const Url = require("../models/url");
const checkAuth = require("../middleware/auth");

const {
  handleGenerateNewShortURL,
} = require("../controllers/url");

router.post("/", handleGenerateNewShortURL);

// Delete URL by ID
router.delete("/:id", checkAuth, async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);
    if (!url) {
      return res.status(404).json({ success: false, message: "URL not found" });
    }
    // Only owner can delete if createdBy is recorded
    if (url.createdBy && req.user && url.createdBy.toString() !== (req.user._id || req.user.id).toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this link" });
    }
    await Url.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "URL deleted successfully" });
  } catch (error) {
    console.error("Delete URL error:", error);
    return res.status(500).json({ success: false, message: "Server error deleting URL" });
  }
});

router.delete("/delete/:id", checkAuth, async (req, res) => {
  try {
    await Url.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "URL deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error" });
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