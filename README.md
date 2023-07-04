# Membership Automation Tool
![Static Badge](https://img.shields.io/badge/version-0.2-blue)

Handles the automation of membership information for AACC and ABCS. Based off of my previous [AACC automation project](https://github.com/cloudydaiyz/aacc-membership-log).

### v0.2:
- Can manually update the AACC membership log through the console
- Can manually send the AACC leadership update through the console
- Update settings.json in S3 bucket through the console
- Can upload settings info to S3 through the console

### v0.1:
- Added implementation for updating the AACC membership log
- Added implementation for sending the AACC leadership update through the console
- Added implementation to retreiving/sending settings data from/to S3 bucket

## v1.0 goals:
- Schedule lambda the 1st of every month to refresh membership logs
- Schedule lambda every 1st Monday of the month to clear leadership info form and notify respondees
- Deploy AWS CloudWatch and AWS Lambda using Terraform
