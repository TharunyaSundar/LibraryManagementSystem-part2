import * as mongo from "mongodb";
import { Errors } from "cs544-js-utils";
export declare function makeLibraryDao(dbUrl: string): Promise<Errors.Result<LibraryDao>>;
export declare class LibraryDao {
    private db;
    private client;
    private booksCollection;
    private patronsCollection;
    private loansCollection;
    constructor(db: mongo.Db, client: mongo.MongoClient);
    getBooksCollection(): mongo.Collection;
    getPatronsCollection(): mongo.Collection;
    getLoansCollection(): mongo.Collection;
    clear(): Promise<Errors.Result<void>>;
    static make(dbUrl: string): Promise<Errors.Result<LibraryDao>>;
    /** close off this DAO; implementing object is invalid after
     *  call to close()
     *
     *  Error Codes:
     *    DB: a database error was encountered.
     */
    close(): Promise<Errors.Result<void>>;
}
//# sourceMappingURL=library-dao.d.ts.map