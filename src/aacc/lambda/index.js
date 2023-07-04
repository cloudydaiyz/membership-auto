// Entry point for application

import { updateMembershipLog } from "./membership.js";
import { sendLeadershipUpdate } from "./notification.js";
import { getSettings, getAwsSettings, setAwsSettings } from "./settings-manager.mjs";
import { google } from "googleapis";

const settings = getSettings();
let tokens;

// Handler for the lambda function
// exports.handler = async(event) => {
//     // TODO implement
//     const response = {
//         statusCode: 200,
//         body: JSON.stringify('Hello from Lambda!'),
//     };
//     return response;
// };

async function getAuth() {
    // Create the OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
        settings.google_app_data.CLIENT_ID,
        settings.google_app_data.CLIENT_SECRET,
        settings.google_app_data.REDIRECT_URL
    );
    
    // Retreive previous tokens from S3 bucket
    tokens = await getAwsSettings();
    // console.log(JSON.stringify(tokens));
    oauth2Client.setCredentials(tokens);

    // Update the credentials accordingly if tokens are changed
    oauth2Client.on("tokens", (newTokens) => {
        console.log("NEW TOKEN:");
        console.log(newTokens);
        tokens = newTokens;
    });

    google.options({auth: oauth2Client});
}

// Update the AACC membership log
async function updateLogs() {
    await getAuth();
    await updateMembershipLog(google);
    await setAwsSettings(tokens);
}

// Send the AACC leadership update
async function notify() {
    await getAuth();
    await sendLeadershipUpdate(google);
    await setAwsSettings(tokens);
}

// updateLogs();
notify();