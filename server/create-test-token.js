// Script to create a test JWT token
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Setup paths for dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '..', '.env');

// Load environment variables
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn('No .env file found, using environment variables if present');
  dotenv.config();
}

const createToken = () => {
  // This is just for testing - we're creating a token for user ID 1
  const payload = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    phoneNumber: null,
    firstName: 'Test',
    lastName: 'User',
    photoURL: null,
    authProvider: 'test',
    providerId: 'test-provider'
  };
  const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
  const token = jwt.sign(payload, secret, { expiresIn: '24h' });
  
  console.log('Test token:', token);
  return token;
};

createToken();
