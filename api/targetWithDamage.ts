import axios from "axios";
import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  UPDATE_CHARACTER_HEALTH_URL,
  UPDATE_TEMPORARYEFFECTS_URL,
} from "../utilities/api.config";
import { rollD20, rollDamageRoll } from "../utilities/rollDice";
import microCors from "micro-cors";
import { find } from "lodash";
import Pusher = require("pusher");

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }

    const { APP_ID, PUSHER_KEY, PUSHER_SECRET } = process.env;

    const pusher = new Pusher({
      appId: APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      cluster: "us2",
      useTLS: true,
    });

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
            data: { healthChangeAmount: damageResult.total, _id: target.id },
          });
        } else {
          const monster = find(currentCombat?.combatants, { _id: target });

          let { data } = await axios(
            `https://sotdl-api-fetch.vercel.app/api/monsters?_id=${monster.monsterId}`
          );

          targetData = data[0];
          name = monster.name;
        }

        await pusher.trigger(
          "my-channel",
          `Targeted with damage ${targetData._id}`,
          {
            attacker: attackerData.name,
            attackName: attackName,
            name,
            damageResult,
          }
        );

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
