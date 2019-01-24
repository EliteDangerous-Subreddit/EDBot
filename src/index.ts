'use strict';
// Add SnooStorm for comment and submission streams

import moment = require("moment");
import EventEmitter from "events"

let SnooStorm = require("snoostorm");

import Snoowrap from "snoowrap";
import * as config from "./config.json";
import axios from "axios";
import credentials from "./credentials.json";
import frontier from "./frontier.json";
import {updateServiceStatus} from "./sidebar/serviceStatus";
import {updateCalendar} from "./sidebar/calendar";
import ForumThread from "./objects/ForumThread";
import {DOMWindow, JSDOM} from "jsdom"

// @ts-ignore
import Parser from "rss-parser";

export let parser = new Parser();


// noinspection MagicNumberJS
const timeToUpdateSidebar = 1000 * 60 * 10; // every 10 minutes - milliseconds * seconds * minutes
// noinspection MagicNumberJS
const timeToCheckForums = 1000 * 60 * 5; // every 5 minutes - milliseconds * seconds * minutes
const MAX_COMMENT_LENGTH = 10_000;
const FRONTIER_URL = "https://forums.frontier.co.uk/";

class MainEmitter extends EventEmitter {
}

export const mainEmitter = new MainEmitter;
let currDate = new Date();

const forum_original_thread_match = /^https:\/\/forums.frontier.co.uk\/showthread.php\/\d*(-[A-Za-z0-9]*)*[^?]$/;
const forum_thread_match = /^https:\/\/forums.frontier.co.uk\/showthread.php\/\d*(-[A-Za-z0-9()]*)*(\?.*?post([0-9]*))?/;
const footer = "This copy-paste was done by a bot, report this comment and downvote if something seems broken.";
let lastHandledPosts: string[] = [];

// noinspection JSIgnoredPromiseFromCall
main();

async function main() {
    console.log("Starting");
    const r = new Snoowrap(credentials);
    const snooStorm: any = new SnooStorm(r);

    updateSidebar(r);
    monitorSubmissions(snooStorm);
    let ignored = monitorForums();

    mainEmitter.on("submission", notifyDiscordSubmission);
    mainEmitter.on("submission", checkIfForumThread);

    mainEmitter.on("forum_thread", notifyDiscordForumThread)
}

function submissionHasBeenProcessed(submission: Snoowrap.Submission): boolean {
    return lastHandledPosts.indexOf(submission.id) !== -1;
}

function submissionProcessed(submission: Snoowrap.Submission): void {
    if (lastHandledPosts.length >= 20){
        lastHandledPosts.shift();
    }
    lastHandledPosts.push(submission.id);
}

/**
 * Updates sidebar with new information
 * @param {Snoowrap} r
 */
function updateSidebar(r: Snoowrap) {
    console.log(`Checking if sidebar needs to be updated`);
    setTimeout(updateSidebar, timeToUpdateSidebar, r);
    r.getSubreddit('EliteDangerous')
        .getWikiPage("config/sidebar")
        .fetch()
        .then(async (sidebar: Snoowrap.WikiPage) => {
            let sidebar_text: string | Error = sidebar.content_md;

            sidebar_text = await updateServiceStatus(sidebar_text).catch((err: Error) => err);
            if (sidebar_text instanceof Error) {
                console.log(sidebar_text);
                return;
            }

            sidebar_text = await updateCalendar(sidebar_text).catch((err: Error) => err);
            if (sidebar_text instanceof Error) {
                console.log(sidebar_text);
                return;
            }

            if (sidebar_text && sidebar_text !== sidebar.content_md) {
                let ignored = r.getSubreddit('EliteDangerous').getWikiPage("config/sidebar").edit({
                    text: sidebar_text,
                    reason: 'Automated Edit - ' + moment().utc().format("DD MMM YYYY HH:mm.SSS UTC")
                });
            }
        });
}

async function monitorForums() {
    setTimeout(monitorForums, timeToCheckForums);
    console.log(`Checking new forum posts`);
    let feed = await parser.parseURL('https://ed.miggy.org/devtracker/ed-dev-posts.rss');

    feed.items.forEach(item => {
        // Is it a new thread?
        if (item.link.match(forum_original_thread_match)) {
            let thread = new ForumThread;
            let titleMatch: RegExpMatchArray | null = item.title.match(/^(.*?) - (.*)\((.*)\)$/);
            if (titleMatch !== null) {
                thread.title = titleMatch[2];
                thread.from = titleMatch[1];
                thread.permalink = item.link;
                thread.created_at = new Date(item.pubDate);
            }
            if (thread.created_at > currDate) {
                mainEmitter.emit("forum_thread", thread);
            }
        }
    });
    currDate = new Date();
}

function monitorSubmissions(SnooStorm: any) {
    let submissionStream = SnooStorm.SubmissionStream({
        "subreddit": "EliteDangerous", // TODO: Change to env file and listen to Elite subreddits
        "results": 5,
        "pollTime": 2000
    });
    console.log("Listening to submissions");
    submissionStream.on("submission", function (submission: Snoowrap.Submission) {
        mainEmitter.emit("submission", submission);
    });
}

function notifyDiscordForumThread(thread: ForumThread) {
    const embed: any = {
        "content": "New Frontier Thread on forums",
        "embeds": [{
            "title": thread.title,
            "url": thread.permalink,
            "color": 16740608,
            "timestamp": thread.created_at.toISOString(),
            "footer": {
                "text": "u/EliteDangerousBot"
            },
            "author": {
                "name": thread.from
            }
        }]
    };
    axios.post(config.webhook, embed).catch(console.log)
}

async function checkIfForumThread(submission: Snoowrap.Submission) {
    let regex = RegExp(forum_thread_match, 'gi');
    let match = regex.exec(submission.url);
    if (match) {
        if (submissionHasBeenProcessed(submission)) {
            return;
        }
        console.log(`Linked forum thread detected, posting copy-paste for '${submission.title}'`);
        await migrateForumThreadToSubmission(submission, match[3]);
        submissionProcessed(submission);
    }
}

async function migrateForumThreadToSubmission(submission: Snoowrap.Submission, linked_comment: string = "") {
    let body: string | Error = await getLinkedThreadCommentBody(submission.url, linked_comment);

    if (body instanceof Error) {
        console.log("Could not get forum thread for copy-paste: ", body);
        return;
    }
    body = ">" + body.replace(/\n/g, "\n>");

    let template_length = `Copy-paste: comment 10/10\n\n\n\n---\n^(_${footer}_)`.length;
    if (body.length + template_length > MAX_COMMENT_LENGTH) {
        let split_body: Array<string> = splitIntoSegments(body, MAX_COMMENT_LENGTH - template_length);
        let last_reply: Snoowrap.Comment|Error|null = null;
        for (let i = 0; i < split_body.length; i++) {
            if (i === 0) {
                body = `Copy-paste: comment ${i}/${split_body.length}\n\n${split_body[i]}\n\n---\n^(_${footer}_)`;
            }
            else {
                body = `Copy-paste: comment ${i}/${split_body.length}\n\n${split_body[i]}\n\n---\n^(_${footer}_)`;
            }
            if (last_reply) {
                // @ts-ignore
                last_reply = await last_reply.reply(body).then(reply => reply);
            }
            else {
                // @ts-ignore
                last_reply = await submission.reply(body).then(reply => reply);
                if (last_reply instanceof Error) {
                    throw last_reply;
                }
            }
        }
    }
    else {
        body = `Copy-paste\n\n${body}\n\n---\n^(_${footer}_)`;
        if (body.length < MAX_COMMENT_LENGTH) {
            submission.reply(body);
        } else {
            console.log(`Could not post forum thread copy-paste, length ${body.length}/${MAX_COMMENT_LENGTH}`);
        }
    }
}

function splitIntoSegments(body: string, max_length: number): Array<string> {
    let segments: Array<string> = [];
    let newline_pos: number = -1;
    let first_new_line: number = -1;
    for (let i = max_length; i >= 0; i--) {
        if (body.length <= max_length) {
            segments.push(body);
            break;
        }
        else if (body[i] === "\n") {
            if (newline_pos === -1) {
                first_new_line = i;
            }
            newline_pos = i;
        }
        else if (newline_pos !== -1) {
            segments.push(body.substring(0, newline_pos));
            break;
        }
    }
    if (body.length > max_length && first_new_line !== -1) {
        let results = splitIntoSegments(body.substring(first_new_line, body.length), max_length);
        segments = segments.concat(results);
    }
    return segments;
}

function formatHtmlToMarkdown(dom: DOMWindow, htmlElements: Element) {
    let body: string = "";
    htmlElements.childNodes.forEach((node: Node) => {
        if (!(node instanceof dom.Element)) {
            body += node.textContent ? node.textContent.replace(/\u0009+/g,'') : node.textContent;
            return;
        }
        switch (node.constructor) {
            case dom.HTMLDivElement:
                // if it is a container, most likely a vBulletin quote
                if (node.classList.contains("bbcode_container")) {
                    let quote = node.querySelector(".quote_container");
                    if (quote === null) {
                        break
                    }
                    body += ">" + formatHtmlToMarkdown(dom, quote).replace(/\n/g, "\n>");
                    body += "\n\n";
                }
                else {
                    body += formatHtmlToMarkdown(dom, node);
                }
                break;
            case dom.HTMLAnchorElement:
                let url = node.getAttribute("href");
                if (url === null) {
                    break
                }
                url = url.match(/^http/) ? url : FRONTIER_URL + url;

                body += `[${formatHtmlToMarkdown(dom, node)}](${url})`;
                break;
            case dom.HTMLBRElement:
                body += "\n";
                break;
            case dom.HTMLUListElement:
                body += formatHtmlToMarkdown(dom, node);
                break;
            case dom.HTMLLIElement:
                body += `* ${formatHtmlToMarkdown(dom, node)}`;
                body += "\n";
                break;
            case dom.HTMLElement:
                if (node.getAttribute("aria-hidden") === "true") {
                    body += node.textContent;
                } else {
                    if (node.tagName === "B" || node.tagName === "STRONG") {
                        body += ` **${formatHtmlToMarkdown(dom, node).trim()}** `;
                    } else if (node.tagName === "I") {
                        body += ` _${formatHtmlToMarkdown(dom, node).trim()}_ `;
                    }
                }
                break;
            case dom.HTMLImageElement:
                break;
            default:
                body += node.textContent;
                break;
        }

    });
    return body;
}

async function getLinkedThreadCommentBody(url: string, linked_comment_id: string = "") {
    let response: string | Error = await axios.get(url).then(response => response.data).catch((err: Error) => err);

    if (response instanceof Error) {
        return response;
    }
    let dom = new JSDOM(response);
    let comment: HTMLElement | null;

    let linked_comment = `post_message_${linked_comment_id}`;
    if (linked_comment_id.length > 0) {
        comment = dom.window.document.getElementById(linked_comment);
        if (comment !== null) {
            comment = comment.querySelector(".postcontent");
        }
    } else {
        comment = dom.window.document.querySelector(".postbody .content .postcontent")
    }

    if (comment === null || comment.textContent === null) {
        return new Error("could not get comment body");
    }

    let body: string = formatHtmlToMarkdown(dom.window, comment);

    return body.replace(/\u0020{2,}/g, " ").trim();
}

function notifyDiscordSubmission(submission: Snoowrap.Submission) {
    if (isFromFrontier(submission.author.name) && submission.subreddit.display_name === "EliteDangerous") {
        const embed: any = {
            "content": "New Frontier Post on Reddit",
            "embeds": [{
                "title": submission.title,
                "url": `https://www.reddit.com${submission.permalink}`,
                "color": 16740608,
                "timestamp": new Date().toISOString(),
                "footer": {
                    "text": "u/EliteDangerousBot"
                },
                "author": {
                    "name": `/u/${submission.author.name}`,
                    "url": `https://www.reddit.com/user/${submission.author.name}`
                }
            }]
        };
        if (!submission.is_self) {
            if (submission.thumbnail !== "default" && submission.thumbnail !== "") {
                embed.embeds[0]['thumbnail'] = {
                    "url": submission.thumbnail
                };
            }
            embed.embeds[0]['fields'] = [{
                "name": "Linked URL",
                "value": `[${submission.domain}](${submission.url})`,
                "inline": true
            }]
        }
        console.log(JSON.stringify(embed));
        axios.post(config.webhook, embed).catch(console.log)
    }
}

function isFromFrontier(author: string): boolean {
    return frontier.employees.indexOf(author) >= 0
}
