"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = require("../src/rest/Server");
const chai_1 = require("chai");
const InsightFacade_1 = require("../src/controller/InsightFacade");
const chai = require("chai");
const chaiHttp = require("chai-http");
const Util_1 = require("../src/Util");
const fs = require("fs");
describe("Facade D3", function () {
    this.timeout(100000);
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
    let facade = null;
    let server = null;
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
        }
    };
    chai.use(chaiHttp);
    before(function () {
        deleteFolderRecursive("./data");
        facade = new InsightFacade_1.default();
        server = new Server_1.default(4321);
        try {
            server.start();
        }
        catch (e) {
            Util_1.default.trace("did not start");
        }
    });
    after(function () {
        server.stop();
    });
    beforeEach(function () {
    });
    afterEach(function () {
    });
    it("PUT test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .attach("body", fs.readFileSync("./test/data/courses.zip"), "courses.zip")
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                Util_1.default.trace("reject erro");
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace("all try erro");
        }
    });
    it("PUT test for rooms dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/rooms/rooms")
                .attach("body", fs.readFileSync("./test/data/rooms.zip"), "rooms.zip")
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                Util_1.default.trace("reject erro");
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace("all try erro");
        }
    });
    it("PUT Invalid courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .attach("body", fs.readFileSync("./test/data/badCourses.zip"), "./test/data/badCourses.zip")
                .then(function (res) {
            })
                .catch(function (res) {
                chai_1.expect(res.status).to.be.equal(400);
            });
        }
        catch (e) {
            Util_1.default.trace("all try erro");
        }
    });
    it("POST test correct", function () {
        try {
            return chai.request("http://localhost:4321")
                .post("/query")
                .send(query)
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace(err.toString());
            chai_1.expect.fail();
        }
    });
    it("POST with Empty query", function () {
        try {
            return chai.request("http://localhost:4321")
                .post("/query")
                .send(query1)
                .then(function (res) {
            })
                .catch(function (err) {
                chai_1.expect(err.status).to.be.equal(400);
            });
        }
        catch (err) {
            Util_1.default.trace(err.toString());
            chai_1.expect.fail();
        }
    });
    it("POST with invalid query", function () {
        try {
            return chai.request("http://localhost:4321")
                .post("/query")
                .send(query2)
                .then(function (res) {
            })
                .catch(function (err) {
                chai_1.expect(err.status).to.be.equal(400);
            });
        }
        catch (err) {
            Util_1.default.trace(err.toString());
            chai_1.expect.fail();
        }
    });
    it("GET test for dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/datasets")
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace(err.toString());
            chai_1.expect.fail();
        }
    });
    it("Delete test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/courses")
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace(err.toString());
            chai_1.expect.fail();
        }
    });
    it("Delete test for rooms dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/rooms")
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace(err.toString());
            chai_1.expect.fail();
        }
    });
    it("Delete with notFound id", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/rooms")
                .then(function (res) {
            })
                .catch(function (err) {
                chai_1.expect(err.status).to.be.equal(404);
            });
        }
        catch (err) {
            Util_1.default.trace(err.toString());
            chai_1.expect.fail();
        }
    });
    it("Delete with null id", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/")
                .then(function (res) {
            })
                .catch(function (err) {
                chai_1.expect(err.status).to.be.equal(400);
            });
        }
        catch (err) {
            Util_1.default.trace(err.toString());
            chai_1.expect.fail();
        }
    });
    it("Delete with wrong path id", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/" + null)
                .then(function (res) {
            })
                .catch(function (err) {
                chai_1.expect(err.status).to.be.equal(404);
            });
        }
        catch (err) {
            Util_1.default.trace(err.toString());
            chai_1.expect.fail();
        }
    });
    it("again PUT test for rooms dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/rooms/rooms")
                .attach("body", fs.readFileSync("./test/data/rooms.zip"), "rooms.zip")
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                Util_1.default.trace("reject erro");
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace("all try erro");
        }
    });
    it("Delete test for rooms dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/rooms")
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace(err.toString());
            chai_1.expect.fail();
        }
    });
    it("PUT test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .attach("body", fs.readFileSync("./test/data/courses.zip"), "courses.zip")
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                Util_1.default.trace("reject erro");
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace("all try erro");
        }
    });
    it("PUT test for rooms dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/rooms/rooms")
                .attach("body", fs.readFileSync("./test/data/rooms.zip"), "rooms.zip")
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                Util_1.default.trace("reject erro");
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace("all try erro");
        }
    });
    it("PUT test for validCourses1 dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/validCourses1/courses")
                .attach("body", fs.readFileSync("./test/data/validCourses1.zip"), "validCourses1.zip")
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                Util_1.default.trace("reject erro");
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace("all try erro");
        }
    });
    it("Echo test", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/echo/:msg")
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace(err.toString());
            chai_1.expect.fail();
        }
    });
    it("Echo erro test", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/echo/")
                .then(function (res) {
            })
                .catch(function (err) {
                chai_1.expect(err.status).to.be.equal(400);
            });
        }
        catch (err) {
            Util_1.default.trace(err.toString());
            chai_1.expect.fail();
        }
    });
    it("given get test", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/")
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace(err.toString());
            chai_1.expect.fail();
        }
    });
    it("given get erro test", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/1")
                .then(function (res) {
            })
                .catch(function (err) {
                chai_1.expect(err.status).to.be.equal(500);
            });
        }
        catch (err) {
            Util_1.default.trace(err.toString());
            chai_1.expect.fail();
        }
    });
});
//# sourceMappingURL=Server.spec.js.map