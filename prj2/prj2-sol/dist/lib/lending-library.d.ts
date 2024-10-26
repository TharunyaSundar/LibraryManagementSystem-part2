import { Errors } from "cs544-js-utils";
import { LibraryDao } from "./library-dao.js";
import * as Lib from "./library.js";
/** Note that errors are documented using the `code` option which must be
 *  returned (the `message` can be any suitable string which describes
 *  the error as specifically as possible).  Whenever possible, the
 *  error should also contain a `widget` option specifying the widget
 *  responsible for the error).
 *
 *  Note also that the underlying DAO should not normally require a
 *  sequential scan over all books or patrons.
 */
/************************ Main Implementation **************************/
export declare function makeLendingLibrary(dao: LibraryDao): LendingLibrary;
export declare class LendingLibrary {
    private readonly dao;
    private booksCollection;
    private patronsCollection;
    private loansCollection;
    constructor(dao: LibraryDao);
    /** clear out underlying db */
    clear(): Promise<Errors.Result<void>>;
    /** Add one-or-more copies of book represented by req to this library.
     *  If the book is already in the library and consistent with the book
     *  being added, then the nCopies of the book is simply updated by
     *  the nCopies of the object being added (default 1).
     *
     *  Errors:
     *    MISSING: one-or-more of the required fields is missing.
     *    BAD_TYPE: one-or-more fields have the incorrect type.
     *    BAD_REQ: other issues, like:
     *      "nCopies" or "pages" not a positive integer.
     *      "year" is not integer in range [1448, currentYear]
     *      "isbn" is not in ISBN-10 format of the form ddd-ddd-ddd-d
     *      "title" or "publisher" field is empty.
     *      "authors" array is empty or contains an empty author
     *      book is already in library but data in req is
     *      inconsistent with the data already present.
     */
    addBook(req: Record<string, any>): Promise<Errors.Result<Lib.XBook>>;
    /** Return all books whose authors and title fields contain all
     *  "words" in req.search, where a "word" is a max sequence of /\w/
     *  of length > 1.  Note that word matching must be case-insensitive,
     *  but can depend on any stemming rules of the underlying database.
     *
     *  The req can optionally contain non-negative integer fields
     *  index (default 0) and count (default DEFAULT_COUNT).  The
     *  returned results are a slice of the sorted results from
     *  [index, index + count).  Note that this slicing *must* be
     *  performed by the database.
     *
     *  Returned books should be sorted in ascending order by title.
     *  If no books match the search criteria, then [] should be returned.
     *
     *  Errors:
     *    MISSING: search field is missing
     *    BAD_TYPE: search field is not a string or index/count are not numbers.
     *    BAD_REQ: no words in search, index/count not int or negative.
     */
    findBooks(req: Record<string, any>): Promise<Errors.Result<Lib.XBook[]>>;
    /** Set up patron req.patronId to check out book req.isbn.
     *
     *  Errors:
     *    MISSING: patronId or isbn field is missing
     *    BAD_TYPE: patronId or isbn field is not a string.
     *    BAD_REQ: invalid isbn or error on business rule violation, like:
     *      isbn does not specify a book in the library
     *      no copies of the book are available for checkout
     *      patron already has a copy of the same book checked out
     */
    checkoutBook(req: Record<string, any>): Promise<Errors.Result<void>>;
    /** Set up patron req.patronId to returns book req.isbn.
     *
     *  Errors:
     *    MISSING: patronId or isbn field is missing
     *    BAD_TYPE: patronId or isbn field is not a string.
     *    BAD_REQ: invalid isbn or error on business rule violation like
     *    isbn does not specify a book in the library or there is
     *    no checkout of the book by patronId.
     */
    returnBook(req: Record<string, any>): Promise<Errors.Result<void>>;
}
//# sourceMappingURL=lending-library.d.ts.map