import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { startBot, shutdownBot } from '@butterfly-lady/bot';
import type { Client } from '@butterfly-lady/bot';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (3 levels up from dist/index.js)
config({ path: resolve(__dirname, '../../../.env') });

// Environment configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const STATUS_CHANNEL_ID = process.env.STATUS_CHANNEL_ID; // Optional: for bot status notifications

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  console.error('❌ Missing required environment variables:');
  if (!DISCORD_TOKEN) console.error('  - DISCORD_TOKEN');
  if (!DISCORD_CLIENT_ID) console.error('  - DISCORD_CLIENT_ID');
  process.exit(1);
}

// Store client reference for shutdown
let client: Client | null = null;

// Shutdown flag to prevent multiple shutdown calls
let isShuttingDown = false;

/**
 * Graceful shutdown
 */
async function shutdown(signal: string): Promise<void> {
  // Prevent multiple shutdown calls
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  
  console.log(`\n📴 Received ${signal}, shutting down gracefully...`);
  
  try {
    if (client) {
      await shutdownBot(client, STATUS_CHANNEL_ID);
    }
    
    // Exit cleanly
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

// Handle unhandled rejections
process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

// Start the bot
console.log('🦋 Starting Butterfly Lady...');
console.log('🔧 Environment:', process.env.NODE_ENV || 'development');

startBot({
  token: DISCORD_TOKEN,
  clientId: DISCORD_CLIENT_ID,
  statusChannelId: STATUS_CHANNEL_ID
}).then(botClient => {
  client = botClient;
}).catch(error => {
  console.error('❌ Failed to start bot:', error);
  process.exit(1);
});
