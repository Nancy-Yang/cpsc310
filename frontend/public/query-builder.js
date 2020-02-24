/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function() {
    let query = {};
    // TODO: implement!
    let activeTab = document.getElementsByClassName("nav-item tab active")[0].textContent;
    let id = "";
    if (activeTab === "Courses") {
        id = "courses"
    } else if (activeTab === "Rooms") {
        id = "rooms";
    }


    let whereClause = buildWhere(id);
    let columnClause = buildCol(id);
    let orderClause = buildOrder(id);
    let groupClause = buildGroup(id);
    let transClause = buildTrans(id);
    query["WHERE"] = whereClause;
    query["OPTIONS"] = {};
    query["OPTIONS"]["COLUMNS"] = columnClause;
    if (orderClause !== null) {
        query["OPTIONS"]["ORDER"] = orderClause;
    }

    //if (transClause.length > 0  || (transClause.length === 0 && groupClause.length > 0)) {
    if (groupClause.length > 0) {
        query["TRANSFORMATIONS"] = {};
        query["TRANSFORMATIONS"]["GROUP"] = groupClause;
        query["TRANSFORMATIONS"]["APPLY"] = transClause;
    }

    return query;
    // console.log("CampusExplorer.buildQuery not implemented yet.");
    // return query;
};

function buildWhere(id) {
    let where = {};
    let activeTab;
    if (id === "courses") {
        activeTab = document.getElementById("tab-courses");
    } else if (id === "rooms") {
        activeTab = document.getElementById("tab-rooms")
    }

    // where part
    let formGroupConditions = activeTab.getElementsByClassName("form-group conditions")[0];

    // sentences inside query
    // if Not is checked
    // select col
    // IS, EQ, GT, LT
    // value
    let condtionArr = [];
    let setences = formGroupConditions.querySelectorAll(".control-group.condition"); // querySelectorAll does not allow class name has space
    for (let s of setences) {
        let condition = {};
        let notBox = s.querySelector("input[type=checkbox]").checked;// false
        let field = s.getElementsByClassName("control fields")[0].querySelector("option[selected=selected]").value.trim().toLocaleLowerCase(); // e.g. dept
        let operator = s.getElementsByClassName("control operators")[0].querySelector("option[selected=selected]").value; // e.g. IS
        let term = s.getElementsByClassName("control term")[0].querySelector("input[type=text]").value.trim(); // e.g. cpsc
        condition[operator] = {};
        if (operator === "IS") {
            condition[operator][id + "_" + field] = term;
        } else {
            condition[operator][id + "_" + field] = Number(term);
        }
        if (notBox) {
            condition = {"NOT": condition}
        }
        condtionArr.push(condition);
    }
    // empty where
    if (condtionArr.length === 0) {
        return where;
    }
    // All of the following = AND
    // Any of the following = OR
    // None of the following = AND{NOT, NOT, NOT...}
    let checkedElement = formGroupConditions.querySelectorAll("input[type=radio]:checked")[0].value; // the checked element// (only one)
    if (condtionArr.length === 1) {
        if (checkedElement === "none") {
            where["NOT"] = condtionArr[0];
        } else {
            where = condtionArr[0];
        }
    } else if (condtionArr.length > 1) {
        if (checkedElement === "all") {
            where["AND"] = condtionArr;
        } else if (checkedElement === "any") {
            where["OR"] = condtionArr;
        } else { // checkedElement = "none"
            let editedConditionArr = []; //这块可能需要再检查
            for (let c of condtionArr) {
                let temp = {};
                temp["NOT"] = c;
                editedConditionArr.push(temp);
            }
            where["AND"] = editedConditionArr;
        }
    }
    return where;
}

function buildCol(id) {
    const originalCols = ["audit", "avg", "dept", "fail", "id", "instructor", "pass", "title", "uuid", "year",
    "address", "fullname", "furniture", "href", "lat", "lon", "name", "number", "seats", "shortname", "type"];
    let colArr = [];
    // columns part
    // check which column is checked
    let activeTab;
    if (id === "courses") {
        activeTab = document.getElementById("tab-courses");
    } else if (id === "rooms") {
        activeTab = document.getElementById("tab-rooms")
    }

    let columns = activeTab.querySelector(".form-group.columns").querySelectorAll("input[type=checkbox]:checked");
    for (let c of columns) {
        let newCol = "";
        if (originalCols.includes(c.value)) {
            newCol = id + "_" + c.value;
        } else {
            newCol = c.value;
        }
        colArr.push(newCol);
    }
    return colArr;
}
function buildOrder(id) {
    const originalCols = ["audit", "avg", "dept", "fail", "id", "instructor", "pass", "title", "uuid", "year",
        "address", "fullname", "furniture", "href", "lat", "lon", "name", "number", "seats", "shortname", "type"];
    let order = {};

    let activeTab;
    if (id === "courses") {
        activeTab = document.getElementById("tab-courses");
    } else if (id === "rooms") {
        activeTab = document.getElementById("tab-rooms")
    }

    // order part
    // order cotains control-order fields and control descending

    let fields = activeTab.querySelector(".form-group.order").querySelectorAll("option[selected=selected]");
    let desc = activeTab.querySelector(".form-group.order").querySelector("input[type=checkbox]").checked;
    if (fields.length > 1 || desc) {
        let keys = [];
        let temp;
        for (let f of fields) {
            if (originalCols.includes(f.value)) {
                temp = id + "_" + f.value.trim();
            } else {
                temp = f.value.trim();
            }
            keys.push(temp);
        }
        if (desc) {
            order["dir"] = "DOWN";
        } else {
            order["dir"] = "UP";
        }

        order["keys"] = keys;
    } else if (fields.length === 1) {
        if (originalCols.includes(fields[0].value)) {
            order = id + "_" + fields[0].value.trim();
        } else {
            order = fields[0].value.trim();
        }
    } else if (fields.length === 0) { // double check
        order = null;
    }
    return order;
}

function buildGroup(id) {
    let groupArr = [];
    let activeTab;
    if (id === "courses") {
        activeTab = document.getElementById("tab-courses");
    } else if (id === "rooms") {
        activeTab = document.getElementById("tab-rooms")
    }

    let groups = activeTab.querySelector(".form-group.groups").querySelectorAll("input[type=checkbox]:checked");
    for (let g of groups) {
        let newCol = id + "_" + g.value;
        groupArr.push(newCol);
    }

    return groupArr;
}
function buildTrans(id) {
    let trans = [];
    let activeTab;
    if (id === "courses") {
        activeTab = document.getElementById("tab-courses");
    } else if (id === "rooms") {
        activeTab = document.getElementById("tab-rooms")
    }
    let transformations = activeTab.querySelector(".form-group.transformations").querySelectorAll(".control-group.transformation");
    for (let t of transformations) {
        let transformation = {};
        let term = t.getElementsByClassName("control term")[0].querySelector("input[type=text]").value.trim();
        let operator = t.getElementsByClassName("control operators")[0].querySelector("option[selected=selected]").value;
        let field = t.getElementsByClassName("control fields")[0].querySelector("option[selected=selected]").value;
        transformation[term] = {};
        transformation[term][operator] = id + "_" + field;
        trans.push(transformation);
    }
    return trans;
}
