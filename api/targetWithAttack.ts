import { VercelRequest, VercelResponse } from "@vercel/node";
import { insertIntoCollection } from "../utilities/MongoUtils";
import microCors from "micro-cors";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }
    const { targetArray, abilityName } = request.body.data;

    response.status(200).send("Made attack against Targets");
  } catch (e) {
    response.status(504).send(e);
  }
};

export default cors(handler);
