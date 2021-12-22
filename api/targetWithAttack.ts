import axios from "axios";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { UPDATE_TEMPORARYEFFECTS_URL } from "../utilities/api.config";
import { rollD20 } from "../utilities/rollDice";
import microCors from "micro-cors";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }
    const {
      attackerId,
      targets,
      attackName,
      attackType,
      attackRoll,
      attributeTarget,
    } = request.body.data;

    const { data: attackerData } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/characters?_id=${attackerId}`
    );

    const { data: currentCombat } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/combats?_id=${attackerData.activeCombat}`
    );

    console.log({
      attackerId,
      targets,
      attackName,
      attackType,
      attackRoll,
      attributeTarget,
    });
    const data = await Promise.all(
      targets.map(async (target: string, type: "monster" | "player") => {
        const { data } =
          type === "player"
            ? await axios(
                `https://sotdl-api-fetch.vercel.app/api/characters?_id=${target}`
              )
            : await axios(
                `https://sotdl-api-fetch.vercel.app/api/monsters?_id=${target}`
              );

        const {
          [attributeTarget]: attributeDefendingWith,
        } = data.characteristics;

        return {
          attacker: attackerData.name,
          attackName: attackName,
          name: data.name,
          attackResult:
            attackType === "challenge"
              ? rollD20() >= 10 + (attributeDefendingWith - 10)
                ? "Miss"
                : "Hit"
              : attackRoll > attributeDefendingWith
              ? "Hit"
              : "Miss",
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
