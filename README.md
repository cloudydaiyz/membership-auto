![Static Badge](https://img.shields.io/badge/version-1.0-blue)
# Membership Automation Tool

Handles the automation of membership information for AACC and ABCS using Node.js. Based off of my previous [AACC automation project](https://github.com/cloudydaiyz/aacc-membership-log).

## Next Goals
- Create a public utility npm package and utilizing Lambda Layers to minimize code
- Create the same functionality for ABCS membership logs
- Add TypeScript for better typing

## Update Logs
### v1.0:
- Schedule lambda the 1st of every month to refresh membership logs for AACC
- Schedule lambda every 1st Monday of the month to clear leadership info form and notify respondees for AACC
- Sort event log based on date for AACC
- Add send leadership meeting follow up email to the console for AACC

### v0.2:
- Can manually update the AACC membership log through the console
- Can manually send the AACC leadership update through the console
- Update settings.json in S3 bucket through the console
- Can upload settings info to S3 through the console

### v0.1:
- Added implementation for updating the AACC membership log
- Added implementation for sending the AACC leadership update through the console
- Added implementation to retreiving/sending settings data from/to S3 bucket
