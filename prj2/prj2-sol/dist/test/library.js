import * as Lib from "../lib/library.js";
import { BOOKS } from "./test-data.js";
import { assert, expect } from "chai";
const BOOK_1 = BOOKS[0];
describe("library types", () => {
    describe("Book validation", () => {
        it("a good book is valid", () => {
            const result = Lib.validate("addBook", BOOK_1);
            assert(result.isOk === true);
            expect(result.val).to.deep.equal(BOOK_1);
        });
        it("missing fields makes a good book invalid", () => {
            for (const field of Object.keys(BOOK_1)) {
                if (field === "nCopies")
                    continue;
                const req = { ...BOOK_1 };
                delete req[field];
                const result = Lib.validate("addBook", req);
                assert(result.isOk === false);
                expect(result.errors.length).to.be.gt(0);
            }
        });
        it("a shortened isbn is invalid", () => {
            const req = { ...BOOK_1 };
            req.isbn = req.isbn.slice(1);
            const result = Lib.validate("addBook", req);
            assert(result.isOk === false);
            expect(result.errors.length).to.be.gt(0);
        });
        it("having no authors is invalid", () => {
            const req = { ...BOOK_1 };
            delete req.authors; // Remove authors to test validation
            const result = Lib.validate("addBook", req);
            assert(result.isOk === false);
            expect(result.errors.length).to.be.gt(0);
            const errorMessages = result.errors.map((error) => error.message);
            expect(errorMessages).to.include("authors is required");
        });
        it("an empty author is invalid", () => {
            const req = { ...BOOK_1 };
            req.authors = [""];
            const result = Lib.validate("addBook", req);
            assert(result.isOk === false);
            expect(result.errors.length).to.be.gt(0);
        });
        it("badly typed fields makes a good book invalid", () => {
            const req = { ...BOOK_1 };
            req.pages = "not a number"; // Invalid type for pages
            const result = Lib.validate("addBook", req);
            assert(result.isOk === false);
            expect(result.errors.length).to.be.gt(0);
            expect(result.errors.map((err) => err.message)).to.include.members([
                "pages must have type number",
            ]);
            //req.pages = 250; // Reset pages to valid
            req.year = "not a number"; // Invalid type for year
            const resultYear = Lib.validate("addBook", req);
            assert(resultYear.isOk === false);
            expect(resultYear.errors.length).to.be.gt(0);
            expect(resultYear.errors.map((err) => err.message)).to.include.members([
                "year must have type number",
            ]);
        });
        it("empty string fields makes a good book invalid", () => {
            for (const [k, v] of Object.entries(BOOK_1)) {
                if (typeof v !== "string")
                    continue;
                const req = { ...BOOK_1, [k]: "" };
                const result = Lib.validate("addBook", req);
                assert(result.isOk === false);
                expect(result.errors.length).to.be.gt(0);
            }
        });
        it("an out of range publication year makes a book invalid", () => {
            for (const y of [1000, 3000]) {
                const req = { ...BOOK_1, year: y };
                const result = Lib.validate("addBook", req);
                assert(result.isOk === false);
                expect(result.errors.length).to.be.gt(0);
            }
        });
    });
    describe("Find validation", () => {
        it("a good search field is okay", () => {
            const req = { search: "js hints" };
            const result = Lib.validate("findBooks", req);
            assert(result.isOk === true);
        });
        it("a search without a search field is invalid", () => {
            const req = { search1: "js hi" };
            const result = Lib.validate("findBooks", req);
            assert(result.isOk === false);
            expect(result.errors.length).to.be.gt(0);
        });
        it("a search field without any words with length > 1 is invalid", () => {
            const req = { search: "j<s h.i" };
            const result = Lib.validate("findBooks", req);
            assert(result.isOk === false);
            expect(result.errors.length).to.be.gt(0);
        });
        it("a search field with bad index/count is invalid", () => {
            for (const k of ["index", "count"]) {
                for (const v of ["xx", -1]) {
                    const req = { search: "hello", [k]: v };
                    const result = Lib.validate("findBooks", req);
                    assert(result.isOk === false);
                    expect(result.errors.length).to.be.gt(0);
                }
            }
        });
    });
    describe("Lend validation", () => {
        it("a good Lend req is ok", () => {
            const req = { isbn: BOOK_1.isbn, patronId: "joe" };
            const result = Lib.validate("checkoutBook", req);
            assert(result.isOk === true);
        });
        it("a Lend req with missing fields is invalid", () => {
            const req0 = { isbn: BOOK_1.isbn, patronId: "joe" };
            for (const k of Object.keys(req0)) {
                const req = { ...req0 };
                delete req[k];
                const result = Lib.validate("returnBook", req);
                assert(result.isOk === false);
                expect(result.errors.length).to.be.gt(0);
            }
        });
        it("a Lend req with a bad isbn is invalid", () => {
            const req = { isbn: BOOK_1.isbn + "x", patronId: "joe" };
            const result = Lib.validate("checkoutBook", req);
            assert(result.isOk === false);
            expect(result.errors.length).to.be.gt(0);
        });
    });
});
//# sourceMappingURL=library.js.map