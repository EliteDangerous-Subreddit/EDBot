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
    return axios.get("https://www.frontierstore.net/").then(() => retry = 0).catch(() => retry++).then(() => {
        let htmlResponse;
        if (retry >= 5)
            htmlResponse = "[Store: Offline](#status_red_store 'Store - Offline')";
        else if (retry > 0)
            htmlResponse = "[Store: Issues Detected](#status_yellow_store 'Store - Issues Detected')";
        else
            htmlResponse = "[Store: Online](#status_green_store 'Store - Online')";
        return htmlResponse
    });
}

export async function updateServiceStatus(sidebar: String) {
    let serverStatus = await getServerStatus();
    let storeStatus = await getStoreStatus();
    let status = `${serverStatus}\n${storeStatus}`;
    return sidebar.replaceSidebarSection("status", status)
}
