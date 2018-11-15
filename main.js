'use strict';
// Add SnooStorm for comment and submission streams
const snoowrap = require('snoowrap');
const credentials = require('./credentials');
const r = new snoowrap(credentials);
require('./polyfill');

//setTimeout(updateSidebar(r), 1000*60*15);

let test = "Lorem ipsum [](#sb-test-start) replace me [](#sb-test-end) text text";

console.log(test.replaceSidebarSection("test", "text"));

/**
 *
 * @param {snoowrap} r
 */
function updateSidebar(r) {
    r.getSubreddit('EliteDangerous').getWikiPage("config/sidebar").fetch().then(sidebar => {

    });
}

