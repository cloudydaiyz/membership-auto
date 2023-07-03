// Entry point for application

import { test, updateMembershipLog } from "./membership.js";
import { sendLeadershipUpdate } from "./notification.js";
import { getSettings } from "./settings-manager.js";
import open from "open";
import { google } from "googleapis";
import promptSync from "prompt-sync";

const settings = getSettings();
const prompt = promptSync();

const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets'
];

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
    const oauth2Client = new google.auth.OAuth2(
        settings.google_app_data.CLIENT_ID,
        settings.google_app_data.CLIENT_SECRET,
        settings.google_app_data.REDIRECT_URL
    );

    const url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',
        
        // If you only need one scope you can pass it as a string
        scope: scopes,
        
        // So that the user consent prompt always shows up (and we can always get a refresh token)
        // Source: https://github.com/googleapis/google-api-nodejs-client/issues/750#issuecomment-368873635
        prompt: 'consent'
    });

    await open(url);
    const auth_code = prompt("Please enter the authorization code: ");

    // Get the auth token from the user's authorization code
    const {tokens} = await oauth2Client.getToken(auth_code);
    // console.log(tokens);

    oauth2Client.setCredentials(tokens);
    google.options({auth: oauth2Client});
}

async function updateLogs() {
    await getAuth();
    await updateMembershipLog(google);
}

async function notify() {
    await getAuth();
    await sendLeadershipUpdate(google);
}

updateLogs();
// notify();