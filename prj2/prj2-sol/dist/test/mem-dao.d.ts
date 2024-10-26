import { LibraryDao } from '../lib/library-dao.js';
import { Errors } from 'cs544-js-utils';
import { MongoMemoryServer } from 'mongodb-memory-server';
export declare function makeMemDao(): Promise<Errors.Result<MemDao>>;
export declare class MemDao {
    private readonly server;
    readonly dao: LibraryDao;
    constructor(server: MongoMemoryServer, dao: LibraryDao);
    tearDown(): Promise<void>;
}
//# sourceMappingURL=mem-dao.d.ts.map