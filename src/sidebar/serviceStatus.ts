"use strict";
import "../helpers";
import axios from "axios";
import {FDEVStatus, StatusCode} from "./FDEVStatus";
let retry = 0;

async function getServerStatus() {
    let request = await axios.get("http://hosting.zaonce.net/launcher-status/status.json");
    let data: FDEVStatus = request.data;
    let htmlResponse = "";
    switch (data.status) {
        case StatusCode.OK:
            htmlResponse = `[Servers: Online](#status_green_servers 'Servers - Online')`;
            break;
        default:
            console.log("Issues detected", data);
        case StatusCode.Issues_Detected:
            htmlResponse = `[Servers: ${data.text}](#status_yellow_servers 'Servers -  ${data.text}')`;
            break;
        case StatusCode.Offline:
            htmlResponse = `[Servers: ${data.text}](#status_red_servers 'Servers -  ${data.text}')`;
            break;
    }
    return htmlResponse;
}

async function getStoreStatus() {
    return await axios.get("https://www.frontierstore.net/").then(() => retry = 0).catch(() => retry++).then(() => {
        let htmlResponse;
        if (retry >= 3)
            htmlResponse = "[Store: Offline](#status_red_store 'Store - Offline')";
        else if (retry > 0)
            htmlResponse = "[Store: Issues Detected](#status_yellow_store 'Store - Issues Detected')";
        else
            htmlResponse = "[Store: Online](#status_green_store 'Store - Online')";
        return htmlResponse
    });
}

export async function updateServiceStatus(sidebar: string) {
    let serverStatus: string|Error = await getServerStatus().catch((err : any) => new Error(err));
    let storeStatus: string|Error = await getStoreStatus().catch((err : any) => new Error(err));
    if (serverStatus instanceof Error) {
        throw serverStatus
    }
    else if (storeStatus instanceof Error) {
        throw storeStatus
    }
    let status: string = `${serverStatus}\n${storeStatus}`;
    return sidebar.replaceSidebarSection("status", status)
}
