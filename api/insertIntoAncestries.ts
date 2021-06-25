import { VercelRequest, VercelResponse } from "@vercel/node";
import { insertIntoCollection } from "../utilities/MongoUtils";

export default async (request: VercelRequest, response: VercelResponse) => {
  try {
    const { documents } = request.body;
    const data = await insertIntoCollection("ancestries", documents);
    response.status(200).send(data);
  } catch (e) {
    response.status(504).send(e);
  }
};
