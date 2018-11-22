"use strict";
import "../helpers";
import * as Config from "./calendar-settings";
const CalendarAPI = require('node-google-calendar');

let cal = new CalendarAPI(Config);

let dateStart = new Date();
dateStart.setHours(0, 0, 0, 0);

// how many days ahead to list events for
const DAY_RANGE = 7;

// the maximum sidebar length, set by Reddit
const LENGTH_LIMIT = 10240;

let dateEnd = new Date(dateStart.getTime() + (DAY_RANGE * 24 * 60 * 60 * 1000));

let params = {
    timeMin: dateStart.toISOString(),
    timeMax: dateEnd.toISOString(),
    singleEvents: true,
    orderBy: 'startTime'
}; 	//Optional query parameters referencing google APIs

export function updateCalendar(sidebar: string) {
    return cal.Events.list(Config.CALENDAR_ID.primary, params)
        .then((events: Array<any>) => {
            //Success
            let eventlessSidebarLength = sidebar.length - sidebar.sidebarSectionLength("calendar");
            let sidebarEvents = '\n\n' + [
                "Date",
                "Event",
                "Description"
            ].join('|') + '\n';
            sidebarEvents += ":-:|:-:|:-:\n";
            for (let i = 0; i < events.length; i++) {
                if (events[i].visibility === "private") {
                    continue;
                }
                let event = events[i];
                let eventDate;
                let isMultiDay = false;
                if (event.start.hasOwnProperty("dateTime")) {
                    eventDate = new Date(event.start.dateTime);
                }
                else {
                    isMultiDay = true;
                    eventDate = new Date(event.start.date)
                }
                let endDate = new Date(isMultiDay ? event.end.date : event.start.dateTime);

                let date;
                // If event lasts for longer than a day, display as from-to in sidebar
                if (isMultiDay) {
                    date = eventDate.toUTCShortFormat() + ' - ' + endDate.toUTCShortFormat();
                } else {
                    date = eventDate.toUTCShortFormat()
                }

                date += ` _${eventDate.toLocaleTimeString([], {timeZone: "UTC", hour: '2-digit', minute: '2-digit'})}_`;
                // these four fields form each table line
                let tableLine = [
                    date,
                    event.summary,
                    event.description.trim()
                ].join('|') + '\n';

                if (eventlessSidebarLength + tableLine.length > LENGTH_LIMIT) {
                    break
                } else {
                    sidebarEvents += tableLine;
                    eventlessSidebarLength += tableLine.length
                }
            }
            sidebarEvents += ">[See more](https://bit.ly/2vbO3f6)\n\n";
            return sidebar.replaceSidebarSection("calendar", sidebarEvents)
        });
}
