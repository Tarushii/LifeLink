# LifeLink -- Serverless Cloud-Based Blood Donor Management System

## Project Brief for AI Development

Act as a senior full-stack developer and AWS cloud architect. Build a
complete, functional college-level Cloud Computing project named
**LifeLink**.

LifeLink connects blood donors with hospitals or patients who need blood
urgently. The application must demonstrate a real serverless AWS
architecture, donor matching, email notifications, scalable request
processing, and **priority scheduling with FIFO ordering within each
priority level**.

Do not build only a static UI or a prototype with non-functional
buttons. Create a working application with frontend, backend logic,
database integration, and clear AWS deployment instructions.

------------------------------------------------------------------------

## 1. Core Objective and Workflow

### Donors

Donors should be able to: - Register and log in. - Enter their name,
email, contact details, blood group, city/location, and last donation
date. - Set their availability status. - View matching emergency blood
requests. - Accept or decline a request using **I Can Donate** or
**Decline**. - View their response/donation history.

### Hospitals / Requesters

Hospitals or authorized requesters should be able to: - Register and log
in. - Create an emergency blood request. - Specify blood group, number
of units, location, required date, and urgency. - View matching donors
and their responses. - Track each request's status.

### Matching

The system should identify potentially suitable donors using: - Blood
group compatibility. - Location or distance. - Availability. - Basic
donation eligibility, including the last donation date.

Use configurable compatibility and eligibility rules. Do not present the
application as a substitute for medical advice or professional
blood-bank screening.

### Main workflow

1.  A hospital creates an emergency request.
2.  The request is validated and saved.
3.  The request enters the asynchronous processing workflow.
4.  The priority scheduler selects the next request according to
    priority and FIFO rules.
5.  The matching component finds suitable donors.
6.  Amazon SNS sends email notifications to matched donors.
7.  Donors log in and accept or decline.
8.  The hospital dashboard displays responses and updated request
    status.

------------------------------------------------------------------------

## 2. Required Technology Stack and AWS Architecture

Use the following technologies:

  -----------------------------------------------------------------------
  Layer                   Technology              Responsibility
  ----------------------- ----------------------- -----------------------
  Frontend                HTML, CSS, JavaScript   Responsive web
                                                  application

  Static hosting          Amazon S3               Stores and hosts
                                                  frontend files

  Content delivery        Amazon CloudFront       CDN and cached content
                                                  delivery

  Authentication          Amazon Cognito          Registration, login and
                                                  token-based
                                                  authentication

  API                     Amazon API Gateway      REST endpoints and
                                                  request routing

  Backend                 Python on AWS Lambda    Serverless application
                                                  logic

  Database                Amazon DynamoDB         Donor, hospital,
                                                  request and response
                                                  records

  Notifications           Amazon SNS              Email notifications to
                                                  matched donors

  Queue                   Amazon SQS              Buffers incoming
                                                  emergency requests

  Monitoring              Amazon CloudWatch       Logs, metrics, alarms
                                                  and error monitoring

  Permissions             AWS IAM                 Least-privilege
                                                  permissions between
                                                  services
  -----------------------------------------------------------------------

### Architecture overview

**Frontend flow:**

Browser → CloudFront → S3

The frontend authenticates users through Cognito and sends authenticated
API requests to API Gateway.

**Application API flow:**

Frontend → API Gateway → Lambda → DynamoDB

Cognito operates as the authentication provider. API Gateway must verify
Cognito tokens for protected endpoints.

**Emergency request processing flow:**

Hospital creates request → API Gateway → Request Lambda → SQS → Priority
Processing Lambda/Scheduler → DynamoDB → Donor Matching → SNS → Donor
email notifications.

**Donor response flow:**

Donor accepts or declines → API Gateway → Response Lambda → DynamoDB →
Hospital dashboard.

CloudWatch monitors the relevant AWS services and application functions.

SQS is for buffering asynchronous emergency-request processing. It is
**not** the login or authentication mechanism.

------------------------------------------------------------------------

## 3. Priority Scheduling with FIFO -- Mandatory Feature

This is a key project requirement. Implement priority-based processing
while preserving FIFO order among requests with the same priority.

Every emergency request must have one of three priority levels:

1.  **Critical** -- life-threatening emergency.
2.  **Urgent** -- urgent blood requirement.
3.  **Normal** -- regular requirement.

### Scheduling rules

Process requests in this priority order:

**Critical → Urgent → Normal**

Within each priority level, process requests in the order they arrived
(FIFO: First In, First Out).

Example:

  Request   Priority     Arrival order
  --------- ---------- ---------------
  R1        Normal                   1
  R2        Critical                 2
  R3        Urgent                   3
  R4        Critical                 4
  R5        Normal                   5

Expected processing order:

**R2 → R4 → R3 → R1 → R5**

### Implementation requirements

-   Store a request ID, priority, priority rank, creation timestamp and
    processing status.
-   Use SQS to buffer incoming requests.
-   Implement priority explicitly using either separate queues for each
    priority with a scheduler, or a scheduler backed by a DynamoDB
    request store/index.
-   Do not assume that SQS natively supports priority ordering.
-   Preserve FIFO ordering within each priority.
-   Prevent two workers from claiming the same request using
    conditional/atomic database updates.
-   Make processing idempotent because SQS can deliver a message more
    than once.
-   Configure retries and a dead-letter queue (DLQ) for repeatedly
    failing messages.
-   Consider a simple priority-aging or waiting-time rule to reduce the
    chance of Normal requests being delayed indefinitely.

**Important distinction:** The scheduler controls which request is
processed first. It does not guarantee that blood is available or that a
request will be fulfilled. Hospitals and qualified medical professionals
remain responsible for actual blood allocation and verification.

------------------------------------------------------------------------

## 4. Five Mandatory Edge Cases

Implement backend handling and visible UI feedback for all five cases.
Do not merely display a message without implementing the corresponding
logic.

### Edge case 1: No suitable donors found nearby

-   If no compatible and eligible donors are found in the initial search
    area, show that no suitable donors are currently available.
-   Allow the search radius or location range to be expanded.
-   Inform the hospital that it may need to contact a blood bank or seek
    other assistance.
-   Never display fabricated donor matches.

### Edge case 2: Donor accepts and then cancels

-   Allow a donor to change an accepted response to cancelled, subject
    to the request's current status.
-   Update the donor response record.
-   Notify the hospital about the cancellation.
-   Allow the system to identify and notify replacement donors.
-   Keep the request open until it is fulfilled or cancelled.

### Edge case 3: Duplicate emergency requests

-   Prevent accidental duplicate submissions caused by repeated clicks
    or network retries.
-   Generate a unique request ID.
-   Implement an idempotency mechanism for request creation.
-   Avoid sending multiple notification batches for the same request.

### Edge case 4: Lambda or message-processing failure

-   Implement retry handling for failed processing.
-   Configure an SQS dead-letter queue for messages that repeatedly
    fail.
-   Log errors and relevant context in CloudWatch.
-   Ensure that a failed processing attempt does not silently lose an
    emergency request.
-   Make retry processing safe through idempotency.

### Edge case 5: Multiple donors accept the same request simultaneously

-   Handle concurrent donor responses safely.
-   Prevent duplicate acceptance records from the same donor.
-   Use DynamoDB conditional writes or equivalent atomic operations
    where appropriate.
-   Display all valid donor responses to the hospital.
-   Do not assume that the first response guarantees blood availability.

Also stop unnecessary notifications when a request is fulfilled or
cancelled.

------------------------------------------------------------------------

## 5. Application Pages and Modules

Build the following pages with role-based access.

### A. Home page

-   LifeLink introduction and explanation.
-   How the system works.
-   Donor registration/login.
-   Hospital registration/login.
-   Emergency request entry point.

### B. Donor dashboard

-   Donor profile and details.
-   Blood group and location.
-   Last donation date.
-   Availability toggle.
-   List of matching requests.
-   Accept and decline actions.
-   Response/donation history.

### C. Hospital dashboard

-   Create an emergency request.
-   Select blood group and units required.
-   Enter location and required date.
-   Select Critical, Urgent or Normal priority.
-   View submitted requests.
-   View matching donors and donor responses.
-   Track request status.

### D. Admin dashboard

-   View registered donors and hospitals.
-   View emergency requests.
-   Monitor priority and processing status.
-   View donor responses.
-   Flag suspicious records or inappropriate activity.

------------------------------------------------------------------------

## 6. DynamoDB Data Design

Create a suitable DynamoDB table design for:

-   Donors
-   Hospitals
-   Emergency Requests
-   Donor Responses

You may use separate tables or a well-designed single-table approach.
Explain the choice and provide the required partition keys, sort keys
and indexes.

Suggested donor attributes: - donor_id - name - email - phone -
blood_group - location - last_donation_date - availability - created_at

Suggested emergency request attributes: - request_id - hospital_id -
blood_group - units_required - location - required_date - priority -
priority_rank - created_at - status - processing_status -
idempotency_key

Suggested donor response attributes: - response_id - request_id -
donor_id - response_status - response_timestamp

Design queries and indexes so that requests can be retrieved by priority
and arrival time without unnecessarily scanning the entire database.
Explain any limitations of the chosen indexing/scheduling approach.

------------------------------------------------------------------------

## 7. Scalability: 10,000 Simultaneous Users

Design the application to demonstrate how a serverless architecture can
support high traffic without maintaining a manually managed application
server.

Use: - Cognito for managed authentication, subject to AWS quotas. - API
Gateway for API request handling and throttling. - Lambda for scalable
backend execution within configured concurrency limits. - DynamoDB
on-demand capacity where appropriate. - SQS to buffer spikes in
asynchronous emergency-request processing. - CloudWatch to monitor
latency, errors, throttling, Lambda concurrency and queue backlog.

Do not claim unlimited capacity or guarantee that 10,000 users will
always be handled without issues. Explain relevant AWS service quotas,
concurrency limits, throttling and retry behavior. Include a basic
load-testing plan.

Distinguish between: - **10,000 users logging in:** authentication is
handled by Cognito, with service quotas and rate limits considered. -
**A spike in emergency requests:** SQS buffers requests so processing
can happen asynchronously at a controlled rate.

------------------------------------------------------------------------

## 8. UI and Design Requirements

Create a modern, professional healthcare-themed interface.

-   White background with red accents.
-   Responsive layout for desktop and mobile.
-   Simple navigation and readable dashboards.
-   Clear visual distinction between Critical, Urgent and Normal.
-   Status labels such as Pending, Queued, Processing, Notified,
    Accepted, Fulfilled and Cancelled.
-   Form validation and helpful error messages.
-   Loading indicators and success/error feedback.
-   Accessible labels and sensible empty states.
-   Do not use fake statistics, fake donors or fake successful
    notifications.

------------------------------------------------------------------------

## 9. Security and Reliability

-   Use Cognito authentication for protected routes.
-   Enforce roles on the backend; hiding a button in the frontend is not
    sufficient authorization.
-   Use IAM least-privilege policies.
-   Validate and sanitize API inputs.
-   Do not expose AWS secret keys or credentials in frontend code or
    source control.
-   Store configuration in environment variables or appropriate AWS
    configuration services.
-   Use conditional database writes for concurrency-sensitive
    operations.
-   Make asynchronous processing idempotent.
-   Log errors without unnecessarily exposing personal information.
-   Use HTTPS for deployed application traffic.

------------------------------------------------------------------------

## 10. Development and Delivery Instructions

Build the project in manageable stages. Do not generate a huge
collection of files without explaining how they fit together.

### Suggested implementation order

1.  Provide the project folder structure and explain the architecture.
2.  Build the frontend pages and navigation.
3.  Set up Cognito authentication and role handling.
4.  Define DynamoDB tables, keys and indexes.
5.  Implement API Gateway endpoints and Python Lambda functions.
6.  Implement donor matching and eligibility checks.
7.  Integrate SNS email notifications.
8.  Implement SQS buffering, priority scheduling with FIFO within each
    priority, retries and DLQ.
9.  Implement the five mandatory edge cases.
10. Add CloudWatch logging and monitoring.
11. Test the application and document AWS deployment.

### Required deliverables

Provide: 1. Complete project folder structure. 2. All frontend HTML, CSS
and JavaScript files. 3. All Python Lambda function files. 4. DynamoDB
table definitions and setup instructions. 5. Cognito configuration
instructions. 6. API Gateway routes and integration instructions. 7. SQS
queue, priority scheduler and DLQ configuration. 8. SNS topic and email
subscription setup. 9. IAM roles and policies required. 10. S3 and
CloudFront deployment instructions. 11. Required environment variables
and configuration. 12. A README with local setup, testing and deployment
instructions. 13. Test cases demonstrating priority/FIFO behavior and
all five edge cases. 14. A short explanation of how the architecture
demonstrates Cloud Computing concepts.

### Local development

If AWS credentials or access are not available, provide a local
development mode using mock services or suitable local alternatives.
Clearly label simulated functionality and explain how to connect the
real AWS services later. Never claim an AWS service is connected or
working unless it has actually been configured and tested.

------------------------------------------------------------------------

## Final Acceptance Criteria

The project is complete only when:

-   Donors and hospitals can register/login and access the correct
    dashboards.
-   Hospitals can create emergency blood requests.
-   Requests are stored and their status can be tracked.
-   Donor matching uses blood group, location, availability and
    eligibility rules.
-   SNS email notifications can be sent to matched donors when
    configured.
-   Donors can accept or decline requests and hospitals can view
    responses.
-   Critical requests are processed before Urgent, and Urgent before
    Normal.
-   FIFO is preserved within each priority level.
-   SQS buffering, retries and DLQ behavior are implemented and
    documented.
-   All five mandatory edge cases have corresponding implementation and
    tests.
-   CloudWatch monitoring is configured or clearly documented for
    deployment.
-   The project includes clear setup, testing and AWS deployment
    instructions.

**Prioritize a functional, understandable and demonstrable college
project over unnecessary advanced features. Explain the code and AWS
setup step by step so a student can run, debug and present the project
confidently.**
