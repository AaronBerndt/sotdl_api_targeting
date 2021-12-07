import axios from "axios";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { insertIntoCollection } from "../utilities/MongoUtils";
import { UPDATE_CHARACTER_HEALTH_URL } from "../utilities/api.config";
import microCors from "micro-cors";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }
    const { targetArray, abilityName, healingFactor } = request.body.data;

    await Promise.all(
      targetArray.map(async (target) => {
        const { data } = await axios(
          `https://sotdl-api-fetch.vercel.app/api/characters?_id=${target}`
        );

        const { HealingRate } = data.characteristic;

        const healthChangeAmount = HealingRate * healingFactor;

        await axios.post(UPDATE_CHARACTER_HEALTH_URL, {
          data: { healthChangeAmount, _id: target },
        });
      })
    );

    response.status(200).send("Made attack against Targets");
  } catch (e) {
    response.status(504).send(e);
  }
};

export default cors(handler);
