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
const chai_1 = require("chai");
const IInsightFacade_1 = require("../src/controller/IInsightFacade");
const InsightFacade_1 = require("../src/controller/InsightFacade");
const Util_1 = require("../src/Util");
const TestUtil_1 = require("./TestUtil");
describe("InsightFacade Add/Remove Dataset", function () {
    let fs = require("fs");
    let deleteFolderRecursive = function (path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function (file) {
                let curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    deleteFolderRecursive(curPath);
                }
                else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    };
    this.timeout(10000);
    const datasetsToLoad = {
        rooms: "./test/data/rooms.zip",
        courses: "./test/data/courses.zip",
        validCourses1: "./test/data/validCourses1.zip",
        validCourses2: "./test/data/validCourses1.zip",
        empty: "./test/data/empty.zip",
        badCourses: "./test/data/badCourses.zip",
        someBadFile: "./test/data/someBadFile.zip",
        wrongCourseName: "./test/data/wrongCourseName.zip",
        wrongFileName: "./test/data/wrongFileName.zip",
        wrongFileName1: "./test/data/wrongFileName1.zip",
        wrongFolderName: "./test/data/wrongFolderName.zip",
        content1: "./test/data/content1.zip",
        content2: "./test/data/content2.zip",
        content3: "./test/data/content3.zip",
        content4: "./test/data/content4.zip",
        content5: "./test/data/content5.zip",
        content6: "./test/data/content6.zip",
        folderInZip: "./test/data/folderInZip.zip",
        folderZipInvalid: "./test/data/folderInZipInvalid.zip",
        invalid1: "./test/data/invalid1.zip",
        invalid2: "./test/data/invalid2.zip",
    };
    let insightFacade;
    let datasets;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            Util_1.default.test(`Before: ${this.test.parent.title}`);
            deleteFolderRecursive("./data");
            try {
                const loadDatasetPromises = [];
                for (const [id, path] of Object.entries(datasetsToLoad)) {
                    loadDatasetPromises.push(TestUtil_1.default.readFileAsync(path));
                }
                const loadedDatasets = (yield Promise.all(loadDatasetPromises)).map((buf, i) => {
                    return { [Object.keys(datasetsToLoad)[i]]: buf.toString("base64") };
                });
                datasets = Object.assign({}, ...loadedDatasets);
                chai_1.expect(Object.keys(datasets)).to.have.length.greaterThan(0);
            }
            catch (err) {
                chai_1.expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
            }
            try {
                insightFacade = new InsightFacade_1.default();
            }
            catch (err) {
                Util_1.default.error(err);
            }
            finally {
                chai_1.expect(insightFacade).to.be.instanceOf(InsightFacade_1.default);
            }
        });
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
    });
    it("Should add a valid room dataset", () => __awaiter(this, void 0, void 0, function* () {
        const id = "rooms";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Rooms);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.deep.equal([id]);
        }
    }));
    it("add room dataset again", () => __awaiter(this, void 0, void 0, function* () {
        const id = "rooms";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Rooms);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("Should add a valid dataset", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses";
        let response;
        const ids = ["rooms", "courses"];
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.deep.equal(ids);
        }
    }));
    it("add courses again", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("test adding empty zip file", () => __awaiter(this, void 0, void 0, function* () {
        const id = "empty";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("add another valid zip file", () => __awaiter(this, void 0, void 0, function* () {
        const id = "validCourses1";
        const ids = ["rooms", "courses", "validCourses1"];
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.deep.equal(ids);
        }
    }));
    it("add another valid zip file2", () => __awaiter(this, void 0, void 0, function* () {
        const id = "validCourses2";
        const ids = ["rooms", "courses", "validCourses1", "validCourses2"];
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.deep.equal(ids);
        }
    }));
    it("test if a new dataset has been added", () => __awaiter(this, void 0, void 0, function* () {
        const id = "validCourses1";
        let response;
        try {
            response = yield insightFacade.listDatasets();
        }
        catch (err) {
            response = err;
        }
        finally {
            const length = response.length;
            chai_1.expect(length).to.deep.equal(4);
        }
    }));
    it("Should remove a valid dataset1", () => __awaiter(this, void 0, void 0, function* () {
        const id = "validCourses1";
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.deep.equal(id);
        }
    }));
    it("add bad zip file1", () => __awaiter(this, void 0, void 0, function* () {
        const id = "badCourses";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("Should remove a valid dataset", () => __awaiter(this, void 0, void 0, function* () {
        const id = "badCourses";
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.NotFoundError);
        }
    }));
    it("remove a non-existing zip file", () => __awaiter(this, void 0, void 0, function* () {
        const id = "badCourses1";
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.NotFoundError);
        }
    }));
    it("add bad zip file", () => __awaiter(this, void 0, void 0, function* () {
        const id = "someBadFile";
        const ids = ["rooms", "courses", "validCourses2", "someBadFile"];
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.deep.equal(ids);
        }
    }));
    it("test if the zip file has been added", () => __awaiter(this, void 0, void 0, function* () {
        const id = "someBadFile";
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.deep.equal(id);
        }
    }));
    it("add a zip file name null", () => __awaiter(this, void 0, void 0, function* () {
        const id = null;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("remove a zip file name null", () => __awaiter(this, void 0, void 0, function* () {
        const id = null;
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("add a zip file name undefined", () => __awaiter(this, void 0, void 0, function* () {
        const id = undefined;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("remove a zip file name undefined", () => __awaiter(this, void 0, void 0, function* () {
        const id = undefined;
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("add a zip file name empty string", () => __awaiter(this, void 0, void 0, function* () {
        const id = "";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("remove a zip file name empty string", () => __awaiter(this, void 0, void 0, function* () {
        const id = "";
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("add a non-zip file", () => __awaiter(this, void 0, void 0, function* () {
        const id = "test";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("remove a non-zip file", () => __awaiter(this, void 0, void 0, function* () {
        const id = "test";
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.NotFoundError);
        }
    }));
    it("add dataset fails4", () => __awaiter(this, void 0, void 0, function* () {
        const id = "wrongFolderName";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("add dataset fails5", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses";
        let response;
        const id0 = "badCourses";
        try {
            response = yield insightFacade.addDataset(id, datasets[id0], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("add dataset fails6", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses";
        let response;
        const id0 = "notExist";
        try {
            response = yield insightFacade.addDataset(id, datasets[id0], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("add dataset fails7", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Rooms);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("dataset kind is null", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], null);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("dataset kind is undefined", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], undefined);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("add dataset fails", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses";
        let response;
        const id0 = "empty";
        try {
            response = yield insightFacade.addDataset(id, datasets[id0], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("add dataset fails", () => __awaiter(this, void 0, void 0, function* () {
        const id = "content1";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("add dataset fails", () => __awaiter(this, void 0, void 0, function* () {
        const id = "content2";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("add dataset fails", () => __awaiter(this, void 0, void 0, function* () {
        const id = "content3";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("add dataset fails", () => __awaiter(this, void 0, void 0, function* () {
        const id = "content6";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("folder in zip invalid", () => __awaiter(this, void 0, void 0, function* () {
        const id = "folderInZipInvalid";
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
        }
    }));
    it("Should remove validCourses2", () => __awaiter(this, void 0, void 0, function* () {
        const id = "validCourses2";
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.deep.equal(id);
        }
    }));
    it("Should remove courses", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses";
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.deep.equal(id);
        }
    }));
    it("Should remove rooms", () => __awaiter(this, void 0, void 0, function* () {
        const id = "rooms";
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response).to.deep.equal(id);
        }
    }));
});
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery = {
        courses: "./test/data/courses.zip",
        validCourses1: "./test/data/validCourses1.zip",
        rooms: "./test/data/rooms.zip",
    };
    let insightFacade;
    let testQueries = [];
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            Util_1.default.test(`Before: ${this.test.parent.title}`);
            try {
                testQueries = yield TestUtil_1.default.readTestQueries();
                chai_1.expect(testQueries).to.have.length.greaterThan(0);
            }
            catch (err) {
                chai_1.expect.fail("", "", `Failed to read one or more test queries. ${JSON.stringify(err)}`);
            }
            try {
                insightFacade = new InsightFacade_1.default();
            }
            catch (err) {
                Util_1.default.error(err);
            }
            finally {
                chai_1.expect(insightFacade).to.be.instanceOf(InsightFacade_1.default);
            }
            try {
                const loadDatasetPromises = [];
                for (const [id, path] of Object.entries(datasetsToQuery)) {
                    loadDatasetPromises.push(TestUtil_1.default.readFileAsync(path));
                }
                const loadedDatasets = (yield Promise.all(loadDatasetPromises)).map((buf, i) => {
                    return { [Object.keys(datasetsToQuery)[i]]: buf.toString("base64") };
                });
                chai_1.expect(loadedDatasets).to.have.length.greaterThan(0);
                const responsePromises = [];
                const datasets = Object.assign({}, ...loadedDatasets);
                for (const [id, content] of Object.entries(datasets)) {
                    responsePromises.push(insightFacade.addDataset(id, content, IInsightFacade_1.InsightDatasetKind.Courses));
                }
                try {
                    const responses = yield Promise.all(responsePromises);
                    responses.forEach((response) => chai_1.expect(response).to.be.an("array"));
                }
                catch (err) {
                    Util_1.default.warn(`Ignoring addDataset errors. For D1, you should allow errors to fail the Before All hook.`);
                }
            }
            catch (err) {
                chai_1.expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
            }
        });
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
    });
    it("Should run test queries", () => {
        describe("Dynamic InsightFacade PerformQuery tests", () => {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, () => __awaiter(this, void 0, void 0, function* () {
                    let response;
                    try {
                        response = yield insightFacade.performQuery(test.query);
                    }
                    catch (err) {
                        response = err;
                    }
                    finally {
                        if (test.isQueryValid) {
                            chai_1.expect(response).to.deep.equal(test.result);
                        }
                        else {
                            chai_1.expect(response).to.be.instanceOf(IInsightFacade_1.InsightError);
                        }
                    }
                }));
            }
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map