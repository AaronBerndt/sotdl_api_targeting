import { MongoClient } from "mongodb";

let cachedDb = null;

const uri = process.env.MONGO_URI;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(uri, { useNewUrlParser: true });

  const db = client.db("sotdl");

  cachedDb = db;
  return db;
}

export async function fetchCollection(collectionName: string) {
  try {
    if (uri === undefined) {
      throw "URI is undefined";
    }

    const database = await connectToDatabase();
    const collection = database.collection(collectionName);
    const data = await collection.find({}).toArray();

    return data;
  } catch (e) {
    throw e;
  }
}

export async function insertIntoCollection(
  collectionName: string,
  newDocument: any
) {
  try {
    if (uri === undefined) {
      throw "URI is undefined";
    }

    const database = await connectToDatabase();
    const collection = database.collection(collectionName);
    await collection.insertOne(newDocument);

    return { message: `Sucessfully Added new Document into ${collection}` };
  } catch (e) {
    throw e;
  }
}
