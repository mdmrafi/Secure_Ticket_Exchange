import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure_asset_exchange';
const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');

console.log('='.repeat(60));
console.log('  MONGODB CONNECTION TEST UTILITY');
console.log('='.repeat(60));
console.log(`Connecting to: ${maskedUri}`);

const startTime = Date.now();

try {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  const latency = Date.now() - startTime;
  const adminDb = mongoose.connection.db.admin();
  const pingResult = await adminDb.ping();

  console.log('\n[SUCCESS] Connected to MongoDB successfully!');
  console.log(`- Host: ${mongoose.connection.host}`);
  console.log(`- Port: ${mongoose.connection.port}`);
  console.log(`- Database Name: ${mongoose.connection.name}`);
  console.log(`- Connection State: ${mongoose.connection.readyState === 1 ? 'READY (1)' : mongoose.connection.readyState}`);
  console.log(`- Ping Latency: ${latency}ms`);
  console.log(`- Ping Response:`, pingResult);
  console.log('\nDatabase connection layer is functioning as expected.');

  await mongoose.disconnect();
  console.log('Disconnected cleanly.');
  process.exit(0);
} catch (error) {
  const duration = Date.now() - startTime;
  console.error('\n[FAILED] Could not connect to MongoDB:');
  console.error(`- Error: ${error.message}`);
  console.error(`- Duration before timeout/error: ${duration}ms\n`);
  console.log('Troubleshooting tips:');
  console.log('1. If using local MongoDB, ensure the service is running:');
  console.log('   - Windows Service: Run `net start MongoDB` or check Services app.');
  console.log('   - Docker: `docker run -d -p 27017:27017 --name mongo mongo:latest`');
  console.log('2. If using MongoDB Atlas, set MONGODB_URI in backend/.env:');
  console.log('   - Example: MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/secure_asset_exchange?retryWrites=true&w=majority');
  console.log('3. Ensure your IP address is whitelisted in Atlas Network Access.\n');

  process.exit(1);
}
