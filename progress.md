# LifeLink — progress and handoff

Last updated: 14 November 2026 (Asia/Calcutta).

## Read this first in a future chat

This is a university Cloud Computing project: a serverless blood donor management system. The user requested staged development, starting with the repository and basic layout. **The user likes the current red-and-white theme; preserve it.** This file summarizes progress to avoid rereading the full chat. Read the specific source files needed for the next task; consult `docs/project-brief.md` for detailed requirements.

## Repository and environment

- Workspace: `C:\Users\tarus\OneDrive\Documents\ChatGPT\LifeLink`
- Public GitHub repository: https://github.com/Tarushii/LifeLink
- Remote: `origin` → `https://github.com/Tarushii/LifeLink.git`
- Branch: `main`, tracking `origin/main`.
- Latest pushed commit before this milestone: `33394c6` — progress handoff. Authentication changes described below are local and not yet pushed.
- Windows / PowerShell. Node.js is available; no npm dependencies are required.
- The `python` command resolved to an unusable Windows Store alias during setup. Prefer Node.js for preview.

## Implemented

- `frontend/index.html`: shared header, navigation, environment banner, footer and account entry point.
- `frontend/styles.css`: responsive red-and-white healthcare theme, CSS blood-drop illustration, dashboard and form styling. Optional Google Fonts with system fallbacks.
- `frontend/app.js`: hash routes `#home`, `#donor`, `#hospital`, `#admin`, `#account`; role-based navigation; sign-in/sign-up/sign-out actions; hospital form validation. Explicit `#preview-donor`, `#preview-hospital`, `#preview-admin` routes are available only while Cognito is unconfigured.
- Home: introduction, donor/request entry points, workflow explanation.
- Donor layout: profile, matching requests and response/donation history empty states.
- Hospital layout: blood group, units, facility, location, date and priority form; request list empty state.
- Admin layout: empty summary cards and processing monitor.
- `scripts/serve.cjs` and `package.json`: local static preview server.
- `.gitignore`, root README, original requirements copied to `docs/project-brief.md`, target architecture in `docs/architecture.md`.
- `frontend/auth.js`: Cognito code + PKCE S256, random state/nonce, JWT signature verification against JWKS, issuer/client/token-type/expiry/subject checks, per-tab sessionStorage, session restore/expiry and hosted sign-out. No refresh tokens persisted.
- `frontend/auth.css`: account page using the existing theme; `frontend/config.js`: public Cognito configuration, currently blank.
- `infrastructure/auth.yaml`: CloudFormation user pool, secretless public app client, hosted UI domain, donor/hospital/admin groups. Not deployed or AWS-service-validated.
- `docs/authentication.md`: AWS setup commands, configuration, administrator-managed group assignment, session behavior and live test checklist.
- `tests/auth.test.cjs`: 10 automated tests with generated RSA keys and simulated Cognito responses. `backend/README.md` remains a placeholder.
- Created the GitHub repository, pushed the foundation, then changed visibility to public at the user's request.

## Current limits — do not mistake previews for implemented features

No AWS resources have been provisioned or live-tested. Cognito integration code and frontend role checks exist, but actual login needs stack deployment and `frontend/config.js` values. Users get no role from the public selector: a trusted administrator must assign a Cognito group. New accounts without groups see an account-pending page. Backend authorization, APIs, persistence, matching, responses, SNS, SQS and monitoring remain **unimplemented**. Dashboard records and request forms are previews. No fabricated donors/statistics or configured AWS credentials. The full project is not complete.

## Run and verify

```powershell
npm run dev
```

Open http://localhost:5500/ and keep the server running. `node scripts/serve.cjs` is an equivalent command and works in this agent environment, where `npm` is not on PATH despite bundled Node being available. If the site cannot be reached, check for a listener on port 5500. A preview server was running during the latest browser check; do not assume it survives future sessions. Opening index.html directly supports layout viewing, but Cognito login needs HTTP/HTTPS and the exact configured callback URL.

Checks: `node --check` for frontend JavaScript/server and `git diff --check`; `node --test tests/auth.test.cjs` (10 passing; `npm test` equivalent on a normal Node installation). Verified local browser account page, missing-configuration feedback, hospital preview and signed-out admin routing. Initial preview returned HTTP 200. Full responsive QA, CloudFormation service validation and live AWS integration tests remain pending.

Environment notes: sandboxed Git writes to `.git` and local socket access were blocked. Authorized elevated Git/preview commands worked. Sandboxed `gh auth status` misleadingly reported an invalid token; outside the sandbox it authenticated successfully as `Tarushii`. Never print tokens or write credentials into source files.

## Next implementation stages

1. Deploy/validate `infrastructure/auth.yaml` in the user's AWS account, configure public frontend values and perform `docs/authentication.md` live checklist. The agent has not attempted AWS deployment. Backend role enforcement must accompany the first protected APIs; frontend checks alone are insufficient.
2. DynamoDB tables/keys/indexes and validated Python Lambda APIs behind API Gateway; real profile and request persistence.
3. Configurable matching by blood compatibility, location, availability and last donation date; donor accept/decline/cancel and hospital tracking.
4. SQS buffering plus an explicit priority scheduler: **Critical → Urgent → Normal, FIFO within each level**. SQS does not natively provide priority. Define arrival ordering, atomic claims, idempotency, recovery, retries and DLQs; an eventually consistent index alone cannot guarantee strict FIFO.
5. SNS notification integration; stop unnecessary notifications on fulfilled/cancelled requests.
6. Implement and test the five required edge cases: no matching donors/expanded search; donor cancels/replacement; duplicate submissions; processing failure/retry/DLQ; simultaneous donor acceptances.
7. Infrastructure as code, least-privilege IAM, S3/CloudFront deployment, CloudWatch monitoring and quota-aware load-test plan.

## Working preferences

- Build in understandable stages suitable for a university demonstration.
- Use HTML/CSS/JavaScript frontend and Python Lambda backend, with the AWS services specified in the brief.
- Keep simulated/local behavior clearly labeled. Never claim real notifications or AWS connectivity without testing.
- Blood-bank screening and medical allocation remain the responsibility of qualified professionals.
- Update this file after meaningful milestones with changes, checks and remaining work. Keep it concise; do not copy the entire chat or project brief.
