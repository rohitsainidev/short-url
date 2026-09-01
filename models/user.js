const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      default: null,
    },

    googleId: {
      type: String,
      default: null,
    },

    profilePic: {
      type: String,
      default: "",
    },

    about: {
      type: String,
      default: "Hey there! I am using ShortURL.",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.user || mongoose.model("user", userSchema);