"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHackathonsCollection = void 0;
const mongodb_1 = require("mongodb");
const DATABASE_NAME = process.env.MONGODB_DATABASE_NAME?.trim() || 'hackathon-opportunity-research';
const HACKATHONS_COLLECTION = process.env.MONGODB_COLLECTION_NAME?.trim() || 'hackathons';
let client = null;
const getMongoClient = async () => {
    if (client) {
        return client;
    }
    const connectionString = process.env.MONGODB_CONNECTION_STRING?.trim();
    if (!connectionString) {
        throw new Error('MongoDB is not configured. Set MONGODB_CONNECTION_STRING in the scraper .env file.');
    }
    client = new mongodb_1.MongoClient(connectionString);
    await client.connect();
    return client;
};
const getHackathonsCollection = async () => {
    const mongoClient = await getMongoClient();
    return mongoClient
        .db(DATABASE_NAME)
        .collection(HACKATHONS_COLLECTION);
};
exports.getHackathonsCollection = getHackathonsCollection;
