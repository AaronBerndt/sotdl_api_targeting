import { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchCollection, insertIntoCollection } from "../utilities/MongoUtils";

export default async (request: VercelRequest, response: VercelResponse) => {
  try {
    const { documents } = request.query;
    const data = await insertIntoCollection("ancestries", documents);
    response.status(200).send(documents);
  } catch (e) {
    response.status(504).send(e);
  }
};
