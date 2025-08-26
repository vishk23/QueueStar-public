#!/usr/bin/env node

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Configuration
const TEAM_ID = 'R78VP2V5AQ';  // Your Team ID
const KEY_ID = 'XK6Y22RNVQ';   // Your Key ID (from filename)
const PRIVATE_KEY_PATH = '/Users/vk/Downloads/AuthKey_XK6Y22RNVQ.p8';

// Read the private key
const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

// Create the token
const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',  // Token valid for 180 days
  issuer: TEAM_ID,
  header: {
    alg: 'ES256',
    kid: KEY_ID
  }
});

console.log('Your MusicKit Developer Token:');
console.log('================================');
console.log(token);
console.log('================================');
console.log('\nToken Details:');
console.log('- Team ID:', TEAM_ID);
console.log('- Key ID:', KEY_ID);
console.log('- Expires in: 180 days');
console.log('\nUse this token in the "Music Developer Token" field on the MusicKit JS page.');