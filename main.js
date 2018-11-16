'use strict';
// Add SnooStorm for comment and submission streams
const snoowrap = require('snoowrap');
const credentials = require('./credentials');
const {updateServiceStatus} = require('./sidebar/serviceStatus');
const {updateCalendar} = require("./sidebar/calendar");
const r = new snoowrap(credentials);
require('./helpers');

const timeToUpdateSidebar = 1000*60*15;
updateSidebar(r);

/**
 *
 * @param {snoowrap} r
 */
function updateSidebar(r) {
    r.getSubreddit('EliteDangerous').getWikiPage("config/sidebar").fetch().then(async sidebar => {
        sidebar = sidebar.content_md;
        sidebar = await updateServiceStatus(sidebar);
        sidebar = await updateCalendar(sidebar);
        console.log(sidebar);
        r.getSubreddit('EliteDangerous').getWikiPage("config/sidebar").edit({text: sidebar, reason: 'Automated Edit - testing'})
    });
    //setTimeout(updateSidebar, timeToUpdateSidebar, r);
}

