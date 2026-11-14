# LifeLink

A university Cloud Computing project connecting blood donors and hospitals through an AWS serverless application.

## Current stage: foundation and layout

The first milestone includes a responsive home page, donor dashboard, hospital request form layout and admin dashboard layout. Navigation, the account information dialog and browser form validation work. The form preview never saves or submits requests. Dashboard data is intentionally empty.

**AWS, authentication, storage, matching and email are not connected.** The visible role pages are public previews, not protected routes. No donor information is persisted. The full project requirements are in [docs/project-brief.md](docs/project-brief.md).

## Run locally

From the repository root, with Node.js installed (no dependency installation needed):

```powershell
npm run dev
```

Alternatively, with Python 3 installed:

```powershell
python -m http.server 5500 --directory frontend --bind 127.0.0.1
```

Open http://localhost:5500. Stop with Ctrl+C. You can also open `frontend/index.html` directly. No package installation or AWS credentials are needed. Optional Google Fonts require internet; system fonts are used otherwise.

## Repository structure

```text
frontend/                 HTML, CSS and vanilla JavaScript
  index.html              Shared navigation, footer and dialog
  styles.css              Responsive visual system and page layouts
  app.js                  Hash navigation and layout interactions
backend/README.md         Planned Python Lambda modules
infrastructure/README.md  Planned AWS infrastructure
docs/
  architecture.md         Service boundaries and implementation roadmap
  project-brief.md        Original university project requirements
```

## Layout review

- Navigate between Overview, For donors, For hospitals and Admin.
- Check the donor sign-in information dialog and close it with Escape.
- Try the hospital form with missing fields, invalid unit counts and past dates.
- Complete the form and confirm it states that nothing was saved or sent.
- Review at mobile and desktop widths using browser developer tools.

## Next stages

1. Add Cognito registration/login and backend role enforcement.
2. Define DynamoDB records and implement authenticated Python APIs.
3. Add configurable donor matching and real donor responses.
4. Add SNS, SQS, priority/FIFO scheduling, retries and DLQs.
5. Implement and test all five edge cases, monitoring and AWS deployment.

Do not commit credentials or patient/donor personal data. The project is a coordination tool; professional blood-bank screening and allocation remain necessary.
