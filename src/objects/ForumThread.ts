
export default class ForumThread {
    private _title: string = "";
    private _from: string = "";
    private _permalink: string = "";
    private _created_at: Date = new Date(0);

    get title() {
        return this._title;
    }

    set title(value) {
        this._title = value;
    }

    get from(): string {
        return this._from;
    }

    set from(value: string) {
        this._from = value;
    }

    get permalink(): string {
        return this._permalink;
    }

    set permalink(value: string) {
        this._permalink = value;
    }

    get created_at(): Date {
        return this._created_at;
    }

    set created_at(value: Date) {
        this._created_at = value;
    }
}
