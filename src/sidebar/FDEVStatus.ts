
export enum StatusCode {
    OK = 2,
    Issues_Detected = 1,
    Offline = 0
}

export type FDEVStatus = {
    status: StatusCode;
    text: string;
};

