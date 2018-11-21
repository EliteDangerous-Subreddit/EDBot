'use strict';
// Add SnooStorm for comment and submission streams
import Snoowrap from "snoowrap";
import "./helpers";

const credentials = require('./credentials');

import {updateServiceStatus} from "./sidebar/serviceStatus";
import {updateCalendar} from "./sidebar/calendar";
const r = new Snoowrap(credentials);

const timeToUpdateSidebar = 1000 * 60 * 15; // every 15 minutes - milliseconds * seconds * minutes
updateSidebar(r);

/**
 * Updates sidebar with new information
 * @param {Snoowrap} r
 */
function updateSidebar(r: Snoowrap) {
    setTimeout(updateSidebar, timeToUpdateSidebar, r);
    r.getSubreddit('EliteDangerous')
        .getWikiPage("config/sidebar")
        .fetch()
        .then(async (sidebar: Snoowrap.WikiPage) => {
            let sidebar_text : string = sidebar.content_md;
            sidebar_text = await updateServiceStatus(sidebar_text);
            sidebar_text = await updateCalendar(sidebar_text);
            let ignored = r.getSubreddit('EliteDangerous').getWikiPage("config/sidebar").edit({
                text: sidebar_text,
                reason: 'Automated Edit - testing'
            }).then(console.log);
        });

}

