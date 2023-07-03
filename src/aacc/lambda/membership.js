// Handles the membership information 

import moment from "moment"
import { getSettings } from "./settings-manager.js";
const settings = getSettings();

const membershipLogSheetId = settings.google_ids.MEMBERSHIP_LOG_SHEET_ID;
const logSheetGid = settings.google_ids.LOG_SHEET_GID;
const rootFolderId = settings.google_ids.ROOT_FOLDER_ID;

let events = [];
let eventTypesToCost = {};
let members = {};
let membershipRoles = ["Member", "Ambassador", "Event Planning Committee", "Officer"];

export async function test() {
    console.log("Hello world!");
}

// Updates the membership log with membership point & event info
export async function updateMembershipLog(googleClient) {
    const sheets = googleClient.sheets('v4');
    const drive = googleClient.drive('v3');

    await getLogInfo(sheets); // WORKING
    // console.log(members);
    // console.log(eventTypesToCost);
    await clearLogInfo(sheets); // WORKING
    await getAttendance(drive, sheets); // WORKING
    await postLogInfo(sheets); // WORKING
}

// Clears current member and event information from the sheet
export async function clearLogInfo(sheets) {
    // Clear the Event Log, Membership Log, and the event IDs in the Membership log
    await sheets.spreadsheets.values.batchClear(
        {
            spreadsheetId: membershipLogSheetId,
            ranges: [settings.ranges.EVENT_LOG, settings.ranges.MEMBERSHIP_LOG, settings.ranges.EVENT_IDS]
        }
    );
}

// Obtains current member and event information from the sheet
export async function getLogInfo(sheets) {
    // Get each event type and the membership points associated with each type
    let types = await sheets.spreadsheets.values.batchGet(
        {
          spreadsheetId: membershipLogSheetId,
          ranges: [settings.ranges.EVENT_TYPES, settings.ranges.EVENT_COSTS],
          majorDimension: "COLUMNS"
        }
    )
    types = types.data.valueRanges;
    let eventTypes = types[0].values[0];
    let eventCosts = types[1].values[0];

    // Associate each event type to the corresponding event cost
    for(let i = 0; i < eventCosts.length; i++) {
        eventTypesToCost[eventTypes[i]] = parseInt(eventCosts[i]);
    }

    // Obtain current member information from the sheet
    let sheetMembers = await sheets.spreadsheets.values.get(
        {
          spreadsheetId: membershipLogSheetId,
          range: settings.ranges.MEMBERSHIP_INFO,
        }
    )
    sheetMembers = sheetMembers.data.values;

    // Create member objects for existing members to preserve their info
    if(sheetMembers) {
        for(let i = 0; i < sheetMembers.length; i++) {
            let currentMember = sheetMembers[i];
            let currentRole = getRole(currentMember[5]);

            // NOTE: No need to preserve membership points, they'll be recalculated
            members[currentMember[2]] = {
                firstName: currentMember[0],
                lastName: currentMember[1],
                email: currentMember[3],
                phone: currentMember[4] || "",
                role: currentRole, // index in the membership_roles array
                eventsAttended: [],
                fallMembershipPoints: 0, 
                springMembershipPoints: 0,
                membershipPoints: 0
            }
        }
    }

    // Returns the updated list of members (already included as a global variable
    // in this module)
    return members;
}

// Gets the index of the roleName in the list of membershipRoles, and assumes
// a Member role if it doesn't exist
function getRole(roleName) {
    for(let i = 0; i < membershipRoles.length; i++) {
        if(membershipRoles[i] == roleName) {
            return i;
        }
    }
    return 0;
}

// Go through each spreadsheet in the drive from the root folder and get attendance
// of each member
async function getAttendance(drive, sheets) {
    // Get the folders of each event type
    let eventTypeFolders = await drive.files.list(
        {
            pageSize: 150,
            q: `'${rootFolderId}' in parents and trashed=false`
        }
    )
    eventTypeFolders = eventTypeFolders.data.files;

    // Go through each of the folders
    let eventCount = 0;
    for(let i = 0; i < eventTypeFolders.length; i++) {
        const currentEventType = eventTypeFolders[i];

        // Check if the name of the folder is a valid event type
        if(currentEventType["name"] in eventTypesToCost) {
            // Get the sign in spreadsheets in the folder
            let eventsForCurrentType = await drive.files.list(
                {
                    pageSize: 150,
                    q: `'${currentEventType["id"]}' in parents and trashed=false`
                }
            )
            eventsForCurrentType = eventsForCurrentType.data.files;
            
            // Get attendance information from each sheet in the folder
            for(let j = 0; j < eventsForCurrentType.length; j++) {
                // Create the event object and put it into the event list
                const currentEvent = eventsForCurrentType[j];
                const currentEventNameInfo = extractNameInfo(currentEvent["name"]); // event name and event date
                console.log(currentEvent);
                let eventObject = {
                    eventName: currentEventNameInfo[1],
                    eventType: currentEventType["name"],
                    eventDate: currentEventNameInfo[0],
                    spreadsheetId: currentEvent["id"]
                };
                events.push(eventObject);

                // Update attendance information from the event
                await getAttendanceInSheet(sheets, eventCount);
                eventCount++;
            }
        }
    }
}

// Each spreadsheet in the drive will have this format:
// [DATE] [EVENT NAME]
// where the name of the event can have spaces and alphanumeric numbers.
// This function takes the spreadsheet name, and extracts the date and the event name
// into an array of 2 items: [date, eventName].
function extractNameInfo(eventName) {
    let splitPoint = eventName.indexOf(" ");
    return [eventName.substring(0, splitPoint), eventName.substring(splitPoint + 1)];
}

// Get attendance of each member in a particular spreadsheet
async function getAttendanceInSheet(sheets, eventId) {
    // Get the spreadsheetId from the event (using the eventId)
    const event = events[eventId];
    let attendees = await sheets.spreadsheets.values.get(
        {
          spreadsheetId: event.spreadsheetId,
          range: settings.ranges.SIGN_IN_INFO,
        }
    )
    attendees = attendees.data.values;

    // Determine whether the event is a fall semester or a spring semester event
    const eventDate = moment(event.eventDate, "M/D/YYYY");
    const cutoff = moment("1/1/2024", "M/D/YYYY");
    let fallSemester = true;
    if(!eventDate.isBefore(cutoff)) {
        fallSemester = false;
    }

    // Go through the attendees of the event and update their membership information
    for(let i = 0; i < attendees.length; i++) {
        const attendeeInfo = attendees[i];
        const utEid = attendeeInfo[3].toLowerCase();
        
        // Check if the member is already in the members dictionary, otherwise add a new one
        let attendee;
        if(utEid in members) {
            attendee = members[utEid];
        } else {
            attendee = {
                firstName: attendeeInfo[1],
                lastName: attendeeInfo[2],
                email: attendeeInfo[4],
                phone: attendeeInfo[5] || "",
                role: 0, // assume person is a member
                eventsAttended: [],
                fallMembershipPoints: 0,
                springMembershipPoints: 0,
                membershipPoints: 0
            };
            members[utEid] = attendee;
        }

        // Update the attendee's membership info IF they haven't already been updated for this event
        // Prevents counting duplicate sign ins to events
        if(attendee.eventsAttended[attendee.eventsAttended.length - 1] != eventId) {
            attendee.eventsAttended.push(eventId);
            attendee.membershipPoints += eventTypesToCost[event.eventType];
            if(fallSemester) {
                attendee.fallMembershipPoints += eventTypesToCost[event.eventType];
            } else {
                attendee.springMembershipPoints += eventTypesToCost[event.eventType];
            }
        }
    }
}

// Update membership log based on the info currently retrieved
// Currently not using batchUpdate to avoid a 411 error (for some reason x_x)
async function postLogInfo(sheets) {
    // Get the event IDs in a format that can be posted to the spreadsheet
    let eventIds = [];
    for(let i = 0; i < events.length; i++) {
        eventIds.push(i);
    }
    
    // Update the Event Log
    await sheets.spreadsheets.values.update(
        {
          spreadsheetId: membershipLogSheetId,
          range: settings.ranges.EVENT_LOG,
          valueInputOption: "RAW",
          resource: {
            range: settings.ranges.EVENT_LOG,
            values: getEventLogValues()
          }
        }
    );
    
    // Update the membership log for each member
    await sheets.spreadsheets.values.update(
        {
          spreadsheetId: membershipLogSheetId,
          range: settings.ranges.MEMBERSHIP_LOG,
          valueInputOption: "RAW",
          resource: {
            range: settings.ranges.MEMBERSHIP_LOG,
            values: getMembershipLogValues()
          }
        }
    );
    
    // Update the membership log with the event IDs
    await sheets.spreadsheets.values.update(
        {
          spreadsheetId: membershipLogSheetId,
          range: settings.ranges.EVENT_IDS,
          valueInputOption: "RAW",
          resource: {
            range: settings.ranges.EVENT_IDS,
            values: [ eventIds ]
          }
        }
    );

    // Finally, apply formatting to the sheet
    await applyFormatting(sheets);
}

// Converts the current event information from the event list to values that
// can be posted to a spreadsheet
function getEventLogValues() {
    let values = [];
    for(let i = 0; i < events.length; i++) {
        let currentEvent = events[i];

        // Add the current event to values
        let currentEventValue = [
            i, // Event ID
            currentEvent.eventName, // Event Name
            currentEvent.eventType, // Event Type
            currentEvent.eventDate, // Event Date
            currentEvent.spreadsheetId // Spreadsheet ID
        ];
        values.push(currentEventValue);
    }

    return values;
}

// Converts the current member information from the member dictionary to values
// that can be posted to a spreadsheet
function getMembershipLogValues() {
    let values = [];
    for(let eid in members) {
        let currentMember = members[eid];

        // Add the current member information to values
        let currentMemberValue = [
            currentMember.firstName, // First Name
            currentMember.lastName, // Last Name
            eid, // UT EID
            currentMember.email, // Email
            currentMember.phone, // Phone
            membershipRoles[currentMember.role], // Membership Status
            currentMember.fallMembershipPoints,
            currentMember.springMembershipPoints,
            currentMember.membershipPoints
        ];

        // Add current member attendance information to values
        let currentIndex = 0;
        let eventsAttended = currentMember.eventsAttended;
        for(let i = 0; i < events.length; i++) {
            if(currentIndex < eventsAttended.length && eventsAttended[currentIndex] == i) {
                currentMemberValue.push("X");
                currentIndex++;
            } else {
                currentMemberValue.push("");
            }
        }

        // console.log([eventsAttended, currentMemberValue]);
        values.push(currentMemberValue);
    }

    return values;
}

// Apply formatting to the membership log
// Reference: https://stackoverflow.com/questions/49970988/how-to-autofit-column-width-with-google-sheets-api
async function applyFormatting(sheets) {
    await sheets.spreadsheets.batchUpdate(
        {
            "spreadsheetId": membershipLogSheetId,
            "resource": {
                "requests": [
                    {
                        "autoResizeDimensions": {
                            "dimensions": {
                                "dimension": "COLUMNS",
                                "sheetId": logSheetGid,
                                "startIndex": 9
                            }
                        }
                    }
                ]
            }
        }
    );
}