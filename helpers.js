if (!String.prototype.splice) {
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
    String.prototype.splice = function (start, delCount, newSubStr) {
        return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
    };
}

if (!String.prototype.replaceSidebarSection) {
    String.prototype.replaceSidebarSection = function (name, content) {
        let searchStart = `[](#sb-${name}-start)`;
        const start = this.indexOf(searchStart) + searchStart.length;
        let searchEnd = `[](#sb-${name}-end)`;
        const end = this.indexOf(searchEnd) - start;

        if (this.indexOf(searchStart) < 0 || this.indexOf(searchEnd) < 0) return this;
        return this.splice(start, end, content);
    };
}

if (!String.prototype.sidebarSectionLength) {
    String.prototype.sidebarSectionLength = function (name) {
        let searchStart = `[](#sb-${name}-start)`;
        const start = this.indexOf(searchStart) + searchStart.length;
        let searchEnd = `[](#sb-${name}-end)`;
        const end = this.indexOf(searchEnd) - start;
        if (this.indexOf(searchStart) < 0 || this.indexOf(searchEnd) < 0) return -1;
        return end - start;
    };
}

if (!Date.prototype.toUTCShortFormat) {
    Date.prototype.toUTCShortFormat = function () {
        const month_names = ["Jan", "Feb", "Mar",
            "Apr", "May", "Jun",
            "Jul", "Aug", "Sep",
            "Oct", "Nov", "Dec"];

        let day = this.getUTCDate();
        let month_index = this.getUTCMonth();

        return day + " " + month_names[month_index];
    }
}
