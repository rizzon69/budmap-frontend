const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { sendWelcomeEmail } = require('../services/emailService');

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value.toLowerCase();
      let user = await User.findOne({ email });

      if (!user) {
        // First-time Google login — create account
        user = await User.create({
          email,
          password: null,
          firstName: profile.name.givenName || '',
          lastName: profile.name.familyName || '',
          role: 'viewer',
          avatar: profile.photos?.[0]?.value || null,
          isActive: true,
          isEmailVerified: true,
          authProvider: 'google',
          googleId: profile.id,
          lastLogin: new Date()
        });

        // Send welcome email for new Google users (non-blocking)
        sendWelcomeEmail(user.email, user.firstName).catch(() => {});
      } else {
        // Returning user — update last login & sync Google fields
        user.lastLogin = new Date();
        user.googleId = profile.id;
        user.isEmailVerified = true;
        if (!user.avatar && profile.photos?.[0]?.value) {
          user.avatar = profile.photos[0].value;
        }
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      console.error('[Passport] Google strategy error:', error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user._id || user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user || null);
  } catch (err) {
    done(err, null);
  }
});
