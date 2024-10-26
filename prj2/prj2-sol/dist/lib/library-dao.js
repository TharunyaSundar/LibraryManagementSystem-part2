import * as mongo from "mongodb";
import { Errors } from "cs544-js-utils";
//TODO: define any DB specific types if necessary
export async function makeLibraryDao(dbUrl) {
    return await LibraryDao.make(dbUrl);
}
//options for new MongoClient()
const MONGO_OPTIONS = {
    ignoreUndefined: true, //ignore undefined fields in queries
};
export class LibraryDao {
    db; //mongo db instance
    client; //client instance
    booksCollection;
    patronsCollection;
    loansCollection;
    //called by below static make() factory function with
    //parameters to be cached in this instance.
    constructor(db, client) {
        this.db = db;
        this.client = client;
        this.booksCollection = db.collection("books");
        this.patronsCollection = db.collection("patrons");
        this.loansCollection = db.collection("loans");
    }
    getBooksCollection() {
        return this.booksCollection;
    }
    // Getter for patronsCollection
    getPatronsCollection() {
        return this.patronsCollection;
    }
    // Getter for loansCollection
    getLoansCollection() {
        return this.loansCollection;
    }
    // Clear all collections
    async clear() {
        try {
            await this.booksCollection.deleteMany({});
            await this.patronsCollection.deleteMany({}); // Fixed typo here
            await this.loansCollection.deleteMany({});
            return new Errors.OkResult(undefined); // Adjust based on constructor requirements
        }
        catch (error) {
            return new Errors.ErrResult(error.message);
        }
    }
    //static factory function; should do all async operations like
    //getting a connection and creating indexing.  Finally, it
    //should use the constructor to return an instance of this class.
    //returns error code DB on database errors.
    static async make(dbUrl) {
        try {
            const client = new mongo.MongoClient(dbUrl, MONGO_OPTIONS);
            await client.connect();
            const db = client.db();
            return Errors.okResult(new LibraryDao(db, client));
        }
        catch (error) {
            return Errors.errResult(error.message, "DB");
        }
    }
    /** close off this DAO; implementing object is invalid after
     *  call to close()
     *
     *  Error Codes:
     *    DB: a database error was encountered.
     */
    async close() {
        try {
            await this.client.close();
            return new Errors.OkResult(undefined);
        }
        catch (error) {
            return Errors.errResult(`Failed to close the database connection: ${error.message}`, "DB");
        }
    }
} //class LibDao
//# sourceMappingURL=library-dao.js.map