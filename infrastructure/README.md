# AWS infrastructure

`auth.yaml` defines Cognito authentication: email user pool, secretless OAuth web client, hosted UI domain and role groups. Setup commands and verification steps are in [the authentication guide](../docs/authentication.md). The template has not been deployed or service-validated; no AWS resources have been created by the agent.

API Gateway, Python Lambda, DynamoDB, SQS/DLQs, SNS, IAM, CloudWatch, S3 and CloudFront remain planned. Keep secret credentials out of this repository.
