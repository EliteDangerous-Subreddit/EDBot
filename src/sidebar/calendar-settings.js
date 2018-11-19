const KEY = require('./googleapi-key.json').private_key; // Taken from Google Console Service account
const SERVICE_ACCT_ID = 'sidebar-bot@project-id-0210100794282261994.iam.gserviceaccount.com';
const CALENDAR_ID = {
    'primary': 'ed.sidebar@gmail.com',
};
const TIMEZONE = 'UTC';

module.exports.key = KEY;
module.exports.serviceAcctId = SERVICE_ACCT_ID;
module.exports.calendarId = CALENDAR_ID;
module.exports.timezone = TIMEZONE;
