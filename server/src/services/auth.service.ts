import { prisma } from '../utils/prisma';
import { encrypt } from '../utils/encryption';

interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
}

export async function upsertUser(googleProfile: GoogleProfile, googleTokens: GoogleTokens) {
  const encryptedAccessToken = encrypt(googleTokens.accessToken);
  const encryptedRefreshToken = encrypt(googleTokens.refreshToken);

  const user = await prisma.user.upsert({
    where: { googleId: googleProfile.googleId },
    update: {
      email: googleProfile.email,
      name: googleProfile.name,
      avatarUrl: googleProfile.avatarUrl,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
    },
    create: {
      googleId: googleProfile.googleId,
      email: googleProfile.email,
      name: googleProfile.name,
      avatarUrl: googleProfile.avatarUrl,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
    },
  });

  return user;
}
