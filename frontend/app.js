const main = document.querySelector('#main');
const auth = new LifeLinkAuth.CognitoAuth(window.LIFELINK_CONFIG);
let authReady = false;
let authError = '';
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bloodGroups = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
const sectionHead = (label, title, description) => `<div class="section-heading"><span class="eyebrow">${label}</span><h1>${title}</h1><p>${description}</p></div>`;
const empty = (title, description, symbol = '♡') => `<div class="empty"><span class="empty-icon" aria-hidden="true">${symbol}</span><h3>${title}</h3><p>${description}</p></div>`;
const home = () => `
  <section class="hero">
    <div class="hero-copy"><span class="eyebrow"><span class="short-line"></span> A LITTLE OF YOU. A LIFELINE FOR SOMEONE.</span><h1>Someone’s tomorrow.<br>Your <em>connection</em><br>today.</h1><p>Bringing blood donors and hospitals closer, so a willingness to help can reach the people who need it.</p><div class="actions"><a class="button" href="#donor">Become a donor <span>↗</span></a><a class="button secondary" href="#hospital">I need blood <span>→</span></a></div><div class="hero-note"><span class="heart-outline">♡</span><span>One community. A shared purpose.<br><strong>Be there when it matters.</strong></span></div></div>
    <div class="hero-art" role="img" aria-label="Illustration of a blood drop connected to a donor and a hospital"><div class="art-grid"></div><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="art-spark spark-one">+</span><span class="art-spark spark-two">+</span><div class="drop"><span>♥</span></div><div class="connection-card donor-card"><span class="mini-icon">♡</span><div><strong>A willingness to give</strong><small>Starts with a donor</small></div><span class="card-dot"></span></div><div class="connection-card hospital-card"><span class="mini-icon">✚</span><div><strong>A chance to heal</strong><small>Reaches someone in need</small></div></div><span class="art-caption">CONNECTED BY CARE</span></div>
  </section>
  <section class="principles" aria-label="Platform principles"><div><span>01</span><strong>People first</strong><p>Built around donors and those who need them.</p></div><div><span>02</span><strong>Urgency matters</strong><p>Critical → Urgent → Normal, with FIFO within each level.</p></div><div><span>03</span><strong>Cloud at the core</strong><p>Designed for a serverless AWS architecture.</p></div></section>
  <section class="how"><div class="section-top"><div><span class="eyebrow">SMALL STEPS. MEANINGFUL CONNECTIONS.</span><h2>How LifeLink will work</h2></div><p>A clear path from a request for help<br>to a donor ready to respond.</p></div><div class="steps"><article><span class="step-number">01 /</span><h3>A hospital raises a request</h3><p>Blood group, location and urgency help define what is needed.</p></article><article><span class="step-number">02 /</span><h3>LifeLink finds a connection</h3><p>Requests are prioritized and matched with available, eligible donors.</p></article><article><span class="step-number">03 /</span><h3>A donor responds</h3><p>Donors can offer to help, and hospitals coordinate the next steps.</p></article></div></section>
  <section class="join-strip"><div><span class="eyebrow">THE FIRST STEP IS YOURS</span><h2>Be part of someone’s support system.</h2></div><a class="button" href="#donor">Explore donor dashboard ↗</a></section>
  <p class="medical-note">LifeLink supports coordination. Blood banks and qualified medical professionals must verify donor eligibility, compatibility and actual blood allocation.</p>`;
const donor = () => `<section class="dashboard">${sectionHead('DONOR SPACE', 'Your willingness. Someone’s hope.', 'Manage your profile and find opportunities to help in your community.')}<div class="dashboard-grid"><section class="panel"><div class="panel-title"><h2>Donor profile</h2><span class="badge">Not connected</span></div>${empty('Let’s start with you', 'Register or sign in to add your blood group, city and last donation date.')}<button class="button full" data-info="donor">Register / sign in</button><p class="muted">Availability can be managed after authentication is connected.</p></section><section class="panel"><div class="panel-title"><h2>Matching requests</h2><span class="badge neutral">No data</span></div>${empty('Your connections will appear here', 'Once your profile is ready, compatible requests will be listed based on location, availability and eligibility.')}</section></div><section class="panel history"><h2>Response & donation history</h2>${empty('A fresh start', 'Your actual responses and recorded donations will appear here.')}</section></section>`;
const hospital = () => `<section class="dashboard">${sectionHead('HOSPITAL SPACE', 'Make the right connection.', 'Prepare a blood request and follow responses in one place.')}<div class="dashboard-grid hospital-grid"><section class="panel"><div class="panel-title"><h2>New blood request</h2><span class="badge">Layout preview</span></div><p class="muted">Explore the form. Submission requires the authenticated backend.</p><form id="request-form"><div class="form-row"><label>Blood group<select name="blood_group" required><option value="">Select group</option>${bloodGroups.map(g => `<option>${g}</option>`).join('')}</select></label><label>Units required<input name="units" type="number" min="1" max="100" placeholder="e.g. 2" required></label></div><label>Hospital / facility<input name="hospital" autocomplete="organization" placeholder="Hospital name" required maxlength="160"></label><div class="form-row"><label>City / location<input name="location" placeholder="e.g. New Delhi" required maxlength="160"></label><label>Required date<input name="required_date" type="date" required></label></div><fieldset><legend>Request priority</legend><div class="priority-options"><label><input type="radio" name="priority" value="critical" required><span class="critical">Critical</span></label><label><input type="radio" name="priority" value="urgent"><span class="urgent">Urgent</span></label><label><input type="radio" name="priority" value="normal"><span class="normal">Normal</span></label></div></fieldset><p class="form-note">Critical: life-threatening · Urgent: time-sensitive · Normal: regular requirement</p><button class="button full" type="submit">Preview request →</button><p id="form-feedback" role="status" class="form-feedback"></p></form></section><section class="panel"><div class="panel-title"><h2>Your requests</h2><span class="badge neutral">No data</span></div>${empty('Every connection starts here', 'Submitted requests, matching donors and their responses will appear once the backend is connected.', '✚')}<div class="queue-note"><strong>How requests will be processed</strong><p><span class="critical">Critical</span> → <span class="urgent">Urgent</span> → <span class="normal">Normal</span></p><small>First in, first out within each priority. Processing order does not guarantee blood availability.</small></div></section></div></section>`;
const admin = () => `<section class="dashboard">${sectionHead('ADMINISTRATION', 'A clearer view of the network.', 'The foundation for monitoring requests, processing and community activity.')}<div class="admin-grid">${['Registered donors', 'Hospitals', 'Emergency requests', 'Donor responses'].map(title => `<section class="panel"><span class="eyebrow">${title}</span><div class="metric">—</div><p class="muted">Awaiting authenticated data</p></section>`).join('')}</div><section class="panel history"><div class="panel-title"><h2>Priority processing monitor</h2><span class="badge">AWS not connected</span></div>${empty('No processing data available', 'Queue status, retries, failed messages and flagged activity will be available after backend integration.', '≋')}<p class="muted">This is a layout preview. Production admin access will require a verified Cognito admin role enforced by the API.</p></section></section>`;
const account = (requestedRole = 'donor') => {
  const session = auth.current();
  const configured = auth.configured();
  if (session) return `<section class="dashboard auth-layout"><div>${sectionHead('YOUR ACCOUNT', 'Welcome to LifeLink.', 'Your account connects you to the right space.')}<p class="muted">Request and donor records will be connected in the next stage.</p></div><section class="panel auth-panel"><span class="eyebrow">SIGNED IN</span><h2 class="account-email">${escapeHtml(session.identity.email || 'LifeLink member')}</h2><p class="muted">${session.roles.length ? 'Assigned roles: ' + session.roles.join(', ') : 'Your account is awaiting a role assignment. Contact the project administrator to activate donor or hospital access.'}</p><div class="account-destinations">${session.roles.map(role => `<a class="button full" href="#${role}">Open ${role} dashboard →</a>`).join('')}</div>${authError ? `<p role="alert" class="auth-error">${escapeHtml(authError)}</p>` : ''}<button class="button secondary full" data-signout>Sign out</button></section></section>`;
  return `<section class="dashboard auth-layout"><div>${sectionHead('JOIN THE CONNECTION', 'A little care starts here.', 'Create an account or sign in to your donor or hospital space.')}<div class="auth-benefits"><p><span>♡</span> Keep your donor details in one place</p><p><span>✚</span> Coordinate requests with your hospital</p><p><span>↗</span> Follow the connections you make</p></div><a class="account-link" href="#home">← Back to overview</a></div><section class="panel auth-panel"><span class="eyebrow">YOUR LIFELINK ACCOUNT</span><h2>Let’s get you connected.</h2><p class="muted">Select the space you want to open after sign-in. Permissions come from your assigned account role.</p><form id="auth-form"><label>Continue as<select name="role"><option value="donor" ${requestedRole === 'donor' ? 'selected' : ''}>Donor</option><option value="hospital" ${requestedRole === 'hospital' ? 'selected' : ''}>Hospital / requester</option><option value="admin" ${requestedRole === 'admin' ? 'selected' : ''}>Administrator</option></select></label>${!configured ? '<div class="setup-note"><strong>Account setup is in progress</strong><p>Sign-up and login will be available when Amazon Cognito is connected. You can explore the page layouts below.</p></div>' : '<p class="muted">Continue to Amazon Cognito to enter your credentials securely. New accounts need a role assigned by the project administrator.</p>'}<button class="button full" type="submit">Sign in →</button><button class="button secondary full" type="button" data-signup>Create an account</button><p id="auth-feedback" class="auth-error" role="alert">${escapeHtml(authError)}</p></form>${!configured ? '<div class="layout-links"><span>Explore layout previews</span><a href="#preview-donor">Donor</a><a href="#preview-hospital">Hospital</a><a href="#preview-admin">Admin</a></div>' : ''}</section></section>`;
};
const pages = {home, donor, hospital, admin, account};
function render() {
  const route = location.hash.slice(1) || 'home';
  if (!authReady) { main.innerHTML = '<section class="dashboard"><p role="status">Checking your session…</p></section>'; return; }
  const session = auth.current();
  const previewRole = route.startsWith('preview-') ? route.slice(8) : '';
  if (['donor', 'hospital', 'admin'].includes(previewRole) && !auth.configured()) {
    main.innerHTML = `<div class="layout-preview-note">Layout preview · No account or live records <a href="#account">Back to sign-in →</a></div>` + pages[previewRole]();
  } else if (['donor', 'hospital', 'admin'].includes(route) && !session?.roles.includes(route)) {
    main.innerHTML = session ? `<section class="dashboard">${sectionHead('ACCOUNT ACCESS', 'This space needs a different role.', 'Your account has not been assigned access to this dashboard.')}<a class="button" href="#account">View your account →</a></section>` : account(route);
  } else main.innerHTML = (Object.hasOwn(pages, route) ? pages[route] : home)();
  document.querySelector('#account-link').textContent = session ? 'My account' : 'Sign in';
  document.querySelector('#environment-banner').innerHTML = auth.configured() ? '<span class="status-dot"></span> Cognito configuration loaded <span class="banner-detail">Request processing is not connected yet</span>' : '<span class="status-dot"></span> University project · Local preview <span class="banner-detail">Cognito setup required · Request processing is not connected</span>';
  if (session && ['donor', 'hospital', 'admin'].includes(route)) {
    const note = document.createElement('div');
    note.className = 'layout-preview-note';
    note.textContent = 'Signed in · Dashboard records and request processing are not connected yet';
    main.prepend(note);
    const register = main.querySelector('[data-info]');
    if (register) {
      const profile = register.closest('.panel');
      profile.querySelector('.empty h3').textContent = 'Your profile is the next step';
      profile.querySelector('.empty p').textContent = 'You are signed in. Blood group, location, donation date and availability will be connected in the profile milestone.';
      register.outerHTML = '<a class="button secondary full" href="#account">View account</a>';
    }
  }
  document.querySelectorAll('nav a').forEach(link => {
    if (link.hash === `#${route}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const pageTitle = ['donor', 'hospital', 'admin'].includes(previewRole) ? `${previewRole.charAt(0).toUpperCase() + previewRole.slice(1)} preview` : Object.hasOwn(pages, route) ? route.charAt(0).toUpperCase() + route.slice(1) : 'Home';
  document.title = `LifeLink · ${pageTitle}`;
  const dateInput = document.querySelector('[name="required_date"]');
  if (dateInput) { const today = new Date(); dateInput.min = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`; }
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);
async function beginSignIn(signUp) {
  const feedback = document.querySelector('#auth-feedback');
  const buttons = [...document.querySelectorAll('#auth-form button')];
  buttons.forEach(button => { button.disabled = true; });
  if (feedback) feedback.textContent = 'Preparing secure sign-in…';
  try {
    const role = document.querySelector('#auth-form [name="role"]')?.value || 'donor';
    window.location.assign(await auth.begin(signUp, role));
  } catch (error) {
    if (feedback) feedback.textContent = error.message;
    buttons.forEach(button => { button.disabled = false; });
  }
}
document.addEventListener('click', async event => {
  if (event.target.closest('[data-info]')) location.hash = 'account';
  if (event.target.closest('[data-signup]')) await beginSignIn(true);
  if (event.target.closest('[data-signout]')) {
    try { const url = auth.signOutUrl(); if (url) location.assign(url); else { location.hash = 'account'; render(); } }
    catch { auth.clear(); authError = 'You are signed out locally. The Cognito sign-out page could not be opened.'; render(); }
  }
});
document.addEventListener('submit', event => {
  if (event.target.id === 'auth-form') { event.preventDefault(); beginSignIn(false); return; }
  if (event.target.id !== 'request-form') return;
  event.preventDefault();
  document.querySelector('#form-feedback').textContent = 'Form preview validated. No request has been saved, queued or sent. Sign-in and the AWS API will be connected in a later stage.';
});
async function initialize() {
  render();
  const callback = new URLSearchParams(location.search).has('code') || new URLSearchParams(location.search).has('error');
  try {
    const result = await auth.initialize(location.href);
    if (result.callback) history.replaceState(null, '', location.pathname + '#' + result.route);
  } catch (error) {
    auth.clear();
    authError = error.message;
    if (callback) history.replaceState(null, '', location.pathname + '#account');
  } finally {
    if (callback && location.search) history.replaceState(null, '', location.pathname + '#account');
    authReady = true;
    render();
  }
}
setInterval(() => {
  if (auth.session && auth.session.expiresAt <= Date.now()) {
    auth.clear(); authError = 'Your session expired. Please sign in again.'; location.hash = 'account'; render();
  }
}, 10000);
initialize();
