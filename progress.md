# LifeLink — progress and handoff

Last updated: 14 November 2026 (Asia/Calcutta).

## Read this first in a future chat

This is a university Cloud Computing project: a serverless blood donor management system. The user requested staged development, starting with the repository and basic layout. **The user likes the current red-and-white theme; preserve it.** This file summarizes progress to avoid rereading the full chat. Read the specific source files needed for the next task; consult `docs/project-brief.md` for detailed requirements.

## Repository and environment

- Workspace: `C:\Users\tarus\OneDrive\Documents\ChatGPT\LifeLink`
- Public GitHub repository: https://github.com/Tarushii/LifeLink
- Remote: `origin` → `https://github.com/Tarushii/LifeLink.git`
- Branch: `main`, tracking `origin/main`.
- Foundation commit: `eb1bd69` — `Set up LifeLink foundation and responsive layouts` (pushed).
- Windows / PowerShell. Node.js is available; no npm dependencies are required.
- The `python` command resolved to an unusable Windows Store alias during setup. Prefer Node.js for preview.

## Implemented

- `frontend/index.html`: shared header, navigation, preview banner, footer and account information dialog.
- `frontend/styles.css`: responsive red-and-white healthcare theme, CSS blood-drop illustration, dashboard and form styling. Optional Google Fonts with system fallbacks.
- `frontend/app.js`: hash routes `#home`, `#donor`, `#hospital`, `#admin`; active navigation; donor account information dialog; hospital form validation and honest preview feedback.
- Home: introduction, donor/request entry points, workflow explanation.
- Donor layout: profile, matching requests and response/donation history empty states.
- Hospital layout: blood group, units, facility, location, date and priority form; request list empty state.
- Admin layout: empty summary cards and processing monitor.
- `scripts/serve.cjs` and `package.json`: local static preview server.
- `.gitignore`, root README, original requirements copied to `docs/project-brief.md`, target architecture in `docs/architecture.md`.
- `backend/README.md` and `infrastructure/README.md` are planning placeholders.
- Created the GitHub repository, pushed the foundation, then changed visibility to public at the user's request.

## Current limits — do not mistake previews for implemented features

No AWS resources have been provisioned or tested. Cognito login, backend authorization, APIs, persistence, donor matching, responses, SNS notifications, SQS scheduling and CloudWatch monitoring are **not implemented**. Role pages are public layout previews. Forms do not save, queue or send anything. No fabricated donors or statistics are shown. No AWS credentials are configured by this work. The project is not complete against the full brief.

## Run and verify

```powershell
npm run dev
```

Open http://localhost:5500/ and keep the server running. `node scripts/serve.cjs` is an equivalent command. If the browser says the site cannot be reached, check that a server is actually listening on port 5500 before changing frontend code. A server was started during this chat, but do not assume it survives into future sessions.

Completed checks: `node --check frontend/app.js`, `node --check scripts/serve.cjs`, `git diff --check`. The running preview returned HTTP 200 after starting it outside the restricted sandbox. Full browser visual and interaction QA has not been performed by the agent.

Environment notes: sandboxed Git writes to `.git` and local socket access were blocked. Authorized elevated Git/preview commands worked. Sandboxed `gh auth status` misleadingly reported an invalid token; outside the sandbox it authenticated successfully as `Tarushii`. Never print tokens or write credentials into source files.

## Next implementation stages

1. Cognito registration/login, donor/hospital roles, session handling and backend role enforcement. Admin assignment must be privileged.
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
