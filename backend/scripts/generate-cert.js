/**
 * generate-cert.js
 * Run ONCE before starting the server with HTTPS:
 *   node scripts/generate-cert.js
 *
 * Generates a self-signed TLS certificate into backend/certs/
 * using the 'selfsigned' package (already installed).
 */

const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, '../certs');

if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

const attrs = [
  { name: 'commonName', value: 'localhost' },
  { name: 'organizationName', value: 'FamilyTravelDev' }
];

const opts = {
  days: 365,
  keySize: 2048,
  extensions: [
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' }
      ]
    }
  ]
};

console.log('Generating self-signed certificate (async)...');

// selfsigned.generate is async in newer versions
Promise.resolve(selfsigned.generate(attrs, opts)).then((pems) => {
  // Support both old API (pems.private / pems.cert) and new API (pems.key / pems.cert)
  const key = pems.private || pems.key;
  const cert = pems.cert || pems.certificate;

  if (!key || !cert) {
    console.error('ERROR: Unexpected selfsigned output:', Object.keys(pems));
    process.exit(1);
  }

  fs.writeFileSync(path.join(certsDir, 'server.key'), key);
  fs.writeFileSync(path.join(certsDir, 'server.crt'), cert);

  console.log('Certificate generated successfully in backend/certs/');
  console.log('  server.key');
  console.log('  server.crt');
  console.log('');
  console.log('NOTE: Browsers will show a security warning for self-signed certificates.');
  console.log('Click "Advanced" -> "Proceed to localhost" to continue.');
}).catch((err) => {
  console.error('Certificate generation failed:', err);
  process.exit(1);
});
