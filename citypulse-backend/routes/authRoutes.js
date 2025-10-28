// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) return done(null, existingUser);

        const newUser = await User.create({
          googleId: profile.id,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          email: profile.emails[0].value,
          avatar: profile.photos[0].value,
          role: "user", // default role
        });

        done(null, newUser);
      } catch (err) {
        console.error("Google OAuth error:", err);
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// ---------- ROUTES ----------
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/login" }),
  async (req, res) => {
    try {
      const user = req.user;

      // Generate JWT token
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      // Redirect to frontend with token as query param
      res.redirect(`http://localhost:3000?token=${token}`);
    } catch (err) {
      console.error("Callback error:", err);
      res.redirect("http://localhost:3000/login");
    }
  }
);

module.exports = router;
