import { describe, it, expect, beforeAll } from 'vitest';
import { encryptToken, decryptToken, generateEncryptionKey } from '@/lib/crypto';

describe('Token Encryption', () => {
  beforeAll(() => {
    // Ensure we have a valid encryption key
    if (!process.env.ENCRYPTION_KEY) {
      process.env.ENCRYPTION_KEY = generateEncryptionKey();
    }
  });

  it('should encrypt and decrypt tokens correctly', () => {
    const originalToken = 'test_access_token_12345';
    
    const encrypted = encryptToken(originalToken);
    expect(encrypted).toBeTypeOf('string');
    expect(encrypted).not.toBe(originalToken);
    expect(encrypted.split(':')).toHaveLength(3); // IV:AuthTag:Encrypted
    
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(originalToken);
  });

  it('should produce different ciphertext for the same input', () => {
    const token = 'same_token_content';
    
    const encrypted1 = encryptToken(token);
    const encrypted2 = encryptToken(token);
    
    expect(encrypted1).not.toBe(encrypted2);
    
    // But both should decrypt to the same value
    expect(decryptToken(encrypted1)).toBe(token);
    expect(decryptToken(encrypted2)).toBe(token);
  });

  it('should fail with tampered tokens', () => {
    const token = 'test_token';
    const encrypted = encryptToken(token);
    
    // Tamper with the encrypted string
    const tampered = encrypted.slice(0, -2) + 'XX';
    
    expect(() => decryptToken(tampered)).toThrow();
  });

  it('should fail with invalid format', () => {
    expect(() => decryptToken('invalid_format')).toThrow('Invalid encrypted token format');
    expect(() => decryptToken('only:one:colon')).toThrow(); // Will throw crypto error for invalid hex
    expect(() => decryptToken('too:many:colons:here')).toThrow('Invalid encrypted token format');
  });

  it('should handle empty tokens', () => {
    const emptyToken = '';
    const encrypted = encryptToken(emptyToken);
    const decrypted = decryptToken(encrypted);
    
    expect(decrypted).toBe(emptyToken);
  });

  it('should handle long tokens', () => {
    const longToken = 'a'.repeat(1000);
    const encrypted = encryptToken(longToken);
    const decrypted = decryptToken(encrypted);
    
    expect(decrypted).toBe(longToken);
  });

  it('should throw error if encryption key is missing', () => {
    const originalKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    
    expect(() => encryptToken('test')).toThrow('ENCRYPTION_KEY environment variable is not set');
    
    // Restore key
    process.env.ENCRYPTION_KEY = originalKey;
  });

  it('should generate valid encryption keys', () => {
    const key = generateEncryptionKey();
    
    expect(key).toBeTypeOf('string');
    expect(key).toHaveLength(64); // 32 bytes = 64 hex chars
    expect(/^[0-9a-f]+$/.test(key)).toBe(true); // Only hex characters
  });
});