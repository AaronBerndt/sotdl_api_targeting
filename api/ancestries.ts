import { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchCollection } from "../utilities/MongoUtils";

export default async (request: VercelRequest, response: VercelResponse) => {
  const data = await fetchCollection("ancestries");
  console.log(data);
  response.status(200).send(data);
};
