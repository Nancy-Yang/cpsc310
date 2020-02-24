import Server from "../src/rest/Server";
import { expect } from "chai";
import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");

import chaiHttp = require("chai-http");
import Log from "../src/Util";
import * as fs from "fs";

describe("Facade D3", function () {
    this.timeout(100000);
    // source: https://stackoverflow.com/questions/18052762/remove-directory-which-is-not-empty
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
    let facade: InsightFacade = null;
    let server: Server = null;
    let query = {
        WHERE: {
            GT: {
                courses_avg: 98.5
            }
        },
        OPTIONS: {
            COLUMNS: [
                "courses_dept",
                "courses_uuid",
                "courses_pass",
                "courses_avg"
            ],
            ORDER: {
                dir: "DOWN",
                keys: [
                    "courses_avg",
                    "courses_uuid"
                ]
            }
        }
    };
    let query1 = {};
    let query2 = {
        WHERE: {
            GT: {
                courses_avg: 98.5
            }
        }};

    chai.use(chaiHttp);

    before(function () {
        deleteFolderRecursive("./data");
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        try {
            server.start();
        } catch (e) {
            Log.trace("did not start");
        }
    });

    after(function () {
        // TODO: stop server here once!
        server.stop();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });
    // TODO: read your courses and rooms datasets here once!

    it("PUT test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .attach("body", fs.readFileSync("./test/data/courses.zip"), "courses.zip")
                .then(function (res: any) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!\
                    Log.trace("reject erro");
                    expect.fail();
                });
        } catch (err) {
            Log.trace("all try erro");
            // and some more logging here!
        }
    });
    it("PUT test for rooms dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/rooms/rooms")
                .attach("body", fs.readFileSync("./test/data/rooms.zip"), "rooms.zip")
                .then(function (res: any) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!\
                    Log.trace("reject erro");
                    expect.fail();
                });
        } catch (err) {
            Log.trace("all try erro");
            // and some more logging here!
        }
    });
    it("PUT Invalid courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .attach("body", fs.readFileSync("./test/data/badCourses.zip"), "./test/data/badCourses.zip")
                .then(function (res: any) {
                    // empty
                })
                .catch(function (res: any) {
                    expect(res.status).to.be.equal(400);
                });
        } catch (e) {
            Log.trace("all try erro");
        }

    });
    // TODO: Post test
    it("POST test correct", function () {
        try {
            return chai.request("http://localhost:4321")
                .post("/query")
                .send(query)
                .then(function (res: any) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(err.toString());
            expect.fail();
        }
    });
    it("POST with Empty query", function () {
        try {
            return chai.request("http://localhost:4321")
                .post("/query")
                .send(query1)
                .then(function (res: any) {
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(err.toString());
            expect.fail();
        }
    });
    it("POST with invalid query", function () {
        try {
            return chai.request("http://localhost:4321")
                .post("/query")
                .send(query2)
                .then(function (res: any) {
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(err.toString());
            expect.fail();
        }
    });
    // TODO: GET TEST
    it("GET test for dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/datasets")
                .then(function (res: any) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(err.toString());
            expect.fail();
        }
    });
    it("Delete test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/courses")
                .then(function (res: any) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(err.toString());
            expect.fail();
        }
    });
    it("Delete test for rooms dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/rooms")
                .then(function (res: any) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(err.toString());
            expect.fail();
        }
    });
    it("Delete with notFound id", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/rooms")
                .then(function (res: any) {
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(err.toString());
            expect.fail();
        }
    });
    // TODO: Question-if id is null? what kind of erro
    it("Delete with null id", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/")
                .then(function (res: any) {
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(err.toString());
            expect.fail();
        }
    });
    it("Delete with wrong path id", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/" + null)
                .then(function (res: any) {
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(err.toString());
            expect.fail();
        }
    });
    it("again PUT test for rooms dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/rooms/rooms")
                .attach("body", fs.readFileSync("./test/data/rooms.zip"), "rooms.zip")
                .then(function (res: any) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!\
                    Log.trace("reject erro");
                    expect.fail();
                });
        } catch (err) {
            Log.trace("all try erro");
            // and some more logging here!
        }
    });
    it("Delete test for rooms dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/rooms")
                .then(function (res: any) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(err.toString());
            expect.fail();
        }
    });
    it("PUT test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .attach("body", fs.readFileSync("./test/data/courses.zip"), "courses.zip")
                .then(function (res: any) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!\
                    Log.trace("reject erro");
                    expect.fail();
                });
        } catch (err) {
            Log.trace("all try erro");
            // and some more logging here!
        }
    });
    it("PUT test for rooms dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/rooms/rooms")
                .attach("body", fs.readFileSync("./test/data/rooms.zip"), "rooms.zip")
                .then(function (res: any) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!\
                    Log.trace("reject erro");
                    expect.fail();
                });
        } catch (err) {
            Log.trace("all try erro");
            // and some more logging here!
        }
    });
    it("PUT test for validCourses1 dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/validCourses1/courses")
                .attach("body", fs.readFileSync("./test/data/validCourses1.zip"), "validCourses1.zip")
                .then(function (res: any) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!\
                    Log.trace("reject erro");
                    expect.fail();
                });
        } catch (err) {
            Log.trace("all try erro");
            // and some more logging here!
        }
    });
    // Hint on how to test PUT requests
    /*
    it("PUT test for courses dataset", function () {
        try {
            return chai.request(URL)
                .put(YOUR_PUT_URL)
                .attach("body", YOUR_COURSES_DATASET, COURSES_ZIP_FILENAME)
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });
    */

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
    it("Echo test", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/echo/:msg")
                .then(function (res: any) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            Log.trace(err.toString());
            expect.fail();
        }
    });

    it("Echo erro test", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/echo/")
                .then(function (res: any) {
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(err.toString());
            expect.fail();
        }
    });
    it("given get test", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/")
                .then(function (res: any) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            Log.trace(err.toString());
            expect.fail();
        }
    });
    it("given get erro test", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/1")
                .then(function (res: any) {
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(500);
                });
        } catch (err) {
            Log.trace(err.toString());
            expect.fail();
        }
    });

});
