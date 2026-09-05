const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
      proxy: true,
    },
  async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;

    // 1. Pehle Google ID se check karo
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      return done(null, user);
    }

    // 2. Agar Google ID nahi mili to Email se check karo
    user = await User.findOne({ email });

    if (user) {
      // Existing account ko Google account se link kar do
      user.googleId = profile.id;
      user.profilePic = profile.photos?.[0]?.value || user.profilePic;
      await user.save();

      return done(null, user);
    }

    // 3. Agar user kahin bhi nahi mila to naya create karo
    user = await User.create({
      name: profile.displayName,
      email,
      googleId: profile.id,
      profilePic: profile.photos?.[0]?.value || "",
    });

    return done(null, user);

  } catch (error) {
    return done(error, null);
  }
}
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;