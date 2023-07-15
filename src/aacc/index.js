// Entry point for application

import { updateMembershipLog } from "@cloudydaiyz/membership-auto-utils/membership.js";
import { sendLeadershipUpdate } from "@cloudydaiyz/membership-auto-utils/notification.js";
import { getSettings, getCredentials, saveCredentials } from "@cloudydaiyz/membership-auto-utils/settings-manager.mjs";
import { google } from "googleapis";

// Handler for the lambda function
export const handler = async(event) => {
    // Assume success for the response
    let response = {
        statusCode: 200,
        body: "Update complete!"
    };

    // Check what we need to do
    let update = event["update"];
    if(update) {
        // Since the update could be valid, get the settings and update
        // the google credentials
        const settings = getSettings("./settings.json");
        await getCredentials(google, settings);

        if(update == "membership_logs"){
            // Update the membership logs
            await updateMembershipLog(google, settings);
        } else if(update == "leadership_update"){
            // Obtain the mail options
            const mailOptions = {
                from: "kduncan@utexas.edu",
                subject: "AACC Leadership Update",
                html: `Hey y'all,<br>
                <br>
                Thank you for expressing interest in an AACC leadership role! You can find more information about 
                each of the leadership roles that we'll offer during the school year in <a href=${settings.links.LEADERSHIP_DOC}>this document.</a> <br>
                <br>
                If you are still interested in being in AACC leadership, please join our informational session <b>this 
                upcoming Sunday at 5pm CST</b> at <a href=${settings.links.ZOOM}>this Zoom link</a>, where we will go over the roles and expectations in 
                depth and help onboard those who are interested in being an AACC Ambassador. If you are unable to 
                attend the meeting, please let me know. <br>
                <br>
                I'm looking forward to working with you soon!<br>
                <br>
                Best,<br>
                Kylan`
            };

            // Send the leadership update notification
            await sendLeadershipUpdate(google, mailOptions, settings);
        } else {
            response = {
                statusCode: 400,
                body: "Invalid update input"
            };
        }

        // Save the google credentials just in case it's been updated
        // from an operation
        await saveCredentials(google, settings);
    } else {
        // Invalid event object
        response = {
            statusCode: 400,
            body: "No update key specified."
        };
    }
    return response;
};