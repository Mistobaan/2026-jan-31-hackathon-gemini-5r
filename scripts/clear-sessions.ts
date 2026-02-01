#!/usr/bin/env tsx
/**
 * CLI script to manage sessions in Vercel Blob storage
 * Usage:
 *   pnpm run sessions clear    - Delete all sessions
 *   pnpm run sessions list     - List all sessions
 *   pnpm run sessions cleanup  - Delete sessions older than 7 days
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { clearAllSessions, listAllSessions, cleanupOldSessions } from '../lib/blob-storage';

async function main() {
    const command = process.argv[2];

    if (!command) {
        console.log('Usage: pnpm run sessions <command>');
        console.log('');
        console.log('Commands:');
        console.log('  clear   - Delete all sessions');
        console.log('  list    - List all sessions');
        console.log('  cleanup - Delete sessions older than 7 days');
        process.exit(1);
    }

    switch (command) {
        case 'clear': {
            console.log('🗑️  Clearing all sessions...\n');
            const result = await clearAllSessions();
            console.log(`\n✅ Deleted ${result.deletedCount} blobs`);
            if (result.errors.length > 0) {
                console.log(`⚠️  ${result.errors.length} errors occurred:`);
                result.errors.forEach(err => console.log(`   - ${err}`));
            }
            break;
        }

        case 'list': {
            console.log('📋 Listing all sessions...\n');
            const sessions = await listAllSessions();
            if (sessions.length === 0) {
                console.log('No sessions found.');
            } else {
                console.log(`Found ${sessions.length} sessions:\n`);
                sessions.forEach(session => {
                    console.log(`  ID: ${session.sessionId}`);
                    console.log(`  Created: ${session.createdAt}`);
                    console.log(`  Status: ${session.status}`);
                    console.log('  ---');
                });
            }
            break;
        }

        case 'cleanup': {
            console.log('🧹 Cleaning up old sessions (older than 7 days)...\n');
            const deletedCount = await cleanupOldSessions();
            console.log(`✅ Deleted ${deletedCount} old blobs`);
            break;
        }

        default:
            console.error(`Unknown command: ${command}`);
            console.log('Available commands: clear, list, cleanup');
            process.exit(1);
    }
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
