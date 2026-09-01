const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const checkAuth = require("../middleware/auth");
const Url = require("../models/url");
const User = require("../models/user");

 
// ================= Dashboard =================
router.get("/", checkAuth, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const urls = await Url.find({
            $or: [
                { createdBy: userId },
                { createdBy: { $exists: false } },
                { createdBy: null }
            ]
        }).sort({ createdAt: -1 });

        const totalUrls = urls.length;

        const totalClicks = urls.reduce((sum, url) => {
            return sum + (url.clicks || 0);
        }, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayUrls = urls.filter(url => {
            return new Date(url.createdAt) >= today;
        });

        const todayClicks = todayUrls.reduce((sum, url) => {
            return sum + (url.clicks || 0);
        }, 0);

        const averageClicks =
            totalUrls > 0
                ? (totalClicks / totalUrls).toFixed(1)
                : 0;

        const stats = {
            totalUrls,
            totalClicks,
            todayClicks,
            averageClicks
        };

        // Latest URL
        const latestUrl = urls.length > 0 ? urls[0] : null;

        // Top Performer
        const topPerformer =
            urls.length > 0
                ? urls.reduce((best, current) =>
                    current.clicks > best.clicks ? current : best
                )
                : null;

        // Recent Activity (Latest 5 URLs)
        const recentActivity = urls.slice(0, 5);

        res.render("dashboard/dashboard", {
            stats,
            urls,
            latestUrl,
            topPerformer,
            recentActivity
        });

    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).send("Server Error");
    }
});


// ================= Analytics =================
router.get("/analytics", checkAuth, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const urls = await Url.find({
            $or: [
                { createdBy: userId },
                { createdBy: { $exists: false } },
                { createdBy: null }
            ]
        }).sort({ createdAt: -1 }).lean();

        const totalUrls = urls.length;

        const totalClicks = urls.reduce((sum, url) => {
            return sum + (url.clicks || 0);
        }, 0);

        const averageClicks =
            totalUrls > 0
                ? (totalClicks / totalUrls).toFixed(1)
                : 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayClicks = urls
            .filter(url => new Date(url.createdAt) >= today)
            .reduce((sum, url) => sum + (url.clicks || 0), 0);

        res.render("dashboard/analytics", {
            urls,
            stats: {
                totalUrls,
                totalClicks,
                averageClicks,
                todayClicks
            }
        });

    } catch (error) {
        console.error("Analytics error:", error);
        res.status(500).send("Server Error");
    }
});


// ================= My URLs =================
router.get("/myurls", checkAuth, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const urls = await Url.find({
            $or: [
                { createdBy: userId },
                { createdBy: { $exists: false } },
                { createdBy: null }
            ]
        }).sort({ createdAt: -1 });

        res.render("dashboard/myurls", {
            urls,
        });

    } catch (error) {
        console.error("MyURLs error:", error);
        res.status(500).send("Server Error");
    }
});


// ================= Profile =================
router.get("/profile", checkAuth, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const user = await User.findById(userId);

        res.render("dashboard/profile", {
            user: user || req.user,
            success: req.query.success || null,
            error: req.query.error || null,
        });
    } catch (error) {
        console.error("Profile error:", error);
        res.render("dashboard/profile", {
            user: req.user,
            success: null,
            error: "Failed to load profile details",
        });
    }
});

// Update Profile Name & About (Supports both JSON & Form POST)
router.post("/profile/update", checkAuth, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { name, about } = req.body;
        
        const updateData = {};
        if (name !== undefined) {
            if (!name || name.trim().length < 2) {
                if (req.headers['content-type']?.includes('application/json')) {
                    return res.status(400).json({ success: false, error: "Name must be at least 2 characters" });
                }
                return res.redirect("/dashboard/profile?error=Name+must+be+at+least+2+characters");
            }
            updateData.name = name.trim();
        }

        if (about !== undefined) {
            updateData.about = about.trim() || "Hey there! I am using ShortURL.";
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

        if (req.headers['content-type']?.includes('application/json')) {
            return res.json({ success: true, message: "Profile updated successfully!", user: updatedUser });
        }
        return res.redirect("/dashboard/profile?success=Profile+updated+successfully!");
    } catch (error) {
        console.error("Update profile error:", error);
        if (req.headers['content-type']?.includes('application/json')) {
            return res.status(500).json({ success: false, error: "Failed to update profile" });
        }
        return res.redirect("/dashboard/profile?error=Failed+to+update+profile");
    }
});

// Update Profile Picture (Base64 or URL)
router.post("/profile/avatar", checkAuth, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { profilePic } = req.body;

        if (!profilePic) {
            return res.status(400).json({ success: false, error: "No image provided" });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { profilePic }, { new: true });
        return res.json({ success: true, message: "Profile photo updated successfully!", profilePic: updatedUser.profilePic });
    } catch (error) {
        console.error("Avatar update error:", error);
        return res.status(500).json({ success: false, error: "Failed to update profile photo" });
    }
});

// Remove Profile Picture
router.post("/profile/avatar/remove", checkAuth, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        await User.findByIdAndUpdate(userId, { profilePic: "" }, { new: true });
        return res.json({ success: true, message: "Profile photo removed successfully!" });
    } catch (error) {
        console.error("Avatar remove error:", error);
        return res.status(500).json({ success: false, error: "Failed to remove profile photo" });
    }
});

// Change Password (Supports both JSON & Form POST)
router.post("/profile/password", checkAuth, async (req, res) => {
    const isJson = req.headers['content-type']?.includes('application/json') || req.xhr;

    try {
        const userId = req.user._id || req.user.id;
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            if (isJson) return res.status(404).json({ success: false, error: "User not found" });
            return res.redirect("/dashboard/profile?error=User+not+found");
        }

        if (user.password) {
            if (!currentPassword) {
                if (isJson) return res.status(400).json({ success: false, error: "Please enter your current password" });
                return res.redirect("/dashboard/profile?error=Please+enter+your+current+password");
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                if (isJson) return res.status(400).json({ success: false, error: "Current password is incorrect" });
                return res.redirect("/dashboard/profile?error=Current+password+is+incorrect");
            }
        }

        if (!newPassword || newPassword.length < 8) {
            if (isJson) return res.status(400).json({ success: false, error: "New password must be at least 8 characters" });
            return res.redirect("/dashboard/profile?error=New+password+must+be+at+least+8+characters");
        }

        if (newPassword !== confirmNewPassword) {
            if (isJson) return res.status(400).json({ success: false, error: "New passwords do not match" });
            return res.redirect("/dashboard/profile?error=New+passwords+do+not+match");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        if (isJson) return res.json({ success: true, message: "Password changed successfully!" });
        return res.redirect("/dashboard/profile?success=Password+changed+successfully!");
    } catch (error) {
        console.error("Change password error:", error);
        if (isJson) return res.status(500).json({ success: false, error: "Failed to change password" });
        return res.redirect("/dashboard/profile?error=Failed+to+change+password");
    }
});

// ================= Settings & Logout =================
router.get("/settings", checkAuth, (req, res) => {
    res.redirect("/dashboard/profile");
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