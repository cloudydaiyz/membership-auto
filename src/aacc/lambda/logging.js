/*

membership_roles: ["Member", "Ambassador", "Event Planning Committee", "Officer"]
events: [Event, Event, ...]

AACC Member Object:
{
    first_name: string,
    last_name: string,
    email: string,
    role: integer, // index in the membership_roles array
    events: array,
    log_row: array, // reference to the row the member is in for the 2d array
    membership_points: integer
}

AACC Event Object:
{
    event_name: string,
    event_type: integer,
    event_date: date,
    spreadsheet_id: string
}

AACC Event Type Dictionary:
{
    event_type: string = event_value: integer
}

AACC Member Dictionary:
{
    ut_eid: string = Member
    ...
}

1. Retrieve all existing membership data from spreadsheet (except for events and membership_points)
    1a.) Create Member object for each and add members to a dictionary that maps ut_eid to Member object
    1b.) Keep the 2d array given by Google Sheets API
2. Retreive the event information from Google Drive for each event
    2a.) Create Event objects for each and add events to a list
    2b.) Go to the corresponding event spreadsheet and update membership info
        2bi.) If the user already exists, update the membership points based on event type, and update the row in the 2d array
        2bii.) If the user doesn't already exist, create the user object, add row in the 2d array & do 2bi
3. Update the spreadsheet based on the additional information
    2a.) Create new 2D array with Event objects, update the Event Log and format appropriately
    2b.) Update the Membership Log with new members and format appropriately

For now, leave out the attendance check

*/

function updateMembershipLog() {
    
}