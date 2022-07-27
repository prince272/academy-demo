export function getErrorResult(context) {
    if (context?.response) {

        const response = context.response;
        let result = typeof (response.data) == 'object' && response.data != null ? response.data : {};

        if (!result.message) {
            result.message = response.status == 400 ? "Something went wrong, but don’t fret — let’s give it another shot." :
                response.status == 404 ? 'The resource was not found.' :
                    'Something went wrong.';
        }

        if (!result.errors) {
            result.errors = {};
        }

        return result;
    }
    else if (context?.request) {
        return {
            success: false, message: 'No Internet Access.', errors: {}, statusCode: 0
        };
    }
    else {
        return { success: false, message: 'Something went wrong.', errors: {} };
    }
}

export function resolveDndResult(position) {
    const extractValue = (id) => id.split('_')[2] || id;

    if (position?.draggableId)
        position.draggableId = extractValue(position.draggableId);

    if (position?.source?.droppableId)
        position.source.droppableId = extractValue(position.source.droppableId);

    if (position?.destination?.droppableId)
        position.destination.droppableId = extractValue(position.destination.droppableId);

    return { ...position };
}

export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// How do I remove all null and empty string values from a json object?
// source: https://stackoverflow.com/questions/286141/remove-blank-attributes-from-an-object-in-javascript#answer-38340730
export function cleanObject(obj) {
    var newObj = {};

    Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === "object") {
            newObj[key] = cleanObject(obj[key]); // recurse
        } else if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
            newObj[key] = obj[key]; // copy value
        }
    });

    return newObj;
}

// Fastest way to flatten / un-flatten nested JSON objects
// source: https://stackoverflow.com/questions/19098797/fastest-way-to-flatten-un-flatten-nested-json-objects/19101235#19101235
export function flattenObject(data) {
    var result = {};
    function recurse(cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
            for (var i = 0, l = cur.length; i < l; i++)
                recurse(cur[i], prop + "[" + i + "]");
            if (l == 0)
                result[prop] = [];
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop + "." + p : p);
            }
            if (isEmpty && prop)
                result[prop] = {};
        }
    }
    recurse(data, "");
    return result;
}

export function unflattenObject(data) {
    "use strict";
    if (Object(data) !== data || Array.isArray(data))
        return data;
    var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
        resultholder = {};
    for (var p in data) {
        var cur = resultholder,
            prop = "",
            m;
        while (m = regex.exec(p)) {
            cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
            prop = m[2] || m[1];
        }
        cur[prop] = data[p];
    }
    return resultholder[""] || resultholder;
};

// Convert camel case to human readable string?
// source: https://stackoverflow.com/questions/21147832/convert-camel-case-to-human-readable-string
/**
 * Changes camel case to a human readable format. So helloWorld, hello-world and hello_world becomes "Hello World". 
 * */
export function prettifyString(str) {
    var output = "";
    var len = str.length;
    var char;

    for (var i = 0; i < len; i++) {
        char = str.charAt(i);

        if (i == 0) {
            output += char.toUpperCase();
        }
        else if (char !== char.toLowerCase() && char === char.toUpperCase()) {
            output += " " + char;
        }
        else if (char == "-" || char == "_") {
            output += " ";
        }
        else {
            output += char;
        }
    }

    return output;
}

// Format a number as 2.5K if a thousand or more, otherwise 900
// source: https://stackoverflow.com/questions/9461621/format-a-number-as-2-5k-if-a-thousand-or-more-otherwise-900
export function prettifyNumber(number) {
    var SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];

    // what tier? (determines SI symbol)
    var tier = Math.log10(Math.abs(number)) / 3 | 0;

    // if zero, we don't need a suffix
    if (tier == 0) return number;

    // get suffix and determine scale
    var suffix = SI_SYMBOL[tier];
    var scale = Math.pow(10, tier * 3);

    // scale the number
    var scaled = number / scale;

    // format number and add suffix
    return scaled.toFixed(1) + suffix;
}

export function downloadFromUrl(url, name) {
    const a = document.createElement('a');
    a.href = url;
    a.download = name || url.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function printFromUrl(url) {
    var iframe = this._printIframe;
    if (!this._printIframe) {
        iframe = this._printIframe = document.createElement('iframe');
        document.body.appendChild(iframe);

        iframe.style.display = 'none';
        iframe.onload = function () {
            setTimeout(function () {
                iframe.focus();
                iframe.contentWindow.print();
            }, 1);
        };
    }

    iframe.src = url;
}

// 3 ways to convert HTML text to plain text
// source: https://dev.to/sanchithasr/3-ways-to-convert-html-text-to-plain-text-52l8

// 'IsNullOrWhitespace' in JavaScript?
// source: https://stackoverflow.com/questions/5559425/isnullorwhitespace-in-javascript

export function isBlankHtml(html) {

    // Create a new div element
    const tempDivElement = document.createElement("div");

    // Set the HTML content with the given value
    tempDivElement.innerHTML = html;

    // Retrieve the text property of the element 
    const plainText = tempDivElement.textContent || tempDivElement.innerText || "";

    if (typeof plainText === 'undefined' || plainText == null) return true;

    return plainText.replace(/\s/g, '').length < 1;
}