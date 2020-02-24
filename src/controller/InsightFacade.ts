import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightGeoResponse} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import {Decimal} from "decimal.js";
import {isArray, isObject} from "util";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
// declare var datasets: InsightDataset[];
export default class InsightFacade implements IInsightFacade {
    public datasets: InsightDataset[];
    public listOfId: string[];
    public loadedDataset: any;

    constructor() {
        // ("InsightFacadeImpl::init()");
        this.datasets = [];
        this.listOfId = [];
        this.loadedDataset = [];
    }

    // helper function: find node with certain name and value
    public searchElement(document: any, name: string, value: string): any {
        let result: any;
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
        // return result;
    }
    // https://stackoverflow.com/questions/5083914/get-the-whole-response-body-when-the-response-is-chunked
    public parseHTTP (url: string): Promise<InsightGeoResponse> {
        let self = this;
        const http = require("http");
        let response: InsightGeoResponse;
        return new Promise((resolve, reject) => {
            http.get(url, function successCallback(res: any) {
                let body = "";
                res.on("data", function (chunk: any) {
                    body += chunk;
                });
                res.on("end", function () {
                    response = JSON.parse(body);
                    // self.latitude = response["lat"];
                    // self.longtitude = response["lon"];
                    resolve(response);
                });
            }).on("error", function (e: any) {
                reject(e);
            });
        });
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let self = this;
        const fs = require("fs");
        const JSZip = require("jszip");
        const parse5 = require("parse5");
        if (!fs.existsSync("./data")) {
            fs.mkdirSync("./data");
        }
        // test content
        if (id === null || id === undefined || id === "") {
            return Promise.reject(new InsightError("error: invalid id"));
        }
        if (kind === null || kind === undefined) {
            return Promise.reject(new InsightError("error: InsightDatasetKind is invalid"));
        }
        // if (self.listOfId.includes(id)) {
        //     return Promise.reject(new InsightError("error: dataset already exists"));
        // }
        if (fs.existsSync("./data/" + id)) {
            return Promise.reject(new InsightError("error: dataset already exists"));
        }
        return new Promise((resolve, reject) => {
            let courseList: any = [];
            let roomList: any = [];
            let fileNameList: any = [];
            JSZip.loadAsync(content, {base64: true}).then( async function (myZip: any) {
                // Courses
                if (kind === InsightDatasetKind.Courses) {
                    myZip.folder("courses").forEach(function (relativePath: string, file: any) {
                        const temp = file.async("string");
                        courseList.push(temp);
                    });
                    // parse file
                    let nRows: number = 0;
                    let courseArr: any = [];
                    Promise.all(courseList).then(function (data: any) {
                        if (data.length === 0) {
                            reject(new InsightError("zip file is empty"));
                        }
                        let i: number;
                        for (i = 0; i < courseList.length; i++) {
                            try {
                                const course = JSON.parse(data[i]);
                                const resultArray = course["result"];
                                const resultSize = resultArray.length;
                                if (resultSize > 0) {
                                    const secArray = [];
                                    for (let j = 0; j < resultSize; j++) {
                                        const section: any = {};
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
                                        } else {
                                            section[id + "_year"] = parseInt(resultArray[j]["Year"], 10);
                                        }
                                        secArray.push(section);
                                    }
                                    nRows = nRows + resultSize;
                                    courseArr.push(secArray);
                                }
                            } catch (e) {
                                Log.trace(e);
                            }
                        }
                        if (nRows === 0) {
                            reject(new InsightError("no valid content"));
                        } else {
                            self.datasets.push({id, kind: InsightDatasetKind.Courses, numRows: nRows});
                            const cacheString = JSON.stringify(courseArr);
                            fs.writeFileSync("./data/" + id, cacheString, "utf8");
                            self.listOfId.push(id);
                            resolve(self.listOfId);
                        }
                    }).catch(function (e: any) {
                        reject(new InsightError("error"));
                    });
                    // Rooms
                } else if (kind === InsightDatasetKind.Rooms) {
                    // parse rooms
                    let hrefList: any = [];
                    const index = await myZip.file("index.htm").async("string");
                    let obj = parse5.parse(index);
                    let buildings = self.searchElement(obj, "class", "views-table cols-5 table");
                    let body = buildings.childNodes[3];
                    for (let i = 1; i < body.childNodes.length; i += 2) {
                        let tr = body.childNodes[i];
                        let href = tr.childNodes[5].childNodes[1].attrs[0].value;
                        let res = href.substring(2);
                        hrefList.push(res);
                    }
                    myZip.forEach(function (relativePath: string, file: any) {
                        if (!file.dir && hrefList.includes(relativePath)) { // get child files
                            const temp1 = relativePath.split("/");
                            const fileName = temp1[temp1.length - 1];
                            if (fileName.indexOf(".") === -1 && fileName !== "MAUD") {
                                fileNameList.push(fileName);
                                const temp = file.async("string");
                                roomList.push(temp);
                            }
                        }
                    });
                    // Log.trace("debug");
                    let nRows: number = 0;
                    let buildArr: any = [];
                    Promise.all(roomList).then(async function (data: any) {
                        if (data.length === 0) {
                            reject(new InsightError("zip file is empty"));
                        }
                        let i: number;
                        for (i = 0; i < roomList.length; i++) {
                            try {
                                const building = parse5.parse(data[i]);
                                // get full name ,short name, and address
                                const node1 = self.searchElement(building, "id", "building-info");
                                const fullName = parse5.serialize(node1.childNodes[1].childNodes[0]).toString();
                                const address = parse5.serialize(node1.childNodes[3].childNodes[0]).toString();
                                const shortName = fileNameList[i];
                                const geoLocation = "http://cs310.ugrad.cs.ubc.ca:11316/api/v1/project_q1l0b_z9f0b/"
                                    + encodeURI(address);
                                const geoResponse = await self.parseHTTP(geoLocation);
                                const latitude = geoResponse["lat"];
                                const longtitude = geoResponse["lon"];
                                // get room #, seats, furniture, and type
                                const node2 = self.searchElement(building, "class", "views-table cols-5 table");
                                if (node2 !== undefined) {
                                    let roomArr: any = [];
                                    // when building has room info
                                    const roomArray = node2.childNodes[3].childNodes;
                                    const roomArraySize = roomArray.length;
                                    let countRoom = 0;
                                    for (let j = 1; j < roomArraySize; j += 2) {
                                        countRoom = countRoom + 1;
                                        const room: any = {};
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
                                        let roomhref: any;
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
                            } catch (e) {
                                Log.trace(data);
                            }
                        }
                        if (nRows === 0) {
                            reject(new InsightError("no valid rooms"));
                        } else {
                            self.datasets.push({id, kind: InsightDatasetKind.Rooms, numRows: nRows});
                            const cacheString = JSON.stringify(buildArr);
                            fs.writeFileSync("./data/" + id, cacheString, "utf8");
                            self.listOfId.push(id);
                            resolve(self.listOfId);
                        }
                    }).catch(function (e: any) {
                        reject(new InsightError("error"));
                    });
                }
            }).catch(function (err: any) {
                reject(new InsightError("content is not valid"));
            });
        });
    }

    public removeDataset(id: string): Promise<string> {
        const fs = require("fs");
        const self = this;
        const path = "./data/" + id;
        const exist: boolean = fs.existsSync(path);
        return new Promise((resolve, reject) => {
            if (id === null || id === undefined || id === "") {
                reject(new InsightError("id is invalid"));
            }
            if (!exist) {
                reject(new NotFoundError("file does not exist"));
            }
            fs.access(path, fs.constants.F_OK || fs.constants.W_OK, function (err: any) {
                if (exist && !err) {
                    fs.unlink(path, (e: any) => {
                        if (e) {
                            reject(new NotFoundError("id does not exist"));
                        }
                        self.datasets = self.datasets.filter((item: InsightDataset) => item.id !== id);
                        self.listOfId = self.listOfId.filter((item: string) => item !== id);
                        resolve(id);
                    });
                } else {
                    reject(new InsightError("format error"));
                }
            });
        });
    }

    public applyHelper(newKey: any, content: any, arr: any): any {
        let finalResults: any = [];
        // let result: any;
        const key = Object.keys(content)[0];
        const col = Object.values(content)[0];
        if (key === "SUM") {
            let total: number = 0.00;
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
            let total = new Decimal(0);
            let res: number;
            for (let a of arr) {
                if (typeof a[col] !== "number") {
                    return null;
                }
                const value = new Decimal(a[col]);
                total = Decimal.add(total, value);
                const avg = total.toNumber() / arr.length;
                res = Number(avg.toFixed(2));
                // Log.trace("debug");
            }
            for (let a of arr) {
                a[newKey] = res;
                finalResults.push(a);
            }
        }
        if (key === "MIN") {
            let min: number = Infinity;
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
            let max: number = -Infinity;
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
            let temp: any = [];
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
        // finalResults.push(result);
        return finalResults;
    }

    public isValid(where: any): boolean {
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
        // where is empty
        if (Object.keys(where).length === 0) {
            return true;
        }
        // This is the first key in filter
        const key = Object.keys(where)[0];
        if (!validKeys.includes(key)) {
            // Log.trace("bug1");
            return false;
        }
        // NOT case
        if (key === "NOT") {
            const notContent = where["NOT"];
            if (validKeys.includes(Object.keys(notContent)[0])) {
                return this.isValid(notContent);
            }
        }

        // AND, OR case
        if (key === "OR" || key === "AND") {
            const content = where[key];
            let ans: boolean[] = [];
            // OR is array, check each element in OR array
            if (Object.keys(content).length === 0) {
                // Log.trace("bug2");
                return false;
            }
            if (content !== null || content !== undefined) {
                for (let index of content) {
                    ans.push(this.isValid(index));
                }
                if (ans.includes(false) && key === "AND") {
                    // Log.trace("bug3");
                    return false;
                } else {
                    // Log.trace("pass");
                    return true;
                }
            }
        }

        // GT, LT, EQ case
        if (key ===  "LT" || key === "GT" || key === "EQ") {
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
            } catch {
                // Log.trace("bug5");
                return false;
            }
        }
        // IS case
        if (key ===  "IS") {
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
                        return true; }
                }
            } catch {
                // Log.trace("bug6");
                return false;
            }
        }
        // Log.trace("bug7");
        return false;
    }
// TODO Option valid
    public isValid1(option: any, transformation: any): boolean {
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
        // option
        let columns: any;
        let order: any = null;
        let transKey: string[] = []; // include keys of group and apply
        if (Object.keys(option).length === 1 && Object.keys(option)[0] === "COLUMNS") {
            columns = option["COLUMNS"];
        } else if (Object.keys(option).length === 2) {
            columns = option["COLUMNS"];
            order = option["ORDER"];
        } else {
            // Log.trace("OPTION all geshi wrong");
            return false;
        }
        if (columns === null || columns.length === 0 || columns === undefined) {
            // Log.trace("column is empty");
            return false;
        }

        // TODO: new added lines for transformation
        try {
            if (transformation === undefined) {
                // return true;
                let id1: string =  columns[0].split("_")[0];
                if (self.listOfId.includes(id1)) {
                    for (let col of columns) {
                        const newID1 = col.split("_")[0];
                        if (newID1 !== id1) {
                            // Log.trace("ID is not in ID list");
                            return false;
                        }
                    }
                }
            } else if (Object.keys(transformation).length !== 2) {
                // Log.trace("TRANSFORM  > 3");
                return false;
            } else {
                // check group is empty
                const group = transformation["GROUP"]; // array of string
                const apply = transformation["APPLY"]; // array of objects
                if (group.length === 0 || group === undefined) {
                    // Log.trace("group is not  valid");
                    return false;
                }
                if (apply === undefined ) {
                    // Log.trace("apply is not  valid");
                    return false;
                }
                for (let o of apply) {
                    const newApplyKey = Object.keys(o)[0];
                    const content = Object.values(o)[0];
                    // key is not unique
                    // TODO 我觉得这里没必要return false
                    if (transKey.includes(newApplyKey)) {
                        // Log.trace("applyKey has exist before");
                        return false;
                    } else {
                        transKey.push(newApplyKey);
                    }
                    // check if key is valid
                    let keyFull = Object.values(content)[0];
                    let keyName = keyFull.split("_")[1];
                    if (!validKeys.includes(Object.keys(content)[0]) || !validKeys0.includes(keyName)) {
                        // Log.trace("p553 key  is not  valid");
                        return false;
                    }
                }
                for (let element of group) {
                    let groupKey = element.split("_")[1];
                    if (!validKeys0.includes(groupKey)) {
                        // Log.trace("p560 groupKey is not  valid");
                        return false;
                    }
                    transKey.push(element);
                }

                // columns
                // TODO: need edit: may include apply columns

                // check if columns in transformation are valid
                let id: string = null;
                for (let i of transKey) {
                    // Log.trace(typeof i);
                    if (i.indexOf("_") !== -1) {
                        const newId = i.split("_")[0];
                        if (!self.listOfId.includes(newId)) {
                            // // ("p576 column keys is not  valid");
                            return false;
                        } else if (id === null) {
                            id = newId;
                        } else if (newId !== id) {
                            // ("581 colum ID is not in listID");
                            return false;
                        }
                    }
                }
                // check if cols in COLUMNS are all appear in transformation clause
                for (let col of columns) {
                    if (!transKey.includes(col)) {
                        // ("cols in COLUMNS are all appear in transformation clause");
                        return false;
                    }
                }
            }
            // order
            if (order === null || order === "") {
                return true;
            } else if (order === undefined) {
                // ("598 order incorrect");
                return false;
            }
            // TODO: if order has keys, must have "dir" and "keys"
            /* d1 code
            try {
                const orderCol = order.split("_")[0];
                return self.listOfId.includes(orderCol) && columns.includes(order);
            } catch {
                return false;
            }
            */
            if (typeof order === "string") {// order by one column, same as d1
                if (order.indexOf("_") === -1) { // order by apply columns
                    return columns.includes(order);
                } else { // order by d1 columns
                    const orderCol = order.split("_")[0];
                    return self.listOfId.includes(orderCol) && columns.includes(order);
                }
            } else { // order with "dir" and "keys"
                const dir = order["dir"]; // string, can only be "UP" and "DOWN"
                const keys = order["keys"]; // ARRAY of string, can be empty array
                // const type = typeof keys; // type is object
                let listDir = ["UP", "DOWN"];
                if (!listDir.includes(dir) || !isArray(keys) || keys.length === 0) {
                    // ("623 keys array OR dir invalid ");
                    return false;
                }
                for (let k of keys) {
                    if (!columns.includes(k)) {
                        // // ("581 colum DOESN'T contain key");
                        return false;
                    }
                }
                return true;
            }
        } catch (e) {
            // ("try catch erro MAYBE split id fails");
            return false;
        }
    }

    public performWhere(filter: any, id: string, sections: any): string[] {
        const validKeys = [
            "AND",
            "OR",
            "NOT",
            "LT",
            "GT",
            "EQ",
            "IS",
        ];
        // get dataset content
        // empty where
        if (Object.keys(filter).length === 0) {
            return sections;
        }
        const key = Object.keys(filter)[0];
        let ans: string[] = [];
        // NOT case
        if (key === "NOT") {
            const notContent = filter["NOT"];
            // let ans: string[] = [];
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
            // else if (validCols.includes(notContent)) {
            //    return true;
            // }
        }

        // OR case
        if (key === "OR") {
            const array = filter[key];
            let nullNumber = 0;
            // let ans: string[] = [];
            // OR is array, check each element in OR array
            if (array !== null || array !== undefined) {
                for (let index of array) {
                    let ans1: string[] = [];
                    ans1 = this.performWhere(index, id, sections);
                    // TODO:
                    if (ans1 === null) {
                        nullNumber = nullNumber + 1;
                    } else {
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
        // AND case
        if (key === "AND") {
            const array = filter[key];
            // let ans: string[] = [];
            if (array !== null || array !== undefined) {
                for (let index = 0; index < array.length; index++) {
                    let ans1: string[] = [];
                    ans1 = this.performWhere(array[index], id, sections);
                    if (ans1 === null) {
                        return null;
                    } else if (ans1.length === 0) {
                        return [];
                    } else if (ans.length === 0 && ans1.length !== 0 && index === 0) {
                        ans = ans1;
                    } else {
                        const temp: string[] = ans;
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
        // GT, LT, EQ case
        if (key ===  "LT") {
            const ltContent = filter[key];
            const col = Object.keys(ltContent)[0];
            const c = Object.values(ltContent)[0];
            // let ans: string[] = [];
            for (let sec of sections) {
                if (typeof sec[col] !== "number") {
                    return null;
                } else if (sec[col] < c) {
                    ans.push(sec);
                }
            }
            return ans;
        }
        if (key ===  "GT") {
            const gtContent = filter[key];
            const col = Object.keys(gtContent)[0];
            const c = Object.values(gtContent)[0];
            // let ans: string[] = [];
            for (let sec of sections) {
                if (typeof sec[col] !== "number") {
                    return null;
                } else if (sec[col] > c) {
                    ans.push(sec);
                }
            }
            return ans;
        }
        if (key ===  "EQ") {
            const eqContent = filter[key];
            const col = Object.keys(eqContent)[0];
            const c = Object.values(eqContent)[0];
            // let ans: string[] = [];
            for (let sec of sections) {
                // Log.trace(typeof sec[col]);
                if (typeof sec[col] !== "number") {
                    return null;
                } else if (sec[col] === c) {
                    ans.push(sec);
                }
            }
            return ans;
        }
        // IS case
        if (key ===  "IS") {
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
                } else {
                    c = "^" + c;
                }
                if (/\*$/.test(c)) {
                    c = c.replace(/\*$/, ".*");
                } else {
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
                } else if (sec[col] === c) {
                    ans.push(sec);
                }
            }
            return ans;
        }
        return [];
    }

    public orderHelper(one: any, two: any, key: string, dir: string): number {
        if (dir === "UP") {
            if (one[key] < two[key]) {
                return -1;
            } else if (one[key] > two[key]) {
                return 1;
            } else {
                return 0;
            }
        } else {
            if (one[key] < two[key]) {
                return 1;
            } else if (one[key] > two[key]) {
                return -1;
            } else {
                return 0;
            }
        }
    }

    public performOption(option: any, transResult: string[]): string[] {
        // TODO: columns need to include the apply column in transformation
        let self = this;
        if (transResult.length > 5000) {
            return null;
        }
        const columns = option["COLUMNS"];
        const order = option["ORDER"];
        let sections: string[] = [];
        for (let r of transResult) {
            let section: any = {};
            for (let col of columns) {
                if (r[col] === undefined) {
                    return null;
                } else {
                    section[col] = r[col];
                }
            }
            sections.push(section);
        }
        // perform order
        // const debug = Object.keys(order);
        // Log.trace("debug");
        // TODO: order by two or more columns; sort by down or up
        if (order === null || order === "" || order === undefined) {
            return sections;
        }
        if (typeof order === "string") {
            sections.sort((one: any, two: any) => (one[order] < two[order] ? -1 : 1));
            return sections;
        }
        const dir = order["dir"];
        const keys = order["keys"];
        if (dir === undefined || keys === undefined) {
            sections.sort((one, two) => (one[order] < two[order] ? -1 : 1));
            return sections;
        } else {
            // TODO: call helper function
            sections.sort(function (one, two) {
                let copyKeys: any = [];
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

    public performTrans(trans: any, whereResult: string[]): string[] {
        // TODO:
        if (trans === undefined) {
            return whereResult;
        }
        const group = trans["GROUP"]; // array of string
        const apply = trans["APPLY"]; // array of objects
        // 这里写的有点麻烦
        // obj = [hashvalue: [], hashavalue: []]
        // if (obj["some"] === undefined
        let groupObj: any = {};
        for (let r of whereResult) {
            let groupName = "";
            for (let g of group) {
                groupName += "_" + r[g];
            }
            if (groupObj[groupName] === undefined) {
                groupObj[groupName] = [];
                groupObj[groupName].push(r);
            } else {
                groupObj[groupName].push(r);
            }
        }
        // ("debug");
        // orignal code
        /*
        let groupNameList: string[] = [];
        for (let r of whereResult) {
            let groupName = "";
            for (let g of group) {
                groupName += "_" + r[g];
            }
            if (!groupNameList.includes(groupName)) {
                groupNameList.push(groupName);
            }
        }
        if (groupNameList.length > 5000) {
            return null;
        }
        let intermediate: any = [];
        for (let gn of groupNameList) {
            let newGroup: any = {};
            newGroup[gn] = [];
            for (let r of whereResult) {
                let groupName = "";
                for (let g of group) {
                    groupName += "_" + r[g];
                }
                if (groupName === gn) {
                    newGroup[gn].push(r);
                }
            }
            intermediate.push(newGroup);
        }*/
        const applyArray = Object.values(apply); // array of object
        let finalResults: any = [];
        for (let input of Object.values(groupObj)) {
            // let input = Object.values(ob)[0]; // array of one intermediate group
            for (let a of applyArray) { // a = Object {overallAvg:}
                const content = Object.values(a)[0]; // this can only have one element, content should be an object
                const newKey = Object.keys(a)[0];
                const result = this.applyHelper(newKey, content, input);
                if (result === null) {
                    return null;
                } else {
                    input = result; // there may be another apply function, so update input
                }
            }
            // not sure
            finalResults.push(input[0]);
        }
        return finalResults;
    }

    public performQuery(query: any): Promise <any[]> {
        let that = this;
        that.listOfId = [];
        // check if query is valid
        return new Promise(function (resolve, reject) {
                try {
                    const fs = require("fs");
                    fs.readdirSync("./data/").forEach(function (file: any) {
                        if (file.indexOf(".DS_Store") === -1) {
                            that.listOfId.push(file);
                        }
                    });
                    // Log.trace("debug");
                    if (Object.keys(query).length !== 2 && Object.keys(query).length !== 3) {
                        return reject(new InsightError("invalid query"));
                    }
                    const where = query["WHERE"];
                    const option = query["OPTIONS"];
                    const transformation = query["TRANSFORMATIONS"]; // transformation is optional
                    if (where === undefined) {
                        return reject(new InsightError("where format error"));
                    }
                    if (option === undefined || option === null) {
                        return reject(new InsightError("option format error"));
                    }
                    const whereValid = that.isValid(where);
                    if (!whereValid) {
                        return reject(new InsightError("where is not valid"));
                    }
                    const optionTransValid = that.isValid1(option, transformation);
                    if (!optionTransValid) {
                        return reject(new InsightError("option is not valid"));
                    }
                    const id = option["COLUMNS"][0].split("_")[0];

                    let content: string[] = [];
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
                        let dataset: any = {};
                        dataset[id] = content;
                        that.loadedDataset.push(dataset);
                    }
                    const whereResult = that.performWhere(where, id, content);
                    // let sections: string[] = [];
                    // const content = fs.readFileSync("./data/" + id, "utf8"); // content is string
                    // const courses = JSON.parse(content);
                    // for (let c of courses) {
                    //     for (let i of c) {
                    //         sections.push(i);
                    //     }
                    // }
                    // const whereResult = that.performWhere(where, id, sections);
                    // TODO: do transformation first, then option
                    // TODO: need to add a helper function called performTrans
                    const transResult = that.performTrans(transformation, whereResult);
                    // if (transResult.length > 5000) {
                    // return reject(new InsightError("meet 5000 limit"));
                    // }
                    if (transResult === null) {
                        return reject(new InsightError("perform transformation error"));
                    }

                    const optionResult = that.performOption(option, transResult);
                    if (optionResult === null) {
                        return reject(new InsightError("perform option error"));
                    }
                    return resolve(optionResult);
                } catch (e) {
                    reject(new InsightError("find error"));
                }
            }
        );
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let that = this;
        return new Promise((resolve) => {
            resolve(that.datasets);
        });
    }
}
