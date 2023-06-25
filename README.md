# aacc-membership
Handles the automation of membership information for AACC and ABCS

Currently: unimplemented

Version 1.0 goals:
- Schedule lambda the 1st of every month to refresh membership logs
- Schedule lambda every 1st Monday of the month to clear leadership info form and notify respondees
- Upload settings.json to S3 bucket with auth info
- Update settings.json in S3 bucket through the console
- Deploy AWS CloudWatch, AWS Lambda, and AWS S3 bucket using Terraform
- Send AACC leadership confirmation email through the console