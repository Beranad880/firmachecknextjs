const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

// Basic manual parsing of .env / .env.local files if environment variables are not already set
function loadEnv() {
    const envPaths = [
        path.join(process.cwd(), '.env'),
        path.join(process.cwd(), '.env.local')
    ];

    for (const envPath of envPaths) {
        if (fs.existsSync(envPath)) {
            try {
                const content = fs.readFileSync(envPath, 'utf8');
                const lines = content.split('\n');
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#')) continue;
                    
                    const firstEqual = trimmed.indexOf('=');
                    if (firstEqual === -1) continue;
                    
                    const key = trimmed.substring(0, firstEqual).trim();
                    let val = trimmed.substring(firstEqual + 1).trim();
                    
                    // Strip quotes if any
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.substring(1, val.length - 1);
                    }
                    
                    if (!process.env[key]) {
                        process.env[key] = val;
                    }
                }
            } catch (err) {
                console.warn(`Warning: Failed to parse env file at ${envPath}:`, err.message);
            }
        }
    }
}

// Load env variables
loadEnv();

const connectionUrl = process.env.TURSO_CONNECTION_URL || process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!connectionUrl) {
    console.error('Error: TURSO_CONNECTION_URL or TURSO_DATABASE_URL environment variable is missing.');
    process.exit(1);
}

console.log('Connecting to Turso DB at:', connectionUrl);

async function init() {
    try {
        // Read schema file
        const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
        if (!fs.existsSync(schemaPath)) {
            console.error(`Error: Schema file not found at ${schemaPath}`);
            process.exit(1);
        }
        
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log('Read schema from db/schema.sql.');

        // Initialize Turso Client
        const client = createClient({
            url: connectionUrl,
            authToken: authToken
        });

        console.log('Initializing database schema...');
        
        // Execute schema SQL. Since it might contain multiple statements, we can run them.
        // Turso client supports client.execute() for single statements and client.batch() or just executing the string.
        // Let's execute the SQL string. We can split it by semicolon if needed, or Turso client might support direct executing of simple schemas.
        // Let's execute statements one by one for maximum compatibility.
        const statements = schemaSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            await client.execute(statement);
        }

        console.log('SUCCESS: Database initialized successfully. Companies table is ready!');
        await client.close();
        process.exit(0);
    } catch (error) {
        console.error('DATABASE INITIALIZATION FAILED:', error);
        process.exit(1);
    }
}

init();
