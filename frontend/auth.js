(function (root) {
  'use strict';
  const SESSION_KEY = 'lifelink.session.v1';
  const FLOW_KEY = 'lifelink.oauth.v1';
  const roles = ['donor', 'hospital', 'admin'];
  const encode = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  function decode(value) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    return Uint8Array.from(atob(normalized), c => c.charCodeAt(0));
  }
  function claims(token) {
    return JSON.parse(new TextDecoder().decode(decode(token.split('.')[1])));
  }
  function accountRoles(payload) {
    const groups = payload['cognito:groups'];
    return roles.filter(role => Array.isArray(groups) && groups.includes(role));
  }
  class CognitoAuth {
    constructor(config, options = {}) {
      this.config = config;
      this.storage = options.storage || root.sessionStorage;
      this.fetch = options.fetch || root.fetch.bind(root);
      this.crypto = options.crypto || root.crypto;
      this.now = options.now || (() => Date.now());
      this.session = null;
    }
    configured() {
      const c = this.config;
      if (!c.region || !c.userPoolId || !c.clientId || !c.cognitoDomain) return false;
      try {
        const domain = new URL(c.cognitoDomain);
        return domain.protocol === 'https:' && domain.pathname === '/' && !domain.search && !domain.hash && !domain.username && !domain.password;
      } catch { return false; }
    }
    issuer() { return `https://cognito-idp.${this.config.region}.amazonaws.com/${this.config.userPoolId}`; }
    async challenge(verifier) {
      return encode(await this.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    }
    random() { return encode(this.crypto.getRandomValues(new Uint8Array(32))); }
    async begin(signUp = false, requestedRole = 'donor') {
      if (!this.configured()) throw new Error('Sign-in is not configured yet. Follow docs/authentication.md to connect Amazon Cognito.');
      if (!root.location || root.location.protocol === 'file:') throw new Error('Start npm run dev and open http://localhost:5500 to sign in.');
      if (new URL(this.config.redirectUri).origin !== root.location.origin) throw new Error('Open the configured callback address before signing in. Check frontend/config.js.');
      const flow = { verifier: this.random(), state: this.random(), nonce: this.random(), createdAt: this.now(), requestedRole: roles.includes(requestedRole) ? requestedRole : 'donor' };
      this.storage.setItem(FLOW_KEY, JSON.stringify(flow));
      const url = new URL(signUp ? '/signup' : '/oauth2/authorize', this.config.cognitoDomain);
      url.search = new URLSearchParams({ response_type: 'code', client_id: this.config.clientId, redirect_uri: this.config.redirectUri, scope: 'openid email profile', state: flow.state, nonce: flow.nonce, code_challenge: await this.challenge(flow.verifier), code_challenge_method: 'S256' });
      return url.href;
    }
    async verify(token, use, nonce) {
      if (typeof token !== 'string' || token.split('.').length !== 3) throw new Error('Invalid sign-in token. Please sign in again.');
      const [headerPart, payloadPart, signature] = token.split('.');
      const header = JSON.parse(new TextDecoder().decode(decode(headerPart)));
      const payload = claims(token);
      const seconds = this.now() / 1000;
      if (header.alg !== 'RS256' || !header.kid || payload.iss !== this.issuer() || payload.token_use !== use || !Number.isFinite(payload.exp) || payload.exp <= seconds || !Number.isFinite(payload.iat) || payload.iat > seconds + 60 || !payload.sub) throw new Error('Your sign-in token is invalid or expired. Please sign in again.');
      if (use === 'id' && (payload.aud !== this.config.clientId || (nonce && payload.nonce !== nonce))) throw new Error('Sign-in token does not match this application.');
      if (use === 'access' && payload.client_id !== this.config.clientId) throw new Error('Access token does not match this application.');
      if (!this.keys) {
        const response = await this.fetch(`${this.issuer()}/.well-known/jwks.json`);
        if (!response.ok) throw new Error('Could not verify your session. Check your connection and try again.');
        this.keys = (await response.json()).keys;
      }
      const jwk = this.keys?.find(key => key.kid === header.kid && key.kty === 'RSA' && key.use === 'sig');
      if (!jwk) throw new Error('Unknown sign-in key. Please reload and sign in again.');
      const key = await this.crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
      const valid = await this.crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(signature), new TextEncoder().encode(`${headerPart}.${payloadPart}`));
      if (!valid) throw new Error('Sign-in signature could not be verified.');
      return payload;
    }
    async validateSession(tokens, nonce) {
      const [identity, access] = await Promise.all([this.verify(tokens.id_token, 'id', nonce), this.verify(tokens.access_token, 'access')]);
      if (identity.sub !== access.sub) throw new Error('Sign-in tokens belong to different accounts.');
      return { ...tokens, identity, roles: accountRoles(access), expiresAt: Math.min(identity.exp, access.exp) * 1000 };
    }
    async initialize(url) {
      const params = new URL(url).searchParams;
      if (params.has('code') || params.has('error')) {
        const saved = this.storage.getItem(FLOW_KEY);
        this.storage.removeItem(FLOW_KEY);
        const flow = saved ? JSON.parse(saved) : null;
        if (!flow || params.get('state') !== flow.state || this.now() - flow.createdAt > 600000 || this.now() < flow.createdAt) throw new Error('The sign-in attempt expired or could not be verified. Please start again.');
        if (params.has('error')) throw new Error('Sign-in was cancelled or rejected. Please try again.');
        if (!this.configured()) throw new Error('Cognito configuration is missing.');
        const response = await this.fetch(new URL('/oauth2/token', this.config.cognitoDomain), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', client_id: this.config.clientId, redirect_uri: this.config.redirectUri, code: params.get('code'), code_verifier: flow.verifier }) });
        if (!response.ok) throw new Error('Could not complete sign-in. Please start again.');
        const result = await response.json();
        // No refresh token is persisted. Expired sessions require a fresh sign-in.
        const tokens = { id_token: result.id_token, access_token: result.access_token };
        this.session = await this.validateSession(tokens, flow.nonce);
        this.storage.setItem(SESSION_KEY, JSON.stringify(tokens));
        return { callback: true, route: this.session.roles.includes(flow.requestedRole) ? flow.requestedRole : this.session.roles[0] || 'account' };
      }
      const saved = this.storage.getItem(SESSION_KEY);
      if (saved && this.configured()) {
        try { this.session = await this.validateSession(JSON.parse(saved)); }
        catch { this.clear(); throw new Error('Your session expired or could not be verified. Please sign in again.'); }
      }
      return { callback: false };
    }
    current() {
      if (this.session && this.session.expiresAt <= this.now()) this.clear();
      return this.session;
    }
    clear() { this.session = null; this.storage.removeItem(SESSION_KEY); }
    signOutUrl() {
      this.clear();
      this.storage.removeItem(FLOW_KEY);
      if (!this.configured()) return null;
      const url = new URL('/logout', this.config.cognitoDomain);
      url.search = new URLSearchParams({ client_id: this.config.clientId, logout_uri: this.config.logoutUri });
      return url.href;
    }
  }
  root.LifeLinkAuth = { CognitoAuth, accountRoles };
  if (typeof module !== 'undefined') module.exports = root.LifeLinkAuth;
})(globalThis);
