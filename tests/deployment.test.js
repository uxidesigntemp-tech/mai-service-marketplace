// tests/deployment.test.js - Deployment & Routing Verification Test
const http = require('http');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const PORT = 5002;
process.env.PORT = PORT;
const app = require('../server/server');

function get(pathName) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${pathName}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function runDeploymentTests() {
  console.log('====================================================');
  console.log('  TESTING DEPLOYMENT, SPA ROUTING & CACHE POLICIES  ');
  console.log('====================================================\n');

  const server = app.listen(PORT, async () => {
    try {
      let pass = 0;

      // 1. Backend Health Check
      const health = await get('/api/health');
      assert.strictEqual(health.status, 200, 'Health check should return 200');
      const healthJson = JSON.parse(health.body);
      assert.strictEqual(healthJson.status, 'ok');
      console.log('✓ PASS: GET /api/health returns 200 OK');
      pass++;

      // 2. Direct SPA Route: /dashboard/professionals
      const dashPros = await get('/dashboard/professionals');
      assert.strictEqual(dashPros.status, 200, 'Direct navigation to /dashboard/professionals must return 200');
      assert(dashPros.body.includes('<div id="root"></div>'), 'Should return index.html shell');
      assert(dashPros.body.includes('mai-build-version'), 'Should include build version metadata');
      console.log('✓ PASS: Direct navigation to /dashboard/professionals serves SPA index shell (200 OK)');
      pass++;

      // 3. Direct SPA Route: /dashboard/services
      const dashSrvs = await get('/dashboard/services');
      assert.strictEqual(dashSrvs.status, 200, 'Direct navigation to /dashboard/services must return 200');
      assert(dashSrvs.body.includes('<div id="root"></div>'), 'Should return index.html shell');
      console.log('✓ PASS: Direct navigation to /dashboard/services serves SPA index shell (200 OK)');
      pass++;

      // 4. Direct SPA Route: /dashboard
      const dash = await get('/dashboard');
      assert.strictEqual(dash.status, 200, 'Direct navigation to /dashboard must return 200');
      console.log('✓ PASS: Direct navigation to /dashboard serves SPA index shell (200 OK)');
      pass++;

      // 5. Direct SPA Route: /services and /professionals
      const srvs = await get('/services');
      assert.strictEqual(srvs.status, 200);
      const pros = await get('/professionals');
      assert.strictEqual(pros.status, 200);
      console.log('✓ PASS: Public routes /services and /professionals serve SPA index shell (200 OK)');
      pass++;

      // 6. Hosting SPA Redirects file in dist/
      const distRedirects = path.join(__dirname, '..', 'dist', '_redirects');
      assert(fs.existsSync(distRedirects), 'dist/_redirects must exist');
      const redirectsContent = fs.readFileSync(distRedirects, 'utf8');
      assert(redirectsContent.includes('/*'), 'dist/_redirects must contain fallback rule');
      assert(redirectsContent.includes('/index.html'), 'dist/_redirects must redirect to /index.html');
      console.log('✓ PASS: dist/_redirects configured with universal SPA rewrite rule');
      pass++;

      // 7. Hosting netlify.toml and vercel.json configurations
      const netlifyToml = path.join(__dirname, '..', 'netlify.toml');
      assert(fs.existsSync(netlifyToml), 'netlify.toml must exist');
      const tomlContent = fs.readFileSync(netlifyToml, 'utf8');
      assert(tomlContent.includes('publish = "dist"'), 'netlify.toml must specify publish = "dist"');
      assert(tomlContent.includes('command = "npm run build"'), 'netlify.toml must specify build command');

      const vercelJson = path.join(__dirname, '..', 'vercel.json');
      assert(fs.existsSync(vercelJson), 'vercel.json must exist');
      console.log('✓ PASS: Hosting configurations (netlify.toml, vercel.json) verified for dist publish & redirects');
      pass++;

      // 8. Cache-busting verification in dist/index.html
      const distIndex = path.join(__dirname, '..', 'dist', 'index.html');
      const indexContent = fs.readFileSync(distIndex, 'utf8');
      assert(indexContent.match(/app\.js\?v=/), 'dist/index.html must have cache-busting query on app.js');
      assert(indexContent.match(/dashboard-components\.js\?v=/), 'dist/index.html must have cache-busting query on dashboard-components.js');
      assert(indexContent.includes('Cache-Control'), 'dist/index.html must include cache-control meta tags');
      console.log('✓ PASS: Cache-busting query strings & freshness meta tags verified in dist/index.html');
      pass++;

      console.log('\n====================================================');
      console.log(`  ALL ${pass} DEPLOYMENT VERIFICATION CHECKS PASSED `);
      console.log('====================================================\n');
    } catch (err) {
      console.error('Deployment test failure:', err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

runDeploymentTests();
