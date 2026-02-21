import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase credentials. Ensure environment variables are loaded.");
    process.exit(1);
}

const DIST_DIR = path.join(__dirname, 'dist');
const TARGET_FILE = path.join(DIST_DIR, 'tracker.js');

if (!fs.existsSync(TARGET_FILE)) {
    console.error(`Tracker file not found at ${TARGET_FILE}. Please build the project first.`);
    process.exit(1);
}

// In a real scenario, we use the Supabase Storage endpoint directly or the client
async function deployToCDN() {
    console.log('Deploying tracker.js to Supabase CDN Storage...');

    const fileData = fs.readFileSync(TARGET_FILE);
    const fileName = `tracker.min.js`; // using minified naming conventionally

    try {
        const bucketName = 'cdn-scripts';
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucketName}/${fileName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/javascript',
            },
            body: fileData
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Failed to upload:', err);
            process.exit(1);
        }

        console.log(`Successfully deployed ${fileName} to ${bucketName} bucket.`);
    } catch (error) {
        console.error('Deployment error:', error);
        process.exit(1);
    }
}

deployToCDN();
