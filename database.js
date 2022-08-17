const { MongoClient } = require("mongodb");

class Database {

    /**
     * Class constructor
     */
    constructor(collection = 'imobiliare') {
        this.db = process.env.MONGODB_DB;
        this.collection = collection;
        this.mongodb_url = "mongodb://" + process.env.MONGODB_USER + ":" + process.env.MONGODB_PASS + "@" + 
                            process.env.MONGODB_IP + ":" + process.env.MONGODB_PORT + "/";
    }

    /**
     * Inserts multiple rows in database
     * 
     * @param data
     * @param options
     */
    async insertMany(data = [], options = {}) {
        let client = new MongoClient(this.mongodb_url);
        await client.connect();
        const database = client.db(this.db);
        const collection = database.collection(this.collection);
    
        await collection.insertMany(data, options);
    }
}

module.exports = Database;