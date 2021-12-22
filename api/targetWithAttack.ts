import axios from "axios";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { UPDATE_TEMPORARYEFFECTS_URL } from "../utilities/api.config";
import { rollD20 } from "../utilities/rollDice";
import microCors from "micro-cors";
import { find } from "lodash";

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

    const data = await Promise.all(
      targets.map(async (target: string, type: "monster" | "player") => {
        let targetData;
        let name;

        if (type === "player") {
          let { data } = await axios(
            `https://sotdl-api-fetch.vercel.app/api/characters?_id=${target}`
          );
          targetData = data[0];

          name = targetData.name;
        } else {
          const monster = find(currentCombat?.combatants, { _id: target });

          let { data } = await axios(
            `https://sotdl-api-fetch.vercel.app/api/monsters?_id=${monster.monsterId}`
          );

          targetData = data[0];
          name = monster.name;
        }

        const { [attributeTarget]: attributeDefendingWith } =
          targetData.characteristics;

        return {
          attacker: attackerData.name,
          attackName: attackName,
          name,
          attackResult:
            attackType === "challenge"
              ? rollD20() >= 10 + (attributeDefendingWith - 10)
                ? "Miss"
                : "Hit"
              : attackRoll > attributeDefendingWith
              ? attackRoll >= 20 && attackRoll - attributeDefendingWith >= 5
                ? "Crit"
                : "Hit"
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
