import { expect } from "chai";

import {
    InsightDataset,
    InsightDatasetKind,
    InsightError, NotFoundError,
} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the JSON schema described in test/query.schema.json
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: string | string[];
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the Before All hook.
    // source: https://stackoverflow.com/questions/18052762/remove-directory-which-is-not-empty
    let fs = require("fs");
    let deleteFolderRecursive = function (path: any) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function (file: any) {
                let curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    };
    this.timeout(10000);
    const datasetsToLoad: { [id: string]: string } = {
        // id : "path"
        rooms: "./test/data/rooms.zip",
        courses: "./test/data/courses.zip",
        validCourses1: "./test/data/validCourses1.zip",
        validCourses2: "./test/data/validCourses1.zip",
        empty: "./test/data/empty.zip",
        badCourses: "./test/data/badCourses.zip",
        someBadFile: "./test/data/someBadFile.zip",
        // test: "./test/data/test",
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

    let insightFacade: InsightFacade;
    let datasets: { [id: string]: string };

    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);
        deleteFolderRecursive("./data");

        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToLoad)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return { [Object.keys(datasetsToLoad)[i]]: buf.toString("base64") };
            });
            datasets = Object.assign({}, ...loadedDatasets);
            expect(Object.keys(datasets)).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });
    it("Should add a valid room dataset", async () => {
        const id: string = "rooms";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id]);
        }
    });
    // add room dataset again
    it("add room dataset again", async () => {
        const id: string = "rooms";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // it("Should remove a valid dataset", async () => {
    //     const id: string = "rooms";
    //     let response: string;
    //
    //     try {
    //         response = await insightFacade.removeDataset(id);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.deep.equal(id);
    //     }
    // });
    // add room dataset again
    // it("Should add a valid room dataset", async () => {
    //     const id: string = "rooms";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.deep.equal([id]);
    //     }
    // });
    // add dataset success
    it("Should add a valid dataset", async () => {
        const id: string = "courses";
        let response: string[];
        const ids: string[] = ["rooms", "courses"];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(ids);
        }
    });
    // courses exist
    it("add courses again", async () => {
        const id: string = "courses";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // add a empty zip file
    it("test adding empty zip file", async () => {
        const id: string = "empty";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // add another valid zip file
    it("add another valid zip file", async () => {
        const id: string = "validCourses1";
        const ids: string[] = ["rooms", "courses", "validCourses1"];
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(ids);
        }
    });
    it("add another valid zip file2", async () => {
        const id: string = "validCourses2";
        const ids: string[] = ["rooms", "courses", "validCourses1", "validCourses2"];
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(ids);
        }
    });
    it("test if a new dataset has been added", async () => {
        const id: string = "validCourses1";
        let response: InsightDataset[];

        try {
            response = await insightFacade.listDatasets();
        } catch (err) {
            response = err;
        } finally {
            const length = response.length;
            expect(length).to.deep.equal(4);
        }
    });
    // // should remove dataset courses
    // it("Should remove a valid dataset1", async () => {
    //     const id: string = "courses";
    //     let response: string;
    //
    //     try {
    //         response = await insightFacade.removeDataset(id);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.deep.equal(id);
    //     }
    // });
    // should remove dataset validCourses1
    it("Should remove a valid dataset1", async () => {
        const id: string = "validCourses1";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
        }
    });
    // // courses has already been removed
    // it("Should remove a valid dataset", async () => {
    //     const id: string = "courses";
    //     let response: string;
    //
    //     try {
    //         response = await insightFacade.removeDataset(id);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(NotFoundError);
    //     }
    // });
    // test add a invalid dataset
    it("add bad zip file1", async () => {
        const id: string = "badCourses";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // zip file does not exist
    it("Should remove a valid dataset", async () => {
        const id: string = "badCourses";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(NotFoundError);
        }
    });
    // zip file does not exist
    it("remove a non-existing zip file", async () => {
        const id: string = "badCourses1";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(NotFoundError);
        }
    });
    // test add a zip file with some valid files and some invalid files
    it("add bad zip file", async () => {
        const id: string = "someBadFile";
        const ids: string[] = ["rooms", "courses", "validCourses2", "someBadFile"];
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(ids);
        }
    });
    // test if the zip file has been added
    it("test if the zip file has been added", async () => {
        const id: string = "someBadFile";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
        }
    });
    // test when add a zip file name null
    it("add a zip file name null", async () => {
        const id: string = null;
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // test remove a zip file name null
    it("remove a zip file name null", async () => {
        const id: string = null;
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test when add a zip file name undefined
    it("add a zip file name undefined", async () => {
        const id: string = undefined;
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // test remove a zip file name undefined
    it("remove a zip file name undefined", async () => {
        const id: string = undefined;
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test when add a zip file name ""
    it("add a zip file name empty string", async () => {
        const id: string = "";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // test remove a zip file name ""
    it("remove a zip file name empty string", async () => {
        const id: string = "";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test add a file that is not zip file
    it("add a non-zip file", async () => {
        const id: string = "test";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // test remove a non-zip file
    it("remove a non-zip file", async () => {
        const id: string = "test";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(NotFoundError);
        }
    });
    // This is an example of a pending test. Add a callback function to make the test run.
    // it("Should remove the courses dataset");
    // add dataset fails
    // it("add dataset fails1", async () => {
    //     const id: string = "wrongCourseName";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    // it("add dataset fails2", async () => {
    //     const id: string = "wrongFileName";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    // it("add dataset fails3", async () => {
    //     const id: string = "wrongFileName1";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    it("add dataset fails4", async () => {
        const id: string = "wrongFolderName";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    it("add dataset fails5", async () => {
        const id: string = "courses";
        let response: string[];
        const id0: string = "badCourses";

        try {
            response = await insightFacade.addDataset(id, datasets[id0], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    it("add dataset fails6", async () => {
        const id: string = "courses";
        let response: string[];
        const id0: string = "notExist";

        try {
            response = await insightFacade.addDataset(id, datasets[id0], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    it("add dataset fails7", async () => {
        const id: string = "courses";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    it("dataset kind is null", async () => {
        const id: string = "courses";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], null);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    it("dataset kind is undefined", async () => {
        const id: string = "courses";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], undefined);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    it("add dataset fails", async () => {
        const id: string = "courses";
        let response: string[];
        const id0: string = "empty";

        try {
            response = await insightFacade.addDataset(id, datasets[id0], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    it("add dataset fails", async () => {
        const id: string = "content1";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    it("add dataset fails", async () => {
        const id: string = "content2";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    it("add dataset fails", async () => {
        const id: string = "content3";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // it("add dataset fails", async () => {
    //     const id: string = "content4";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    // it("add dataset fails", async () => {
    //     const id: string = "content5";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    it("add dataset fails", async () => {
        const id: string = "content6";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // it("add a valid file with a folder", async () => {
    //     const id: string = "folderInZip";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.deep.equal([id]);
    //     }
    // });
    it("folder in zip invalid", async () => {
        const id: string = "folderInZipInvalid";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // it("folder in zip invalid1", async () => {
    //     const id: string = "invalid1";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    // it("folder in zip invalid2", async () => {
    //     const id: string = "invalid2";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    it("Should remove validCourses2", async () => {
        const id: string = "validCourses2";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
        }
    });
    it("Should remove courses", async () => {
        const id: string = "courses";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
        }
    });
    it("Should remove rooms", async () => {
        const id: string = "rooms";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
        }
    });
});

// This test suite dynamically generates tests from the JSON files in test/queries.
// You should not need to modify it; instead, add additional files to the queries directory.
describe("InsightFacade PerformQuery", () => {
    // this.timeout(10000);
    const datasetsToQuery: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        validCourses1: "./test/data/validCourses1.zip",
        rooms: "./test/data/rooms.zip",
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Create a new instance of InsightFacade, read in the test queries from test/queries and
    // add the datasets specified in datasetsToQuery.
    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = await TestUtil.readTestQueries();
            expect(testQueries).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${JSON.stringify(err)}`);
        }

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Fail if there is a problem reading ANY dataset.
        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToQuery)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return { [Object.keys(datasetsToQuery)[i]]: buf.toString("base64") };
            });
            expect(loadedDatasets).to.have.length.greaterThan(0);

            const responsePromises: Array<Promise<string[]>> = [];
            const datasets: { [id: string]: string } = Object.assign({}, ...loadedDatasets);
            for (const [id, content] of Object.entries(datasets)) {
                responsePromises.push(insightFacade.addDataset(id, content, InsightDatasetKind.Courses));
            }

            // This try/catch is a hack to let your dynamic tests execute even if the addDataset method fails.
            // In D1, you should remove this try/catch to ensure your datasets load successfully before trying
            // to run you queries.
            try {
                const responses: string[][] = await Promise.all(responsePromises);
                responses.forEach((response) => expect(response).to.be.an("array"));
            } catch (err) {
                Log.warn(`Ignoring addDataset errors. For D1, you should allow errors to fail the Before All hook.`);
            }
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    it("Should run test queries", () => {
        describe("Dynamic InsightFacade PerformQuery tests", () => {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, async () => {
                    let response: any[];

                    try {
                        response = await insightFacade.performQuery(test.query);
                    } catch (err) {
                        response = err;
                    } finally {
                        if (test.isQueryValid) {
                            expect(response).to.deep.equal(test.result);
                        } else {
                            expect(response).to.be.instanceOf(InsightError);
                        }
                    }
                });
            }
        });
    });
});
