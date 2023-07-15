// Handles settings within this file and in AWS

// Exported function(s):
// settings = getSettings(path)
// getCredentials(google, settings)
// saveCredentials(google, settings)

import fs from "fs";
import AWS from "aws-sdk";

let s3;

// Get the settings object from the settings JSON
export function getSettings(path) {
    const jsonString = fs.readFileSync(path);
    const settings = JSON.parse(jsonString);

    return settings;
}

// HELPER FUNCTION
// Retrieves the S3 client with correct configurations
async function getS3(settings) {
    // await getSettings();
    console.log("getS3");

    await AWS.config.update({
        accessKeyId: settings.aws_data.ACCESS_KEY_ID,
        secretAccessKey: settings.aws_data.ACCESS_KEY_SECRET,
        region: settings.aws_data.REGION
    });

    s3 = new AWS.S3();
}

// Updates the google OAuth2 credentials from credentials.json in S3 bucket
export async function getCredentials(google, settings) {
    // Get tokens from S3 bucket
    let tokens = await getAwsSettings(settings);
    
    // Set up Google's OAuth2Client with the tokens from the S3 bucket
    const oauth2Client = new google.auth.OAuth2(
        settings.google_app_data.CLIENT_ID,
        settings.google_app_data.CLIENT_SECRET,
        settings.google_app_data.REDIRECT_URL
    );
    await oauth2Client.setCredentials(tokens);
    await google.options({auth: oauth2Client});
}

// HELPER FUNCTION
// Retreives credentials.json from S3 bucket
async function getAwsSettings(settings) {
    await getS3(settings);

    const params = {
        Bucket: settings.aws_data.BUCKET,
        Key: settings.aws_data.KEY
    };

    console.log("get object");
    let content;
    await s3.getObject(params, (err, data) => {
        if (err) {
            console.error(err);
        } else {
            content = JSON.parse(data.Body.toString());
        }
    }).promise();
    console.log("get object done");

    return content;
}

// Saves the current google credentials to S3 bucket
// NOTE: requires a call to getCredentials first
export async function saveCredentials(google, settings) {
    // Doing something sneaky here to obtain the tokens from our OAuthClient
    if(google._options.auth) {
        let tokens = google._options.auth.credentials;
        setAwsSettings(tokens, settings);
    } else {
        console.error("REQUIRES A CALL TO getCredentials() FIRST");
    }
}

// HELPER FUNCTION
// Sets credentials.json to S3 bucket
async function setAwsSettings(credentials, settings) {
    await getS3(settings);

    if(!credentials) {
        console.log("No data detected -- ABORTING");
        return;
    }

    const params2 = {
        Bucket: settings.aws_data.BUCKET, // 'YOUR_BUCKET_NAME',
        Key: settings.aws_data.KEY, // 'path/to/your/file.json',
        Body: JSON.stringify(credentials),
        ContentType: 'application/json'
    };
    
    await s3.putObject(params2, (err, data) => {
        if(err) {
            console.log("error :(");
        }
        // Otherwise, we've saved the data!
    });
}