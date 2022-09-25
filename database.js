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
     * Sets database operation collection
     * 
     * @param collection
     */
    setCollection(collection = 'imobiliare') {
        this.collection = collection;
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

    /**
     * Find multiple rows in database
     * 
     * @param query
     */
    async find(query) {
        let client = new MongoClient(this.mongodb_url);
        await client.connect();
        const database = client.db(this.db);
        const collection = database.collection(this.collection);
        let queryExecution = collection.find(query);
        return await queryExecution.toArray();
    }

    /**
     * Aggregate multiple rows in database
     * 
     * @param query
     */
    async aggregate(query) {
        let client = new MongoClient(this.mongodb_url);
        await client.connect();
        const database = client.db(this.db);
        const collection = database.collection(this.collection);
        let queryExecution = collection.aggregate(query);
        return await queryExecution.toArray();
    }
}

module.exports = Database;