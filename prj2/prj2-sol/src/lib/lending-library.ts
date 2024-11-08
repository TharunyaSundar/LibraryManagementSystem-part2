import { Errors } from "cs544-js-utils";
import * as mongo from "mongodb";
import { zodToResult } from "./zod-utils.js";
import { Book } from "./library.js";
import { Find } from "./library.js";

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

export function makeLendingLibrary(dao: LibraryDao) {
  return new LendingLibrary(dao);
}

export class LendingLibrary {
  private booksCollection: mongo.Collection;
  private patronsCollection: mongo.Collection;
  private loansCollection: mongo.Collection;

  constructor(private readonly dao: LibraryDao) {
    this.booksCollection = dao.getBooksCollection();
    this.patronsCollection = dao.getPatronsCollection();
    this.loansCollection = dao.getLoansCollection();
  }

  /** clear out underlying db */
  async clear(): Promise<Errors.Result<void>> {
    try {
      await this.booksCollection.deleteMany({});
      await this.patronsCollection.deleteMany({});
      await this.loansCollection.deleteMany({});

      return new Errors.OkResult(undefined);
    } catch (error) {
      return Errors.errResult(
        `Failed to clear the database: ${error.message}`,
        "DB"
      );
    }
  }

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
  async addBook(req: Record<string, any>): Promise<Errors.Result<Lib.XBook>> {
    const validationResult = Book.safeParse(req);

    if (!validationResult.success) {
      return zodToResult(validationResult, {
        "msg.isbn": 'isbn must be of the form "ddd-ddd-ddd-d"',
        "msg.nonEmpty": "must be non-empty",
        "msg.oneOrMoreAuthors": "must have one or more authors",
        "msg.publishYear": `must be a past year on or after 1448`,
      });
    }

    const book = validationResult.data;
    const nCopies = book.nCopies || 1;

    try {
      const existingBook = await this.dao.getBooksCollection().findOne({
        isbn: book.isbn,
      });

      if (existingBook) {
        // Validate that the existing book details match the new book details
        if (
          existingBook.title !== book.title ||
          existingBook.authors.toString() !== book.authors.toString() ||
          existingBook.year !== book.year ||
          existingBook.publisher !== book.publisher
        ) {
          return Errors.errResult(
            "Inconsistent book data: The existing book data does not match the provided details.",
            "BAD_REQ"
          );
        }
        // Update the number of copies for an existing book
        await this.dao
          .getBooksCollection()
          .updateOne({ isbn: book.isbn }, { $inc: { nCopies } });
      } else {
        // If the book does not exist, insert it with the given number of copies
        await this.dao.getBooksCollection().insertOne({
          ...book,
          nCopies,
        });
      }

      // Return the added or updated book details
      return Errors.okResult(book);
    } catch (error) {
      return Errors.errResult(
        `Failed to add the book to the library: ${error.message}`,
        "DB"
      );
    }
  }

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
  async findBooks(
    req: Record<string, any>
  ): Promise<Errors.Result<Lib.XBook[]>> {
    const validationResult = Lib.Find.safeParse(req);
    if (!validationResult.success) {
      return zodToResult(validationResult, {
        "msg.nonEmpty": "Search must contain at least one word",
        "msg.indexCount": "Index and count must be non-negative integers",
      }) as Errors.Result<Lib.XBook[]>;
    }

    const { search, index = 0, count = DEFAULT_COUNT } = validationResult.data;

    const searchWords = search.match(/\w{2,}/g);
    if (!searchWords || searchWords.length === 0) {
      return Errors.errResult("No valid words in search", "BAD_REQ");
    }

    const searchConditions = searchWords.map((word) => ({
      $or: [
        { title: { $regex: new RegExp(word, "i") } },
        { authors: { $regex: new RegExp(word, "i") } },
      ],
    }));

    try {
      const books = await this.booksCollection
        .find({ $and: searchConditions })
        .sort({ title: 1 })
        .skip(index)
        .limit(count)
        .toArray();

      // Remove `_id` field from the results
      const sanitizedBooks = books.map(({ _id, ...rest }) => rest);

      return Errors.okResult(sanitizedBooks as Lib.XBook[]);
    } catch (error) {
      return Errors.errResult(
        `Failed to retrieve books: ${error.message}`,
        "DB"
      ) as Errors.Result<Lib.XBook[]>;
    }
  }

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
  async checkoutBook(req: Record<string, any>): Promise<Errors.Result<void>> {
    const { patronId, isbn } = req;

    if (!patronId || typeof patronId !== "string") {
      return Errors.errResult("Missing or invalid patronId", "MISSING");
    }
    if (!isbn || typeof isbn !== "string") {
      return Errors.errResult("Missing or invalid isbn", "MISSING");
    }

    try {
      // Check if the book exists
      const book = await this.booksCollection.findOne({ isbn });
      if (!book) {
        return Errors.errResult(
          "The book does not exist in the library",
          "BAD_REQ"
        );
      }

      // Check if there are copies available for checkout
      if (book.nCopies <= 0) {
        return Errors.errResult(
          "No copies of the book are available for checkout",
          "BAD_REQ"
        );
      }

      // Check if the patron already has the book checked out
      const existingLoan = await this.loansCollection.findOne({
        patronId,
        isbn,
      });
      if (existingLoan) {
        return Errors.errResult(
          "The patron already has this book checked out",
          "BAD_REQ"
        );
      }
      // Proceed to check out the book
      await this.loansCollection.insertOne({
        patronId,
        isbn,
        checkedOutAt: new Date(),
      });

      // Decrement the number of copies in the books collection
      await this.booksCollection.updateOne({ isbn }, { $inc: { nCopies: -1 } });
      return Errors.okResult(undefined);
    } catch (error) {
      return Errors.errResult(
        `Failed to check out the book: ${error.message}`,
        "DB"
      );
    }
  }

  /** Set up patron req.patronId to returns book req.isbn.
   *
   *  Errors:
   *    MISSING: patronId or isbn field is missing
   *    BAD_TYPE: patronId or isbn field is not a string.
   *    BAD_REQ: invalid isbn or error on business rule violation like
   *    isbn does not specify a book in the library or there is
   *    no checkout of the book by patronId.
   */
  async returnBook(req: Record<string, any>): Promise<Errors.Result<void>> {
    const { patronId, isbn } = req;

    if (!patronId || typeof patronId !== "string") {
      return Errors.errResult("Missing or invalid patronId", "MISSING");
    }

    if (!isbn || typeof isbn !== "string") {
      return Errors.errResult("Missing or invalid isbn", "MISSING");
    }

    try {
      // Check if the book exists
      const book = await this.booksCollection.findOne({ isbn });
      if (!book) {
        return Errors.errResult(
          "The book does not exist in the library",
          "BAD_REQ"
        );
      }

      // Check if the patron has the book checked out
      const loan = await this.loansCollection.findOne({ patronId, isbn });
      if (!loan) {
        return Errors.errResult(
          "The patron does not have this book checked out",
          "BAD_REQ"
        );
      }
      // Proceed to return the book
      await this.loansCollection.deleteOne({ patronId, isbn });

      // Increment the number of copies in the books collection
      await this.booksCollection.updateOne({ isbn }, { $inc: { nCopies: 1 } });

      return Errors.okResult(undefined);
    } catch (error) {
      return Errors.errResult("TODO");
    }

    //add class code as needed
  }
}

// default count for find requests
const DEFAULT_COUNT = 5;

//add file level code as needed

/********************** Domain Utility Functions ***********************/

/** return a field where book0 and book1 differ; return undefined if
 *  there is no such field.
 */
function compareBook(book0: Lib.Book, book1: Lib.Book): string | undefined {
  if (book0.title !== book1.title) return "title";
  if (book0.authors.some((a, i) => a !== book1.authors[i])) return "authors";
  if (book0.pages !== book1.pages) return "pages";
  if (book0.year !== book1.year) return "year";
  if (book0.publisher !== book1.publisher) return "publisher";
}
