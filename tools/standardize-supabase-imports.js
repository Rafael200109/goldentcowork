#!/usr/bin/env node

/**
 * Script to standardize Supabase imports across the project
 * Changes all imports from 'supabase' (customSupabaseClient) to 'supabaseClient' (supabaseConfig)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

console.log('🔄 Starting Supabase import standardization...');

// Files that need to be updated (from our grep search)
const filesToUpdate = [
  'contexts/SupabaseAuthContext.jsx',
  'src/pages/UpdatePassword.jsx',
  'src/components/admin/AdminPhotoManager.jsx'
];

let totalFilesUpdated = 0;
let totalReferencesUpdated = 0;

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(projectRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let updated = false;
    let referenceCount = 0;

    // Update import statement
    const importRegex = /import\s*\{\s*supabase\s*\}\s*from\s*['"]@\/lib\/customSupabaseClient['"]/g;
    if (importRegex.test(content)) {
      content = content.replace(importRegex, "import { supabaseClient } from '@/config/supabaseConfig'");
      updated = true;
    }

    // Update all supabase. references to supabaseClient.
    const referenceRegex = /\bsupabase\.(\w+)/g;
    content = content.replace(referenceRegex, (match, method) => {
      referenceCount++;
      return `supabaseClient.${method}`;
    });

    if (updated || referenceCount > 0) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated ${filePath} (${referenceCount} references)`);
      totalFilesUpdated++;
      totalReferencesUpdated += referenceCount;
    }

  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Standardization complete!`);
console.log(`📊 Files updated: ${totalFilesUpdated}`);
console.log(`📊 Total references updated: ${totalReferencesUpdated}`);
console.log(`\n🔍 Next steps:`);
console.log(`1. Run 'npm run build' to verify everything compiles`);
console.log(`2. Test critical functionality (auth, payments, bookings)`);
console.log(`3. Check for any remaining 'supabase.' references that weren't updated`);