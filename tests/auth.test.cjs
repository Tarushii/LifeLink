const { test } = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const { CognitoAuth, accountRoles } = require('../frontend/auth.js');
const config = { region: 'ap-south-1', userPoolId: 'ap-south-1_test', clientId: 'test-client', cognitoDomain: 'https://test.auth.ap-south-1.amazoncognito.com', redirectUri: 'http://localhost:5500/', logoutUri: 'http://localhost:5500/' };
const now = 1800000000000;
function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
async function fixture() {
  const pair = await webcrypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const key = { ...await webcrypto.subtle.exportKey('jwk', pair.publicKey), kid: 'test-key', use: 'sig' };
  const auth = new CognitoAuth(config, { storage: storage(), crypto: webcrypto, now: () => now, fetch: async () => ({ ok: true, json: async () => ({ keys: [key] }) }) });
  async function token(use, extra = {}) {
    const payload = { iss: auth.issuer(), sub: 'user-1', token_use: use, exp: now / 1000 + 1000, iat: now / 1000, ...(use === 'id' ? { aud: config.clientId, nonce: 'expected-nonce' } : { client_id: config.clientId, 'cognito:groups': ['donor'] }), ...extra };
    const parts = [Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test-key' })).toString('base64url'), Buffer.from(JSON.stringify(payload)).toString('base64url')];
    const signature = await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, Buffer.from(parts.join('.')));
    return `${parts.join('.')}.${Buffer.from(signature).toString('base64url')}`;
  }
  return { auth, token };
}
test('PKCE uses the RFC 7636 S256 test vector', async () => {
  const auth = new CognitoAuth(config, { storage: storage(), crypto: webcrypto });
  assert.equal(await auth.challenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
});
test('public role choices and unknown groups never grant roles', () => {
  assert.deepEqual(accountRoles({ role: 'admin', 'cognito:groups': ['unknown'] }), []);
  assert.deepEqual(accountRoles({ 'cognito:groups': 'admin' }), []);
  assert.deepEqual(accountRoles({ 'cognito:groups': ['hospital', 'donor'] }), ['donor', 'hospital']);
});
test('missing configuration blocks login', async () => {
  const auth = new CognitoAuth({}, { storage: storage() });
  assert.equal(auth.configured(), false);
  await assert.rejects(auth.begin(), /not configured/);
});
test('valid signatures produce a donor session and expiry clears it', async () => {
  const { auth, token } = await fixture();
  auth.session = await auth.validateSession({ id_token: await token('id'), access_token: await token('access') }, 'expected-nonce');
  assert.deepEqual(auth.current().roles, ['donor']);
  auth.now = () => now + 1001000;
  assert.equal(auth.current(), null);
});
test('rejects altered signatures, wrong issuer/client/type, expiry and wrong nonce', async () => {
  const { auth, token } = await fixture();
  const valid = await token('id');
  const parts = valid.split('.');
  const changed = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  changed['cognito:groups'] = ['admin'];
  parts[1] = Buffer.from(JSON.stringify(changed)).toString('base64url');
  await assert.rejects(auth.verify(parts.join('.'), 'id'), /signature/);
  for (const extra of [{ iss: 'https://attacker.example' }, { aud: 'other-client' }, { token_use: 'access' }, { exp: now / 1000 - 1 }]) {
    await assert.rejects(auth.verify(await token('id', extra), 'id'));
  }
  await assert.rejects(auth.verify(valid, 'id', 'wrong-nonce'), /does not match/);
  await assert.rejects(auth.verify(await token('access', { client_id: 'other-client' }), 'access'));
});
test('tokens from different accounts cannot form a session', async () => {
  const { auth, token } = await fixture();
  await assert.rejects(auth.validateSession({ id_token: await token('id'), access_token: await token('access', { sub: 'user-2' }) }), /different accounts/);
});
test('OAuth rejects wrong state without exchanging a code and consumes the flow', async () => {
  let calls = 0;
  const store = storage();
  store.setItem('lifelink.oauth.v1', JSON.stringify({ state: 'expected', createdAt: now }));
  const auth = new CognitoAuth(config, { storage: store, now: () => now, fetch: async () => { calls++; } });
  await assert.rejects(auth.initialize('http://localhost:5500/?code=code&state=wrong'), /could not be verified/);
  assert.equal(calls, 0);
  assert.equal(store.getItem('lifelink.oauth.v1'), null);
});
test('expired and missing callback flows cannot exchange codes', async () => {
  const auth = new CognitoAuth(config, { storage: storage(), now: () => now, fetch: async () => { throw new Error('Must not fetch'); } });
  await assert.rejects(auth.initialize('http://localhost:5500/?code=code&state=state'), /could not be verified/);
  auth.storage.setItem('lifelink.oauth.v1', JSON.stringify({ state: 'state', createdAt: now - 600001 }));
  await assert.rejects(auth.initialize('http://localhost:5500/?code=code&state=state'), /expired/);
});
test('failed token exchange does not create a session', async () => {
  const auth = new CognitoAuth(config, { storage: storage(), now: () => now, fetch: async () => ({ ok: false }) });
  auth.storage.setItem('lifelink.oauth.v1', JSON.stringify({ state: 'state', createdAt: now }));
  await assert.rejects(auth.initialize('http://localhost:5500/?code=code&state=state'), /Could not complete/);
  assert.equal(auth.current(), null);
  assert.equal(auth.storage.getItem('lifelink.session.v1'), null);
});
test('callback exchanges verifier and persists only verified ID/access tokens', async () => {
  const { auth, token } = await fixture();
  const id = await token('id');
  const access = await token('access');
  auth.storage.setItem('lifelink.oauth.v1', JSON.stringify({ state: 'state', nonce: 'expected-nonce', verifier: 'verifier', createdAt: now, requestedRole: 'admin' }));
  const jwksFetch = auth.fetch;
  auth.fetch = async (url, options) => {
    if (!options) return jwksFetch(url);
    assert.equal(options.body.get('code_verifier'), 'verifier');
    assert.equal(options.body.get('grant_type'), 'authorization_code');
    return { ok: true, json: async () => ({ id_token: id, access_token: access, refresh_token: 'not-stored' }) };
  };
  assert.deepEqual(await auth.initialize('http://localhost:5500/?code=code&state=state'), { callback: true, route: 'donor' });
  assert.deepEqual(JSON.parse(auth.storage.getItem('lifelink.session.v1')), { id_token: id, access_token: access });
  const restored = new CognitoAuth(config, { storage: auth.storage, crypto: webcrypto, fetch: jwksFetch, now: () => now });
  await restored.initialize('http://localhost:5500/');
  assert.deepEqual(restored.current().roles, ['donor']);
  const logout = new URL(restored.signOutUrl());
  assert.equal(logout.pathname, '/logout');
  assert.equal(logout.searchParams.get('logout_uri'), config.logoutUri);
  assert.equal(restored.storage.getItem('lifelink.session.v1'), null);
});
