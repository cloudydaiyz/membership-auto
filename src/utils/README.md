![Static Badge](https://img.shields.io/badge/version-1.0.5-blue)
# Membership Automation Tool - Utilities

A utility package for the Membership Automation project. The functions provided by this project are included below:

## settings-manager
Referenced by using `@cloudydaiyz/membership-auto-utils/settings-manager.mjs`
```
settings = getSettings(path)
await getCredentials(google, settings)
await saveCredentials(google, settings)
```

## membership
Referenced by using `@cloudydaiyz/membership-auto-utils/membership.js`
```
await updateMembershipLog(googleClient, settings)
await clearLogInfo(sheets, settings)
members = await getLogInfo(sheets, settings)
```

## notification
Referenced by using `@cloudydaiyz/membership-auto-utils/notification.js`
```
await sendLeadershipUpdate(googleClient, mailOptions, settings)
```