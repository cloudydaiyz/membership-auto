// Handles the email sending for leadership roles

import moment from "moment"
import nodemailer from "nodemailer";
import { getLogInfo } from "./membership.js"
import { getSettings } from "./settings-manager.mjs";

let settings;

export async function sendLeadershipUpdate(googleClient, importedSettings) {
    // console.log(moment());
    const sheets = googleClient.sheets('v4');

    if(!settings) {
        updateSettings(importedSettings);
    }

    const emailList = await obtainEmailList(sheets);
    sendEmail(emailList);
}

function updateSettings(importedSettings) {
    if(importedSettings) {
        settings = importedSettings;
    } else {
        settings = getSettings();
    }
}

// Returns a list of people to email for leadership roles
async function obtainEmailList(sheets) {
    // Obtain sign up information from the sheet
    let sheetMembers = await sheets.spreadsheets.values.get(
        {
          spreadsheetId: settings.google_ids.LEADERSHIP_SIGN_UP_ID,
          range: settings.ranges.SIGN_IN_INFO
        }
    )
    sheetMembers = sheetMembers.data.values;

    // Obtain the current AACC members from the membership log
    const currentMembers = await getLogInfo(sheets, settings);
    
    // Populate the email list only with people who responded in the past month
    let emailList = [];
    const oneMonthAgo = moment().subtract(1, "months");
    for(let i = 0; i < sheetMembers.length; i++) {
        let memberInfo = sheetMembers[i];
        let timestamp = memberInfo[0];
        let timestampDate = timestamp.substring(0, timestamp.indexOf(" "));
        
        const timestampMoment = moment(timestampDate, "M/D/YYYY");
        if(timestampMoment.isAfter(oneMonthAgo)) {
            // Don't add them to the email list if they're already an officer
            if(memberInfo[3] in currentMembers && currentMembers[memberInfo[3]].role > 0) {
                console.log(`${memberInfo[1]} with email ${memberInfo[4]} answered this past month. They're already an officer!`);
            } else {
                console.log(`${memberInfo[1]} with email ${memberInfo[4]} answered this past month`);
                emailList.push(memberInfo[4]);
            }
        }
    }

    return emailList;
}

async function sendEmail(emailList) {
    // Create the string of emails to send to from the email list
    let emailString = "";
    for(let i = 0; i < emailList.length; i++) {
        emailString += emailList[i];
        if(i < emailList.length - 1) {
            emailString += ", ";
        }
    }

    // Create the transport for nodemailer
    const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "kduncan@utexas.edu",
            pass: settings.google_app_data.APP_PASSWORD
        }
    });

    // Update the mailing options
    const mailOptions = {
        from: "kduncan@utexas.edu",
        to: emailString,
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

    // Send the mail to everyone in the list
    transport.sendMail(mailOptions);
}