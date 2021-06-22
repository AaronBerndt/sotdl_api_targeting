import { VercelRequest, VercelResponse } from "@vercel/node";
import microCors from "micro-cors";
import { fetchCollection } from "../utilities/MongoUtils";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    const data = await fetchCollection("spells");
    response.status(200).send(data);
  } catch (e) {
    response.status(504).send(e);
  }
};

export default cors(handler);
