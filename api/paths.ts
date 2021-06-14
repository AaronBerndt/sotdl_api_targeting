import { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchCollection } from "../utilities/MongoUtils";

export default async (request: VercelRequest, response: VercelResponse) => {
  try {
    const data = await fetchCollection("paths");
    response.status(200).send(data);
  } catch (e) {
    response.status(504).send(e);
  }
};
