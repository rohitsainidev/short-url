const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
{
    originalUrl: {
        type: String,
        required: true,
    },

    shortUrl: {
        type: String,
        required: true,
        unique: true,
    },

    clicks: {
        type: Number,
        default: 0,
    },

    visitHistory: [
        {
            timestamp: {
                type: Date,
                default: Date.now,
            },

            ip: String,

            country: {
                type: String,
                default: "India",
            },

            device: String,

            browser: String,
        },
    ],

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }

},
{
    timestamps: true,
});

module.exports = mongoose.model("Url", urlSchema);