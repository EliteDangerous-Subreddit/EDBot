let axios = require("axios");

const StatusCode = {
    OK: 2,
    Issues_Detected: 1,
    Offline: 0
};

let retry = 0;

async function getServerStatus() {
    let request = await axios.get("http://hosting.zaonce.net/launcher-status/status.json");
    request = request.data;
    let htmlResponse = "";
    switch (request.status) {
        case StatusCode.OK:
            htmlResponse = `[Servers: Online](#status_green_servers 'Servers - Online')`;
            break;
        case StatusCode.Issues_Detected:
            htmlResponse = `[Servers: ${request.text}](#status_yellow_servers 'Servers -  ${request.text}')`;
            break;
        case StatusCode.Offline:
            htmlResponse = `[Servers: ${request.text}](#status_red_servers 'Servers -  ${request.text}')`;
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

async function updateServiceStatus(sidebar: String) {
    let serverStatus = await getServerStatus();
    let storeStatus = await getStoreStatus();
    let status = `${serverStatus}\n${storeStatus}`;
    return sidebar.replaceSidebarSection("status", status)
}

module.exports.updateServiceStatus = updateServiceStatus;
