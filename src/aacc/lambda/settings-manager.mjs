// Handles settings within this file and in AWS

import fs from "fs";
import AWS from "aws-sdk";

let settings;
let s3;

// Get the settings object from the settings JSON
export function getSettings(path) {
    if(!settings) {
        if(!path) {
            path = "./settings.json";
        }
        const jsonString = fs.readFileSync(path);
        settings = JSON.parse(jsonString);
    }
    return settings;
}

// Retrieves the S3 client with correct configurations
async function getS3() {
    await getSettings();
    console.log("getS3");

    await AWS.config.update({
        accessKeyId: settings.aws_data.ACCESS_KEY_ID,
        secretAccessKey: settings.aws_data.ACCESS_KEY_SECRET,
        region: settings.aws_data.REGION
    });

    s3 = new AWS.S3();
}

// Retreives credentials.json from S3 bucket
export async function getAwsSettings() {
    await getS3();

    const params = {
        Bucket: settings.aws_data.BUCKET,
        Key: settings.aws_data.KEY
    };

    // console.log("get object");
    let content;
    await s3.getObject(params, (err, data) => {
        if (err) {
            console.error(err);
        } else {
            content = JSON.parse(data.Body.toString());
        }
    }).promise();
    // console.log("get object done");
    return content;
}

// Sets credentials.json to S3 bucket
export async function setAwsSettings(credentials) {
    await getS3();

    if(!credentials) {
        console.log("No data detected -- ABORTING");
        return;
    } else {
        console.log("SAVING DATA:");
        // console.log(credentials);
    }

    const params2 = {
        Bucket: settings.aws_data.BUCKET, // 'YOUR_BUCKET_NAME',
        Key: settings.aws_data.KEY, // 'path/to/your/file.json',
        Body: JSON.stringify(credentials),
        ContentType: 'application/json'
    };
    
    await s3.putObject(params2, (err, data) => {
        if (err) {
            console.error(err);
        } else {
            console.log('File successfully uploaded to S3');
        }
    });
}