// build.js - Production Build Script for MAI Services Marketplace
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const CLIENT_PUBLIC_DIR = path.join(ROOT_DIR, 'client', 'public');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

console.log('==================================================');
console.log('BUILDING PRODUCTION DIST: MAI Services Marketplace');
console.log('==================================================\n');

// 1. Ensure source files exist
if (!fs.existsSync(CLIENT_PUBLIC_DIR)) {
  console.error(`[ERROR] Source directory not found: ${CLIENT_PUBLIC_DIR}`);
  process.exit(1);
}

// 2. Clean or Create dist/ directory
if (fs.existsSync(DIST_DIR)) {
  console.log('[CLEAN] Removing previous dist/ directory...');
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });
console.log(`[INIT] Created fresh dist/ directory at: ${DIST_DIR}`);

// Helper: Copy directory recursively
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      const stats = fs.statSync(destPath);
      console.log(`[EMIT] dist/${path.relative(DIST_DIR, destPath)} (${(stats.size / 1024).toFixed(1)} KB)`);
    }
  }
}

// 3. Copy all client public files to dist/
console.log('\n[COPY] Copying frontend assets from client/public to dist/ ...');
copyDirSync(CLIENT_PUBLIC_DIR, DIST_DIR);

// Ensure assets directory exists in dist/
const distAssetsDir = path.join(DIST_DIR, 'assets');
if (!fs.existsSync(distAssetsDir)) {
  fs.mkdirSync(distAssetsDir, { recursive: true });
  console.log('[EMIT] dist/assets/ (directory created)');
}

// 4. Verify Critical Production Files in dist/
console.log('\n[VERIFY] Validating production build output...');
const criticalFiles = ['index.html', 'app.js', 'dashboard-components.js'];
let buildOk = true;

criticalFiles.forEach(file => {
  const target = path.join(DIST_DIR, file);
  if (fs.existsSync(target) && fs.statSync(target).size > 0) {
    const stats = fs.statSync(target);
    console.log(`  ✓ dist/${file} verified (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.error(`  ✗ Missing or empty critical file: dist/${file}`);
    buildOk = false;
  }
});

// 5. Verify All 31 Required React Components in dist/
const code1 = fs.readFileSync(path.join(DIST_DIR, 'dashboard-components.js'), 'utf8');
const code2 = fs.readFileSync(path.join(DIST_DIR, 'app.js'), 'utf8');
const bundleCode = code1 + '\n' + code2;

const reqs = [
  'Header', 'HomePage', 'CategoriesPage', 'ServiceListingPage', 'ProfessionalsPage',
  'ServiceDetailPage', 'ProfessionalProfilePage', 'ExplorePage', 'ExploreDetailPage',
  'Footer', 'DashboardLayout', 'Sidebar', 'DashboardHeader', 'ClientDashboardHome',
  'MyBookingsPage', 'PaymentsPage', 'MessagesPage', 'SavedProfilesPage', 'SettingsPage',
  'UserProfilePage', 'ProfessionalDashboard', 'BookingModal', 'BookingDetailModal',
  'InvoiceModal', 'ChatModal', 'ReviewModal', 'PostRequirementModal', 'BecomeProModal',
  'CreateServiceModal', 'RescheduleModal', 'AuthModal'
];

let componentsOk = true;
reqs.forEach(c => {
  const found = bundleCode.includes('function ' + c) || bundleCode.includes('const ' + c + ' =') || bundleCode.includes('function ' + c + '(');
  if (!found) {
    console.error(`  ✗ [MISSING COMPONENT] ${c}`);
    componentsOk = false;
  }
});

if (componentsOk) {
  console.log(`  ✓ All ${reqs.length} required React components verified in dist bundle.`);
} else {
  buildOk = false;
}

// 6. Final Result
if (buildOk) {
  console.log('\n==================================================');
  console.log('✓ BUILD SUCCESSFUL!');
  console.log(`✓ Production output ready at: ${DIST_DIR}`);
  console.log(`✓ Entry point: ${path.join(DIST_DIR, 'index.html')}`);
  console.log('==================================================');
  process.exit(0);
} else {
  console.error('\n✗ BUILD FAILED: Check errors above.');
  process.exit(1);
}
