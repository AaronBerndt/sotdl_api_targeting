import axios from "axios";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { UPDATE_CHARACTER_HEALTH_URL } from "../utilities/api.config";
import microCors from "micro-cors";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }
    const { healerId, targets, healingFactor } = request.body.data;

    const { data: healerData } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/characters?_id=${healerId}`
    );

    const data = await Promise.all(
      targets.map(async (target: { id: string; type: string }) => {
        const { data } = await axios(
          `https://sotdl-api-fetch.vercel.app/api/characters?_id=${target.id}`
        );

        const { HealingRate } = data.characteristics;

        const healthChangeAmount = HealingRate * healingFactor;

        await axios.post(UPDATE_CHARACTER_HEALTH_URL, {
          data: { healthChangeAmount: -healthChangeAmount, _id: target },
        });

        return {
          healer: healerData.name,
          name: data.name,
          healedAmount: healthChangeAmount,
        };
      })
    );

    response.status(200).send(data);
  } catch (e) {
    console.log(e);
    response.status(504).send(e);
  }
};

export default cors(handler);
