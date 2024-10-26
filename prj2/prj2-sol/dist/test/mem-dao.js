import { makeLibraryDao, } from '../lib/library-dao.js';
import { Errors } from 'cs544-js-utils';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { assert } from 'chai';
export async function makeMemDao() {
    const server = await MongoMemoryServer.create();
    assert(server.instanceInfo, `mongo memory server startup failed`);
    const uri = server.getUri();
    const daoResult = await makeLibraryDao(uri);
    if (!daoResult.isOk)
        return daoResult;
    const dao = daoResult.val;
    return Errors.okResult(new MemDao(server, dao));
}
export class MemDao {
    server;
    dao;
    constructor(server, dao) {
        this.server = server;
        this.dao = dao;
    }
    async tearDown() {
        await this.dao.close();
        await this.server.stop();
        assert.equal(this.server.instanceInfo, undefined, `mongo memory server stop failed`);
    }
}
//# sourceMappingURL=mem-dao.js.map