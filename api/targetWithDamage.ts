import axios from "axios";
import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  UPDATE_CHARACTER_HEALTH_URL,
  UPDATE_TEMPORARYEFFECTS_URL,
} from "../utilities/api.config";
import { rollD20, rollDamageRoll } from "../utilities/rollDice";
import microCors from "micro-cors";
import { find } from "lodash";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }
    const { attackerId, targets, attackName, damageRoll } = request.body.data;

    const { data: attackerData } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/characters?_id=${attackerId}`
    );

    const { data: currentCombat } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/combats?_id=${attackerData.activeCombat}`
    );

    const damageResult = rollDamageRoll(damageRoll);

    const data = await Promise.all(
      targets.map(async (target: { id: string; type: string }) => {
        let targetData;
        let name;

        if (target.type === "player") {
          let { data } = await axios(
            `https://sotdl-api-fetch.vercel.app/api/characters?_id=${target.id}`
          );
          targetData = data;

          name = data.name;

          await axios.post(UPDATE_CHARACTER_HEALTH_URL, {
            data: { healthChangeAmount: damageResult, _id: target.id },
          });
        } else {
          const monster = find(currentCombat?.combatants, { _id: target });

          let { data } = await axios(
            `https://sotdl-api-fetch.vercel.app/api/monsters?_id=${monster.monsterId}`
          );

          targetData = data[0];
          name = monster.name;
        }

        return {
          attacker: attackerData.name,
          attackName: attackName,
          name,
          damageResult,
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
