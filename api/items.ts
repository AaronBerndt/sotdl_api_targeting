import { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchCollection } from "../utilities/MongoUtils";
import microCors from "micro-cors";
const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    const data = await fetchCollection("items");
    response.status(200).send(data);
  } catch (e) {
    response.status(504).send(e);
  }
};
export default cors(handler);
