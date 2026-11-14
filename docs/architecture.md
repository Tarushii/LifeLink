# Architecture and implementation plan

## Target AWS architecture

```text
Browser → CloudFront → private S3 frontend
Browser ↔ Cognito (registration, login, tokens)
Browser → API Gateway (Cognito authorizer) → Python Lambda → DynamoDB
Request Lambda → SQS buffering → priority scheduler → donor matching → SNS
Donor response → authenticated API → DynamoDB → hospital dashboard
CloudWatch ← logs, metrics and alarms from the application
```

The frontend uses HTML, CSS and JavaScript, as required. Cloud services will be provisioned in subsequent stages; this document describes a target design, not a deployed system.

## Data and roles

Start with separate DynamoDB tables for donors, hospitals, requests and responses, plus scheduling/idempotency records where necessary. Final keys and indexes will be defined before implementing the API. Donors own profiles and responses; hospitals own requests. Cognito identities and verified backend roles must authorize every protected operation. Admin role assignment must not be available through public registration.

## Scheduling requirements

SQS buffers asynchronous work; it does not supply priority ordering. Implement explicit Critical → Urgent → Normal selection with FIFO within each priority. The implementation must define arrival order, atomic claims, leases/recovery, duplicate delivery handling, retry and DLQ behavior. An eventually consistent DynamoDB index alone cannot guarantee strict global FIFO. Ordering and concurrency guarantees need executable tests before claiming completion. Document the fairness tradeoff if aging is enabled.

## Delivery milestones

1. Foundation: repository, page layouts, navigation and honest empty states (current).
2. Identity: Cognito, role-aware pages and API authorization.
3. Core records: DynamoDB schema, validated APIs, profiles and request persistence.
4. Matching: configurable compatibility, location, availability and eligibility rules.
5. Processing: SQS, scheduler, SNS and idempotent processing.
6. Reliability: no matches, cancellation/replacement, duplicate requests, processing failure and concurrent acceptance tests.
7. Deployment: infrastructure as code, least-privilege IAM, S3/CloudFront, CloudWatch and a load-testing plan with explicit quota assumptions.

Keep deployments aligned with AWS requirements. No cloud capacity, sent notification or successful medical match should be claimed without evidence.
