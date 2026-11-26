const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { randomBytes } = require('node:crypto');
const ts = require('typescript');
const { NextRequest } = require('next/server');

// Compile the actual proxy in memory; never write generated files or secrets.
const filename = path.join(process.cwd(), 'src/proxy.ts');
const source = fs.readFileSync(filename, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
loaded._compile(compiled, filename);
const { proxy } = loaded.exports;

const keys = ['AIME_PRIVATE_ACCESS', 'AIME_PRIVATE_USERNAME', 'AIME_PRIVATE_PASSWORD', 'RAILWAY_PROJECT_ID'];
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
const password = randomBytes(32).toString('hex');
let count = 0;

function request(route, credential, method = 'GET') {
  const headers = credential ? { authorization: `Basic ${Buffer.from(credential).toString('base64')}` } : undefined;
  return new NextRequest(`https://aime-city.example${route}`, { method, headers });
}

function pass(label) {
  count += 1;
  console.log(`PASS ${label}`);
}

try {
  for (const key of keys) delete process.env[key];
  assert.equal(proxy(request('/')).headers.get('x-middleware-next'), '1');
  pass('Local preview remains accessible without deployment variables');

  process.env.RAILWAY_PROJECT_ID = 'test-project';
  assert.equal(proxy(request('/')).status, 503);
  pass('Railway defaults to closed private access until configured');

  process.env.AIME_PRIVATE_ACCESS = 'true';
  process.env.AIME_PRIVATE_PASSWORD = 'too-short';
  assert.equal(proxy(request('/')).status, 503);
  pass('Short or missing password fails closed');

  process.env.AIME_PRIVATE_USERNAME = 'aime';
  process.env.AIME_PRIVATE_PASSWORD = password;
  assert.equal(proxy(request('/')).status, 401);
  assert.match(proxy(request('/')).headers.get('www-authenticate'), /Basic/);
  pass('Missing credentials trigger the browser login challenge');

  assert.equal(proxy(request('/', 'aime:incorrect')).status, 401);
  assert.equal(proxy(request('/', `someone-else:${password}`)).status, 401);
  pass('Wrong username or password is rejected');

  const allowed = proxy(request('/', `aime:${password}`));
  assert.equal(allowed.headers.get('x-middleware-next'), '1');
  assert.equal(allowed.headers.get('cache-control'), 'private, no-store');
  assert.match(allowed.headers.get('x-robots-tag'), /noindex/);
  pass('Correct credentials allow access without public caching or indexing');

  for (const route of ['/s/DEMO12', '/api/share', '/api/share/DEMO12', '/api/share/DEMO12/rsvp']) {
    assert.equal(proxy(request(route)).status, 401);
    assert.equal(proxy(request(route, `aime:${password}`, 'POST')).headers.get('x-middleware-next'), '1');
  }
  pass('Both wedding pages and API routes are inside the private perimeter');

  assert.equal(proxy(request('/api/health')).headers.get('x-middleware-next'), '1');
  pass('Infrastructure healthcheck remains accessible');

  const malformed = new NextRequest('https://aime-city.example/', { headers: { authorization: 'Bearer invalid' } });
  assert.equal(proxy(malformed).status, 401);
  pass('Unsupported authentication schemes do not bypass access checks');

  process.env.AIME_PRIVATE_ACCESS = 'false';
  assert.equal(proxy(request('/')).headers.get('x-middleware-next'), '1');
  pass('Disabling the gate requires an explicit setting on Railway');

  console.log(`SUCCESS: ${count} private-access checks passed`);
} finally {
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
}
