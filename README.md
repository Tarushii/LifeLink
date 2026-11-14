# LifeLink

A university Cloud Computing project connecting blood donors and hospitals through an AWS serverless application.

## Current stage: layout and Cognito integration foundation

Includes a responsive home page, donor/hospital/admin layouts, a themed account page and a Cognito authorization-code + PKCE integration. Browser form validation and navigation work. Dashboard data is intentionally empty; request previews never save or send anything.

**AWS has not been deployed or connected.** Follow [Cognito setup](docs/authentication.md) to deploy the provided authentication template and set public configuration. Sign-in requires a real configured Cognito pool; until then, the account page provides explicit layout preview links. Frontend role checks are implemented, but protected backend APIs are a future stage. No donor records are persisted. Full requirements: [docs/project-brief.md](docs/project-brief.md). Current handoff: [progress.md](progress.md).

## Run locally

From the repository root, with Node.js installed (no dependency installation needed):

```powershell
npm run dev
```

If npm is unavailable but Node.js is installed, use `node scripts/serve.cjs`.

Alternatively, with Python 3 installed:

```powershell
python -m http.server 5500 --directory frontend --bind 127.0.0.1
```

Open http://localhost:5500. Stop with Ctrl+C. You can also open `frontend/index.html` directly. No package installation or AWS credentials are needed. Optional Google Fonts require internet; system fonts are used otherwise.

## Repository structure

```text
frontend/                 HTML, CSS and vanilla JavaScript
  index.html              Shared navigation and footer
  styles.css              Responsive visual system and page layouts
  app.js                  Hash navigation and layout interactions
  auth.js                 PKCE, token verification and session handling
  auth.css                Account page styling
  config.js               Public Cognito settings (initially empty)
backend/README.md         Planned Python Lambda modules
infrastructure/auth.yaml Cognito user pool, web client, domain and groups
tests/auth.test.cjs       Cryptographic and session behavior tests
docs/
  architecture.md         Service boundaries and implementation roadmap
  authentication.md       Cognito deployment and verification guide
  project-brief.md        Original university project requirements
```

## Layout review

- Navigate between Overview, For donors, For hospitals and Admin.
- Open Sign in and verify the setup message while Cognito is unconfigured.
- Use the account page's explicit layout preview links to inspect dashboards.
- Try the hospital form with missing fields, invalid unit counts and past dates.
- Complete the form and confirm it states that nothing was saved or sent.
- Review at mobile and desktop widths using browser developer tools.

## Next stages

1. Deploy and verify the Cognito integration; add backend API role enforcement.
2. Define DynamoDB records and implement authenticated Python APIs.
3. Add configurable donor matching and real donor responses.
4. Add SNS, SQS, priority/FIFO scheduling, retries and DLQs.
5. Implement and test all five edge cases, monitoring and AWS deployment.

Do not commit credentials or patient/donor personal data. The project is a coordination tool; professional blood-bank screening and allocation remain necessary.

## Automated checks

Run `npm test` or `node --test tests/auth.test.cjs`. These local tests use generated cryptographic keys and simulated Cognito responses, not real accounts or AWS connectivity.
