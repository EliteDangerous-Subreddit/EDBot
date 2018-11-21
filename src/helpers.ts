export {};

declare global {
    interface String {
        splice(start: number, delCount: number, newSubStr: string): string;
        replaceSidebarSection(name: string, content: string): string;
        sidebarSectionLength(name: string): number;
    }
    interface Date {
        toUTCShortFormat(): string;
    }
}

/**
 * {JSDoc}
 *
 * The splice() method changes the content of a string by removing a range of
 * characters and/or adding new characters.
 *
 * @this {String}
 * @param {number} start Index at which to start changing the string.
 * @param {number} delCount An integer indicating the number of old chars to remove.
 * @param {string} newSubStr The String that is spliced in.
 * @return {string} A new string with the spliced substring.
 */
String.prototype.splice = function (start: number, delCount: number, newSubStr: string): string {
    return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
};

String.prototype.replaceSidebarSection = function (name: string, content: string): string {
    let searchStart = `[](#sb-${name}-start)`;
    const start = this.indexOf(searchStart) + searchStart.length;
    let searchEnd = `[](#sb-${name}-end)`;
    const end = this.indexOf(searchEnd) - start;

    if (this.indexOf(searchStart) < 0 || this.indexOf(searchEnd) < 0) return this.toString();
    return this.splice(start, end, content);
};

String.prototype.sidebarSectionLength = function (name): number {
    let searchStart = `[](#sb-${name}-start)`;
    const start = this.indexOf(searchStart) + searchStart.length;
    let searchEnd = `[](#sb-${name}-end)`;
    const end = this.indexOf(searchEnd) - start;
    if (this.indexOf(searchStart) < 0 || this.indexOf(searchEnd) < 0) return -1;
    return end - start;
};

Date.prototype.toUTCShortFormat = function (): string {
    const month_names = ["Jan", "Feb", "Mar",
        "Apr", "May", "Jun",
        "Jul", "Aug", "Sep",
        "Oct", "Nov", "Dec"];

    let day = this.getUTCDate();
    let month_index = this.getUTCMonth();

    return day + " " + month_names[month_index];
};
