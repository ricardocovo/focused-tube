import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from '../utils/config';
import { upsertUser } from '../services/auth.service';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await upsertUser(
          {
            googleId: profile.id,
            email: profile.emails?.[0]?.value ?? '',
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
          },
          {
            accessToken: _accessToken,
            refreshToken: _refreshToken ?? '',
          }
        );
        done(null, user);
      } catch (err) {
        done(err as Error);
      }
    }
  )
);

export default passport;
