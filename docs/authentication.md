# Connecting Amazon Cognito

## What is implemented

The frontend supports Cognito hosted sign-up/sign-in, verified email through Cognito, password recovery on its hosted page, authorization code exchange with PKCE S256, token signature verification, role-based page navigation, session expiry and sign-out. No passwords enter LifeLink's JavaScript. Until configured, the sign-in page explains setup and offers explicit layout previews.

This integration has automated local tests, but has **not been deployed or tested against a live AWS user pool**. Request processing and donor records remain previews. Frontend route checks do not authorize API access: every future protected API must verify the token and enforce role and ownership on the backend before handling data.

## 1. Create the authentication stack

Use an AWS account and an AWS CLI profile with CloudFormation and Cognito provisioning permissions. No credentials belong in the frontend or repository. The commands below create real AWS resources when you choose to run them. Choose an available domain prefix; the example must be changed.

From the repository root, in PowerShell:

```powershell
aws cloudformation validate-template --template-body file://infrastructure/auth.yaml --region ap-south-1
aws cloudformation deploy --template-file infrastructure/auth.yaml --stack-name lifelink-auth --region ap-south-1 --parameter-overrides DomainPrefix=lifelink-your-unique-name
aws cloudformation describe-stacks --stack-name lifelink-auth --region ap-south-1 --query "Stacks[0].Outputs" --output table
```

The template creates an email-based Cognito user pool, secretless public web client, classic hosted UI domain, and donor/hospital/admin groups. Passwords require at least 12 characters with upper/lowercase letters, numbers and symbols. ID and access tokens last 30 minutes. The pool is retained on stack deletion to avoid accidental account loss. Group membership is assigned by a trusted administrator, not a sign-up attribute.

## 2. Fill in public configuration

Edit `frontend/config.js` with the stack outputs:

```javascript
window.LIFELINK_CONFIG = Object.freeze({
  region: 'ap-south-1',
  userPoolId: 'COPY_UserPoolId_OUTPUT',
  clientId: 'COPY_ClientId_OUTPUT',
  cognitoDomain: 'COPY_CognitoDomain_OUTPUT',
  redirectUri: 'http://localhost:5500/',
  logoutUri: 'http://localhost:5500/'
});
```

These values are public identifiers, not AWS secrets. Do not add an app client secret or IAM access keys. Use exactly `http://localhost:5500/` for local testing, including the trailing slash. Opening files directly or using `127.0.0.1` instead of `localhost` will not match this callback. Hosted deployments need HTTPS callback/logout addresses configured both in the stack parameters and this file.

## 3. Register and assign a role

Run `npm run dev`, open http://localhost:5500/#account and choose **Create an account**. Register on Cognito and confirm the verification email. New users see a role-pending account page. An administrator must verify the intended access and assign the group through the Cognito console or AWS CLI:

```powershell
aws cognito-idp admin-add-user-to-group --user-pool-id YOUR_POOL_ID --username USER_EMAIL --group-name donor --region ap-south-1
```

Use `hospital` only for authorized requesters and `admin` only for trusted project administrators. The public role selector only chooses a destination; it does not grant permissions. Sign out and back in after membership changes so the new token includes the group. Role removals take effect in this UI when tokens expire or the user signs in again; future backend design must account for token lifetime and any immediate-revocation requirements.

## 4. Session behavior and live verification checklist

Tokens and one-time OAuth state are stored in `sessionStorage` (per tab). JWT signatures are verified against the pool's JWKS; issuer, audience/client ID, token type, expiration, subject and callback nonce/state are checked. Tokens are removed from callback URLs after processing. No refresh token is persisted: after expiry users sign in again. Sign-out clears local tokens and opens Cognito's logout endpoint. Existing access tokens can remain valid until expiry; this is not global token revocation.

After deploying, verify all of these with real test accounts:

- Create an account, confirm email, sign in and test password recovery.
- Check the pending-role page before a group is assigned.
- Assign donor/hospital/admin groups, sign in again and check the intended dashboard.
- A donor visiting `#admin` or `#hospital` must see an access message.
- Sign out, reload and use the browser back button; protected dashboard navigation must require sign-in.
- Try a callback with a wrong state, reload after expiry, and check network failures produce errors without an active session.
- Confirm callback query parameters disappear and passwords/tokens are not logged.

Local tests: `npm test`. CloudFormation service validation and live integration checks require an AWS account and have not been run by the agent.

## AWS references

- [Authorization endpoint](https://docs.aws.amazon.com/cognito/latest/developerguide/authorization-endpoint.html)
- [PKCE authorization code flow](https://docs.aws.amazon.com/cognito/latest/developerguide/using-pkce-in-authorization-code.html)
- [Token endpoint](https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html)
- [Logout endpoint](https://docs.aws.amazon.com/cognito/latest/developerguide/logout-endpoint.html)
- [CloudFormation public client configuration](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-cognito-userpoolclient.html)

The current module handles frontend identity only. Backend API authorization, profile persistence and automatic approval workflows are subsequent milestones.
