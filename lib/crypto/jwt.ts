import jwt from 'jsonwebtoken';

export interface AppleJWTPayload {
  iss: string; // Team ID
  iat: number; // Issued at
  exp: number; // Expires at
}

export function generateAppleDeveloperToken(
  teamId: string,
  keyId: string,
  privateKey: string,
  expiresIn: string = '180d'
): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (180 * 24 * 60 * 60); // 180 days in seconds

  const payload: AppleJWTPayload = {
    iss: teamId,
    iat: now,
    exp: exp,
  };

  const options: jwt.SignOptions = {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: keyId,
    },
  };

  return jwt.sign(payload, privateKey, options);
}

export function verifyAppleDeveloperToken(token: string, publicKey: string): AppleJWTPayload {
  return jwt.verify(token, publicKey, { algorithms: ['ES256'] }) as AppleJWTPayload;
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as AppleJWTPayload;
    if (!decoded || !decoded.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch {
    return true;
  }
}