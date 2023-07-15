// Console interface to manually call functions

// import open from "open";
import readline from "readline-sync";
import { google } from "googleapis";
import { updateMembershipLog } from "../aacc/lambda/membership.js";
import { sendLeadershipUpdate } from "../aacc/lambda/notification.js";
import { getSettings, getAwsSettings, setAwsSettings } from "../utils/settings-manager.mjs";
import open from "open";

const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets'
];

let credentialsUpdated = false;
let settings = getSettings("../aacc/lambda/settings.json");
let tokens;

async function start() {
    console.log("Welcome to the membership-auto console!");
    // await updateAuth();

    console.log();

    let input = 0;
    while(input != -1) {
        console.log("What would you like to do?");
        console.log("[-1] Exit the console");
        console.log("[1] Update AWS credentials in S3 bucket");
        console.log("[2] Update the AACC membership log");
        console.log("[3] Send the AACC leadership update");
        console.log();
        input = parseInt(readline.question("Enter an option here: ").trim());

        if(input && -1 <= input && input <= 3) {
            if(input == -1) {
                console.log("Exiting console.");
            } else if(input == 1) {
                await updateCredentials();
            } else if(input == 2) {
                await getCredentials();
                await updateMembershipLog(google, settings);
            } else if(input == 3) {
                await getCredentials();
                await sendLeadershipUpdate(google, settings);
            }
        } else {
            console.log("Input not recognized. Please try again.");
        }
        console.log();
    }
}

async function getCredentials() {
    if(credentialsUpdated) {
        return;
    }

    const oauth2Client = new google.auth.OAuth2(
        settings.google_app_data.CLIENT_ID,
        settings.google_app_data.CLIENT_SECRET,
        settings.google_app_data.REDIRECT_URL
    );

    // Get tokens from S3 bucket
    tokens = await getAwsSettings();

    oauth2Client.setCredentials(tokens);
    google.options({auth: oauth2Client});
    credentialsUpdated = true;
}

// Updates the Oauth2Client credentials for google if it hasn't already been updated,
// and reflects the changes on S3
async function updateCredentials() {
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
    const auth_code = readline.question("Please enter the authorization code: ");

    // Get the auth token from the user's authorization code
    tokens = await oauth2Client.getToken(auth_code);
    // console.log(tokens.tokens);

    oauth2Client.setCredentials(tokens.tokens);
    google.options({auth: oauth2Client});
    credentialsUpdated = true;

    await setAwsSettings(tokens.tokens);
}

start();