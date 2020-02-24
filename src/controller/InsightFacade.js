"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
const IInsightFacade_2 = require("./IInsightFacade");
const decimal_js_1 = require("decimal.js");
const util_1 = require("util");
class InsightFacade {
    constructor() {
        this.datasets = [];
        this.listOfId = [];
        this.loadedDataset = [];
    }
    searchElement(document, name, value) {
        let result;
        const childNodes = document["childNodes"];
        if (childNodes === undefined || childNodes === null) {
            return null;
        }
        for (let node of childNodes) {
            const attributes = node.attrs;
            if (attributes !== null && attributes !== undefined) {
                for (let a of attributes) {
                    if (a.name === name && a.value === value) {
                        return node;
                    }
                }
            }
            result = this.searchElement(node, name, value);
            if (result !== null && result !== undefined) {
                return result;
            }
        }
    }
    parseHTTP(url) {
        let self = this;
        const http = require("http");
        let response;
        return new Promise((resolve, reject) => {
            http.get(url, function successCallback(res) {
                let body = "";
                res.on("data", function (chunk) {
                    body += chunk;
                });
                res.on("end", function () {
                    response = JSON.parse(body);
                    resolve(response);
                });
            }).on("error", function (e) {
                reject(e);
            });
        });
    }
    addDataset(id, content, kind) {
        let self = this;
        const fs = require("fs");
        const JSZip = require("jszip");
        const parse5 = require("parse5");
        if (!fs.existsSync("./data")) {
            fs.mkdirSync("./data");
        }
        if (id === null || id === undefined || id === "") {
            return Promise.reject(new IInsightFacade_2.InsightError("error: invalid id"));
        }
        if (kind === null || kind === undefined) {
            return Promise.reject(new IInsightFacade_2.InsightError("error: InsightDatasetKind is invalid"));
        }
        if (fs.existsSync("./data/" + id)) {
            return Promise.reject(new IInsightFacade_2.InsightError("error: dataset already exists"));
        }
        return new Promise((resolve, reject) => {
            let courseList = [];
            let roomList = [];
            let fileNameList = [];
            JSZip.loadAsync(content, { base64: true }).then(function (myZip) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (kind === IInsightFacade_1.InsightDatasetKind.Courses) {
                        myZip.folder("courses").forEach(function (relativePath, file) {
                            const temp = file.async("string");
                            courseList.push(temp);
                        });
                        let nRows = 0;
                        let courseArr = [];
                        Promise.all(courseList).then(function (data) {
                            if (data.length === 0) {
                                reject(new IInsightFacade_2.InsightError("zip file is empty"));
                            }
                            let i;
                            for (i = 0; i < courseList.length; i++) {
                                try {
                                    const course = JSON.parse(data[i]);
                                    const resultArray = course["result"];
                                    const resultSize = resultArray.length;
                                    if (resultSize > 0) {
                                        const secArray = [];
                                        for (let j = 0; j < resultSize; j++) {
                                            const section = {};
                                            section[id + "_dept"] = resultArray[j]["Subject"];
                                            section[id + "_id"] = resultArray[j]["Course"];
                                            section[id + "_avg"] = resultArray[j]["Avg"];
                                            section[id + "_instructor"] = resultArray[j]["Professor"];
                                            section[id + "_title"] = resultArray[j]["Title"];
                                            section[id + "_pass"] = resultArray[j]["Pass"];
                                            section[id + "_fail"] = resultArray[j]["Fail"];
                                            section[id + "_audit"] = resultArray[j]["Audit"];
                                            section[id + "_uuid"] = resultArray[j]["id"].toString();
                                            const property = resultArray[j]["Section"];
                                            if (property === "overall") {
                                                section[id + "_year"] = 1900;
                                            }
                                            else {
                                                section[id + "_year"] = parseInt(resultArray[j]["Year"], 10);
                                            }
                                            secArray.push(section);
                                        }
                                        nRows = nRows + resultSize;
                                        courseArr.push(secArray);
                                    }
                                }
                                catch (e) {
                                    Util_1.default.trace(e);
                                }
                            }
                            if (nRows === 0) {
                                reject(new IInsightFacade_2.InsightError("no valid content"));
                            }
                            else {
                                self.datasets.push({ id, kind: IInsightFacade_1.InsightDatasetKind.Courses, numRows: nRows });
                                const cacheString = JSON.stringify(courseArr);
                                fs.writeFileSync("./data/" + id, cacheString, "utf8");
                                self.listOfId.push(id);
                                resolve(self.listOfId);
                            }
                        }).catch(function (e) {
                            reject(new IInsightFacade_2.InsightError("error"));
                        });
                    }
                    else if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
                        let hrefList = [];
                        const index = yield myZip.file("index.htm").async("string");
                        let obj = parse5.parse(index);
                        let buildings = self.searchElement(obj, "class", "views-table cols-5 table");
                        let body = buildings.childNodes[3];
                        for (let i = 1; i < body.childNodes.length; i += 2) {
                            let tr = body.childNodes[i];
                            let href = tr.childNodes[5].childNodes[1].attrs[0].value;
                            let res = href.substring(2);
                            hrefList.push(res);
                        }
                        myZip.forEach(function (relativePath, file) {
                            if (!file.dir && hrefList.includes(relativePath)) {
                                const temp1 = relativePath.split("/");
                                const fileName = temp1[temp1.length - 1];
                                if (fileName.indexOf(".") === -1 && fileName !== "MAUD") {
                                    fileNameList.push(fileName);
                                    const temp = file.async("string");
                                    roomList.push(temp);
                                }
                            }
                        });
                        let nRows = 0;
                        let buildArr = [];
                        Promise.all(roomList).then(function (data) {
                            return __awaiter(this, void 0, void 0, function* () {
                                if (data.length === 0) {
                                    reject(new IInsightFacade_2.InsightError("zip file is empty"));
                                }
                                let i;
                                for (i = 0; i < roomList.length; i++) {
                                    try {
                                        const building = parse5.parse(data[i]);
                                        const node1 = self.searchElement(building, "id", "building-info");
                                        const fullName = parse5.serialize(node1.childNodes[1].childNodes[0]).toString();
                                        const address = parse5.serialize(node1.childNodes[3].childNodes[0]).toString();
                                        const shortName = fileNameList[i];
                                        const geoLocation = "http://cs310.ugrad.cs.ubc.ca:11316/api/v1/project_q1l0b_z9f0b/"
                                            + encodeURI(address);
                                        const geoResponse = yield self.parseHTTP(geoLocation);
                                        const latitude = geoResponse["lat"];
                                        const longtitude = geoResponse["lon"];
                                        const node2 = self.searchElement(building, "class", "views-table cols-5 table");
                                        if (node2 !== undefined) {
                                            let roomArr = [];
                                            const roomArray = node2.childNodes[3].childNodes;
                                            const roomArraySize = roomArray.length;
                                            let countRoom = 0;
                                            for (let j = 1; j < roomArraySize; j += 2) {
                                                countRoom = countRoom + 1;
                                                const room = {};
                                                const roomNumber = parse5.serialize(roomArray[j].childNodes[1].childNodes[1])
                                                    .toString();
                                                const roomSeats = parseInt(parse5.serialize(roomArray[j].childNodes[3])
                                                    .trim(), 10);
                                                const roomType = parse5.serialize(roomArray[j].childNodes[7]).toString().trim();
                                                let roomFurniture = parse5.serialize(roomArray[j].childNodes[5])
                                                    .toString().trim();
                                                if (roomFurniture.indexOf("&amp;") !== -1) {
                                                    roomFurniture = roomFurniture.replace("&amp;", "&");
                                                }
                                                let roomhref;
                                                for (let a of roomArray[j].childNodes[9].childNodes[1].attrs) {
                                                    if (a.name === "href") {
                                                        roomhref = a.value;
                                                    }
                                                }
                                                room[id + "_fullname"] = fullName;
                                                room[id + "_shortname"] = shortName;
                                                room[id + "_number"] = roomNumber;
                                                room[id + "_name"] = shortName + "_" + roomNumber;
                                                room[id + "_address"] = address;
                                                room[id + "_lat"] = latitude;
                                                room[id + "_lon"] = longtitude;
                                                room[id + "_seats"] = roomSeats;
                                                room[id + "_type"] = roomType;
                                                room[id + "_furniture"] = roomFurniture;
                                                room[id + "_href"] = roomhref;
                                                roomArr.push(room);
                                            }
                                            nRows = nRows + countRoom;
                                            buildArr.push(roomArr);
                                        }
                                    }
                                    catch (e) {
                                        Util_1.default.trace(data);
                                    }
                                }
                                if (nRows === 0) {
                                    reject(new IInsightFacade_2.InsightError("no valid rooms"));
                                }
                                else {
                                    self.datasets.push({ id, kind: IInsightFacade_1.InsightDatasetKind.Rooms, numRows: nRows });
                                    const cacheString = JSON.stringify(buildArr);
                                    fs.writeFileSync("./data/" + id, cacheString, "utf8");
                                    self.listOfId.push(id);
                                    resolve(self.listOfId);
                                }
                            });
                        }).catch(function (e) {
                            reject(new IInsightFacade_2.InsightError("error"));
                        });
                    }
                });
            }).catch(function (err) {
                reject(new IInsightFacade_2.InsightError("content is not valid"));
            });
        });
    }
    removeDataset(id) {
        const fs = require("fs");
        const self = this;
        const path = "./data/" + id;
        const exist = fs.existsSync(path);
        return new Promise((resolve, reject) => {
            if (id === null || id === undefined || id === "") {
                reject(new IInsightFacade_2.InsightError("id is invalid"));
            }
            if (!exist) {
                reject(new IInsightFacade_2.NotFoundError("file does not exist"));
            }
            fs.access(path, fs.constants.F_OK || fs.constants.W_OK, function (err) {
                if (exist && !err) {
                    fs.unlink(path, (e) => {
                        if (e) {
                            reject(new IInsightFacade_2.NotFoundError("id does not exist"));
                        }
                        self.datasets = self.datasets.filter((item) => item.id !== id);
                        self.listOfId = self.listOfId.filter((item) => item !== id);
                        resolve(id);
                    });
                }
                else {
                    reject(new IInsightFacade_2.InsightError("format error"));
                }
            });
        });
    }
    applyHelper(newKey, content, arr) {
        let finalResults = [];
        const key = Object.keys(content)[0];
        const col = Object.values(content)[0];
        if (key === "SUM") {
            let total = 0.00;
            for (let a of arr) {
                if (typeof a[col] !== "number") {
                    return null;
                }
                total += a[col];
                total = Number(total.toFixed(2));
            }
            for (let a of arr) {
                a[newKey] = total;
                finalResults.push(a);
            }
        }
        if (key === "AVG") {
            let total = new decimal_js_1.Decimal(0);
            let res;
            for (let a of arr) {
                if (typeof a[col] !== "number") {
                    return null;
                }
                const value = new decimal_js_1.Decimal(a[col]);
                total = decimal_js_1.Decimal.add(total, value);
                const avg = total.toNumber() / arr.length;
                res = Number(avg.toFixed(2));
            }
            for (let a of arr) {
                a[newKey] = res;
                finalResults.push(a);
            }
        }
        if (key === "MIN") {
            let min = Infinity;
            for (let a of arr) {
                if (typeof a[col] !== "number") {
                    return null;
                }
                if (a[col] < min) {
                    min = a[col];
                }
            }
            for (let a of arr) {
                a[newKey] = min;
                finalResults.push(a);
            }
        }
        if (key === "MAX") {
            let max = -Infinity;
            for (let a of arr) {
                if (typeof a[col] !== "number") {
                    return null;
                }
                if (a[col] > max) {
                    max = a[col];
                }
            }
            for (let a of arr) {
                a[newKey] = max;
                finalResults.push(a);
            }
        }
        if (key === "COUNT") {
            let temp = [];
            temp.push(arr[0][col]);
            let count = 1;
            for (let a of arr) {
                if (!temp.includes(a[col])) {
                    temp.push(a[col]);
                    count = count + 1;
                }
            }
            for (let a of arr) {
                a[newKey] = count;
                finalResults.push(a);
            }
        }
        return finalResults;
    }
    isValid(where) {
        let self = this;
        const validKeys = [
            "AND",
            "OR",
            "NOT",
            "LT",
            "GT",
            "EQ",
            "IS",
        ];
        if (Object.keys(where).length === 0) {
            return true;
        }
        const key = Object.keys(where)[0];
        if (!validKeys.includes(key)) {
            return false;
        }
        if (key === "NOT") {
            const notContent = where["NOT"];
            if (validKeys.includes(Object.keys(notContent)[0])) {
                return this.isValid(notContent);
            }
        }
        if (key === "OR" || key === "AND") {
            const content = where[key];
            let ans = [];
            if (Object.keys(content).length === 0) {
                return false;
            }
            if (content !== null || content !== undefined) {
                for (let index of content) {
                    ans.push(this.isValid(index));
                }
                if (ans.includes(false) && key === "AND") {
                    return false;
                }
                else {
                    return true;
                }
            }
        }
        if (key === "LT" || key === "GT" || key === "EQ") {
            const content = where[key];
            const id = Object.keys(content)[0];
            const c = Object.values(content)[0];
            try {
                const datasetID = id.split("_")[0];
                if (self.listOfId.includes(datasetID) && typeof c === "number") {
                    const name = id.split("_")[1];
                    if (name === "avg" || name === "pass" ||
                        name === "fail" || name === "audit" ||
                        name === "year" || name === "lat" ||
                        name === "lon" || name === "seats") {
                        return true;
                    }
                }
            }
            catch (_a) {
                return false;
            }
        }
        if (key === "IS") {
            const content = where[key];
            const id = Object.keys(content)[0];
            const c = Object.values(content)[0];
            try {
                const datasetID = id.split("_")[0];
                if (self.listOfId.includes(datasetID) && typeof c === "string") {
                    const name = id.split("_")[1];
                    if (name === "dept" || name === "id" || name === "instructor" ||
                        name === "title" || name === "uuid" ||
                        name === "fullname" || name === "shortname" ||
                        name === "number" || name === "name" ||
                        name === "address" || name === "type" ||
                        name === "furniture" || name === "href") {
                        return true;
                    }
                }
            }
            catch (_b) {
                return false;
            }
        }
        return false;
    }
    isValid1(option, transformation) {
        let self = this;
        const validKeys0 = [
            "dept", "id", "instructor",
            "title", "uuid", "fullname",
            "shortname", "number", "name",
            "address", "type", "furniture",
            "href", "avg", "pass",
            "fail", "audit",
            "year", "lat",
            "lon", "seats",
        ];
        const validKeys = [
            "SUM",
            "COUNT",
            "MIN",
            "MAX",
            "AVG",
        ];
        let columns;
        let order = null;
        let transKey = [];
        if (Object.keys(option).length === 1 && Object.keys(option)[0] === "COLUMNS") {
            columns = option["COLUMNS"];
        }
        else if (Object.keys(option).length === 2) {
            columns = option["COLUMNS"];
            order = option["ORDER"];
        }
        else {
            return false;
        }
        if (columns === null || columns.length === 0 || columns === undefined) {
            return false;
        }
        try {
            if (transformation === undefined) {
                let id1 = columns[0].split("_")[0];
                if (self.listOfId.includes(id1)) {
                    for (let col of columns) {
                        const newID1 = col.split("_")[0];
                        if (newID1 !== id1) {
                            return false;
                        }
                    }
                }
            }
            else if (Object.keys(transformation).length !== 2) {
                return false;
            }
            else {
                const group = transformation["GROUP"];
                const apply = transformation["APPLY"];
                if (group.length === 0 || group === undefined) {
                    return false;
                }
                if (apply === undefined) {
                    return false;
                }
                for (let o of apply) {
                    const newApplyKey = Object.keys(o)[0];
                    const content = Object.values(o)[0];
                    if (transKey.includes(newApplyKey)) {
                        return false;
                    }
                    else {
                        transKey.push(newApplyKey);
                    }
                    let keyFull = Object.values(content)[0];
                    let keyName = keyFull.split("_")[1];
                    if (!validKeys.includes(Object.keys(content)[0]) || !validKeys0.includes(keyName)) {
                        return false;
                    }
                }
                for (let element of group) {
                    let groupKey = element.split("_")[1];
                    if (!validKeys0.includes(groupKey)) {
                        return false;
                    }
                    transKey.push(element);
                }
                let id = null;
                for (let i of transKey) {
                    if (i.indexOf("_") !== -1) {
                        const newId = i.split("_")[0];
                        if (!self.listOfId.includes(newId)) {
                            return false;
                        }
                        else if (id === null) {
                            id = newId;
                        }
                        else if (newId !== id) {
                            return false;
                        }
                    }
                }
                for (let col of columns) {
                    if (!transKey.includes(col)) {
                        return false;
                    }
                }
            }
            if (order === null || order === "") {
                return true;
            }
            else if (order === undefined) {
                return false;
            }
            if (typeof order === "string") {
                if (order.indexOf("_") === -1) {
                    return columns.includes(order);
                }
                else {
                    const orderCol = order.split("_")[0];
                    return self.listOfId.includes(orderCol) && columns.includes(order);
                }
            }
            else {
                const dir = order["dir"];
                const keys = order["keys"];
                let listDir = ["UP", "DOWN"];
                if (!listDir.includes(dir) || !util_1.isArray(keys) || keys.length === 0) {
                    return false;
                }
                for (let k of keys) {
                    if (!columns.includes(k)) {
                        return false;
                    }
                }
                return true;
            }
        }
        catch (e) {
            return false;
        }
    }
    performWhere(filter, id, sections) {
        const validKeys = [
            "AND",
            "OR",
            "NOT",
            "LT",
            "GT",
            "EQ",
            "IS",
        ];
        if (Object.keys(filter).length === 0) {
            return sections;
        }
        const key = Object.keys(filter)[0];
        let ans = [];
        if (key === "NOT") {
            const notContent = filter["NOT"];
            if (validKeys.includes(Object.keys(notContent)[0])) {
                const results = this.performWhere(notContent, id, sections);
                if (results === null) {
                    return null;
                }
                for (let sec of sections) {
                    if (!results.includes(sec)) {
                        ans.push(sec);
                    }
                }
                return ans;
            }
        }
        if (key === "OR") {
            const array = filter[key];
            let nullNumber = 0;
            if (array !== null || array !== undefined) {
                for (let index of array) {
                    let ans1 = [];
                    ans1 = this.performWhere(index, id, sections);
                    if (ans1 === null) {
                        nullNumber = nullNumber + 1;
                    }
                    else {
                        for (let a of ans1) {
                            if (!ans.includes(a)) {
                                ans.push(a);
                            }
                        }
                    }
                }
            }
            if (nullNumber === array.length) {
                return null;
            }
            return ans;
        }
        if (key === "AND") {
            const array = filter[key];
            if (array !== null || array !== undefined) {
                for (let index = 0; index < array.length; index++) {
                    let ans1 = [];
                    ans1 = this.performWhere(array[index], id, sections);
                    if (ans1 === null) {
                        return null;
                    }
                    else if (ans1.length === 0) {
                        return [];
                    }
                    else if (ans.length === 0 && ans1.length !== 0 && index === 0) {
                        ans = ans1;
                    }
                    else {
                        const temp = ans;
                        ans = [];
                        for (let a of ans1) {
                            if (temp.includes(a)) {
                                ans.push(a);
                            }
                        }
                    }
                }
            }
            return ans;
        }
        if (key === "LT") {
            const ltContent = filter[key];
            const col = Object.keys(ltContent)[0];
            const c = Object.values(ltContent)[0];
            for (let sec of sections) {
                if (typeof sec[col] !== "number") {
                    return null;
                }
                else if (sec[col] < c) {
                    ans.push(sec);
                }
            }
            return ans;
        }
        if (key === "GT") {
            const gtContent = filter[key];
            const col = Object.keys(gtContent)[0];
            const c = Object.values(gtContent)[0];
            for (let sec of sections) {
                if (typeof sec[col] !== "number") {
                    return null;
                }
                else if (sec[col] > c) {
                    ans.push(sec);
                }
            }
            return ans;
        }
        if (key === "EQ") {
            const eqContent = filter[key];
            const col = Object.keys(eqContent)[0];
            const c = Object.values(eqContent)[0];
            for (let sec of sections) {
                if (typeof sec[col] !== "number") {
                    return null;
                }
                else if (sec[col] === c) {
                    ans.push(sec);
                }
            }
            return ans;
        }
        if (key === "IS") {
            const isContent = filter[key];
            const col = Object.keys(isContent)[0];
            let c = Object.values(isContent)[0];
            if (c === "*" || c === "**") {
                return sections;
            }
            if (/(\w+)\*+(\w+)/g.test(c) || /(\w+)\*\*/g.test(c) || /\*\*(\w+)/g.test(c)) {
                return null;
            }
            if (/\*?(\w+)\*/g.test(c) || /\*(\w+)\*?/g.test(c)) {
                if (/^\*/.test(c)) {
                    c = c.replace(/^\*/, ".*");
                }
                else {
                    c = "^" + c;
                }
                if (/\*$/.test(c)) {
                    c = c.replace(/\*$/, ".*");
                }
                else {
                    c = c + "$";
                }
                for (let sec of sections) {
                    if (new RegExp(c, "g").test(sec[col])) {
                        ans.push(sec);
                    }
                }
            }
            for (let sec of sections) {
                if (typeof sec[col] !== "string") {
                    return null;
                }
                else if (sec[col] === c) {
                    ans.push(sec);
                }
            }
            return ans;
        }
        return [];
    }
    orderHelper(one, two, key, dir) {
        if (dir === "UP") {
            if (one[key] < two[key]) {
                return -1;
            }
            else if (one[key] > two[key]) {
                return 1;
            }
            else {
                return 0;
            }
        }
        else {
            if (one[key] < two[key]) {
                return 1;
            }
            else if (one[key] > two[key]) {
                return -1;
            }
            else {
                return 0;
            }
        }
    }
    performOption(option, transResult) {
        let self = this;
        if (transResult.length > 5000) {
            return null;
        }
        const columns = option["COLUMNS"];
        const order = option["ORDER"];
        let sections = [];
        for (let r of transResult) {
            let section = {};
            for (let col of columns) {
                if (r[col] === undefined) {
                    return null;
                }
                else {
                    section[col] = r[col];
                }
            }
            sections.push(section);
        }
        if (order === null || order === "" || order === undefined) {
            return sections;
        }
        if (typeof order === "string") {
            sections.sort((one, two) => (one[order] < two[order] ? -1 : 1));
            return sections;
        }
        const dir = order["dir"];
        const keys = order["keys"];
        if (dir === undefined || keys === undefined) {
            sections.sort((one, two) => (one[order] < two[order] ? -1 : 1));
            return sections;
        }
        else {
            sections.sort(function (one, two) {
                let copyKeys = [];
                for (let k of keys) {
                    copyKeys.push(k);
                }
                let result = 0;
                do {
                    result = self.orderHelper(one, two, copyKeys.shift(), dir);
                } while (result === 0 && copyKeys.length !== 0);
                if (result === 0) {
                    return 1;
                }
                return result;
            });
            return sections;
        }
    }
    performTrans(trans, whereResult) {
        if (trans === undefined) {
            return whereResult;
        }
        const group = trans["GROUP"];
        const apply = trans["APPLY"];
        let groupObj = {};
        for (let r of whereResult) {
            let groupName = "";
            for (let g of group) {
                groupName += "_" + r[g];
            }
            if (groupObj[groupName] === undefined) {
                groupObj[groupName] = [];
                groupObj[groupName].push(r);
            }
            else {
                groupObj[groupName].push(r);
            }
        }
        const applyArray = Object.values(apply);
        let finalResults = [];
        for (let input of Object.values(groupObj)) {
            for (let a of applyArray) {
                const content = Object.values(a)[0];
                const newKey = Object.keys(a)[0];
                const result = this.applyHelper(newKey, content, input);
                if (result === null) {
                    return null;
                }
                else {
                    input = result;
                }
            }
            finalResults.push(input[0]);
        }
        return finalResults;
    }
    performQuery(query) {
        let that = this;
        that.listOfId = [];
        return new Promise(function (resolve, reject) {
            try {
                const fs = require("fs");
                fs.readdirSync("./data/").forEach(function (file) {
                    if (file.indexOf(".DS_Store") === -1) {
                        that.listOfId.push(file);
                    }
                });
                if (Object.keys(query).length !== 2 && Object.keys(query).length !== 3) {
                    return reject(new IInsightFacade_2.InsightError("invalid query"));
                }
                const where = query["WHERE"];
                const option = query["OPTIONS"];
                const transformation = query["TRANSFORMATIONS"];
                if (where === undefined) {
                    return reject(new IInsightFacade_2.InsightError("where format error"));
                }
                if (option === undefined || option === null) {
                    return reject(new IInsightFacade_2.InsightError("option format error"));
                }
                const whereValid = that.isValid(where);
                if (!whereValid) {
                    return reject(new IInsightFacade_2.InsightError("where is not valid"));
                }
                const optionTransValid = that.isValid1(option, transformation);
                if (!optionTransValid) {
                    return reject(new IInsightFacade_2.InsightError("option is not valid"));
                }
                const id = option["COLUMNS"][0].split("_")[0];
                let content = [];
                for (let dataset of that.loadedDataset) {
                    if (Object.keys(dataset)[0] === id) {
                        content = Object.values(dataset)[0];
                    }
                }
                if (content.length === 0) {
                    const readContent = fs.readFileSync("./data/" + id, "utf8");
                    const courses = JSON.parse(readContent);
                    for (let c of courses) {
                        for (let i of c) {
                            content.push(i);
                        }
                    }
                    let dataset = {};
                    dataset[id] = content;
                    that.loadedDataset.push(dataset);
                }
                const whereResult = that.performWhere(where, id, content);
                const transResult = that.performTrans(transformation, whereResult);
                if (transResult === null) {
                    return reject(new IInsightFacade_2.InsightError("perform transformation error"));
                }
                const optionResult = that.performOption(option, transResult);
                if (optionResult === null) {
                    return reject(new IInsightFacade_2.InsightError("perform option error"));
                }
                return resolve(optionResult);
            }
            catch (e) {
                reject(new IInsightFacade_2.InsightError("find error"));
            }
        });
    }
    listDatasets() {
        let that = this;
        return new Promise((resolve) => {
            resolve(that.datasets);
        });
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map