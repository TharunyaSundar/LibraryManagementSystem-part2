import * as mongo from "mongodb";

import { Errors } from "cs544-js-utils";

import * as Lib from "./library.js";

//TODO: define any DB specific types if necessary

export async function makeLibraryDao(dbUrl: string) {
  return await LibraryDao.make(dbUrl);
}

//options for new MongoClient()
const MONGO_OPTIONS = {
  ignoreUndefined: true, //ignore undefined fields in queries
};

export class LibraryDao {
  private db: mongo.Db; //mongo db instance
  private client: mongo.MongoClient; //client instance

  private booksCollection: mongo.Collection;
  private patronsCollection: mongo.Collection;
  private loansCollection: mongo.Collection;
  //called by below static make() factory function with
  //parameters to be cached in this instance.
  constructor(db: mongo.Db, client: mongo.MongoClient) {
    this.db = db;
    this.client = client;
    this.booksCollection = db.collection("books");
    this.patronsCollection = db.collection("patrons");
    this.loansCollection = db.collection("loans");
  }

  public getBooksCollection(): mongo.Collection {
    return this.booksCollection;
  }

  // Getter for patronsCollection
  public getPatronsCollection(): mongo.Collection {
    return this.patronsCollection;
  }

  // Getter for loansCollection
  public getLoansCollection(): mongo.Collection {
    return this.loansCollection;
  }
  // Clear all collections
  async clear(): Promise<Errors.Result<void>> {
    try {
      await this.booksCollection.deleteMany({});
      await this.patronsCollection.deleteMany({}); // Fixed typo here
      await this.loansCollection.deleteMany({});

      return new Errors.OkResult(undefined); // Adjust based on constructor requirements
    } catch (error) {
      return new Errors.ErrResult(error.message);
    }
  }

  //static factory function; should do all async operations like
  //getting a connection and creating indexing.  Finally, it
  //should use the constructor to return an instance of this class.
  //returns error code DB on database errors.
  static async make(dbUrl: string): Promise<Errors.Result<LibraryDao>> {
    try {
      const client = new mongo.MongoClient(dbUrl, MONGO_OPTIONS);
      await client.connect();
      const db = client.db();
      return Errors.okResult(new LibraryDao(db, client));
    } catch (error) {
      return Errors.errResult(error.message, "DB");
    }
  }

  /** close off this DAO; implementing object is invalid after
   *  call to close()
   *
   *  Error Codes:
   *    DB: a database error was encountered.
   */
  async close(): Promise<Errors.Result<void>> {
    try {
      await this.client.close();
      return new Errors.OkResult(undefined);
    } catch (error) {
      return Errors.errResult(
        `Failed to close the database connection: ${error.message}`,
        "DB"
      );
    }
  }

  //add methods as per your API
} //class LibDao
