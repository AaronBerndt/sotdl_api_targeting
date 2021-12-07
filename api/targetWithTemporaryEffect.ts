import axios from "axios";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { UPDATE_TEMPORARYEFFECTS_URL } from "../utilities/api.config";
import microCors from "micro-cors";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }
    const {
      temporaryEffectGiverId,
      targets,
      temporaryEffectName,
    } = request.body.data;

    const { data: temporaryEffectGiverData } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/characters?_id=${temporaryEffectGiverId}`
    );

    const data = await Promise.all(
      targets.map(async (target: string) => {
        const { data } = await axios(
          `https://sotdl-api-fetch.vercel.app/api/characters?_id=${target}`
        );

        await axios.post(UPDATE_TEMPORARYEFFECTS_URL, {
          temporaryEffect: temporaryEffectName,
          action: "add",
          _id: target,
        });

        return {
          giver: temporaryEffectGiverData.name,
          name: data.name,
          temporaryEffectAdd: temporaryEffectName,
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
