import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

export async function fetchCollection(collectionName: string) {
  try {
    await client.connect();
    const database = client.db("sotdl");
    const collection = database.collection(collectionName);

    return collection;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
