'use strict';
// Add SnooStorm for comment and submission streams

let SnooStorm = require("snoostorm");

import Snoowrap from "snoowrap";
import "./helpers";
import credentials from "./credentials.json";
import frontier from "./frontier.json";
import {updateServiceStatus} from "./sidebar/serviceStatus";
import {updateCalendar} from "./sidebar/calendar";


const timeToUpdateSidebar = 1000 * 60 * 15; // every 15 minutes - milliseconds * seconds * minutes

main();

function main() {
    const r = new Snoowrap(credentials);
    const snoostorm: any = new SnooStorm(r);
    //updateSidebar(r);
    monitorSubmissions(snoostorm);
}

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

function monitorSubmissions(SnooStorm: any) {
    let submissionStream = SnooStorm.SubmissionStream({
        "subreddit": "EliteDangerous", // TODO: Change to env file and listen to Elite subreddits
        "results": 5,
        "pollTime": 2000
    });
    console.log("Listening to submissions");
    submissionStream.on("submission", function(submission: Snoowrap.Submission) {
        notifyDiscord(submission)
    });
}

function notifyDiscord(submission: Snoowrap.Submission) {
    if (isFromFrontier(submission.author.name) && submission.subreddit.display_name === "EliteDangerous") {
        // TODO: Send webhook to Discord (hide webhook URL in env file)
    }
}

function isFromFrontier(author: string): boolean {
    return frontier.employees.indexOf(author) >= 0
}
