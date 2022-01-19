import axios from "axios";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { UPDATE_TEMPORARYEFFECTS_URL } from "../utilities/api.config";
import { rollAttackRoll, rollD20 } from "../utilities/rollDice";
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

    const { total, formula }: any =
      attackType === "challenge" ? "" : rollAttackRoll(attackRoll);

    const data = await Promise.all(
      targets.map(async (target: { id: string; type: string }) => {
        let targetData;
        let name;

        if (target.type === "player") {
          let { data } = await axios(
            `https://sotdl-api-fetch.vercel.app/api/characters?_id=${target.id}`
          );
          targetData = data;

          name = targetData.name;
        } else {
          const monster = find(currentCombat?.combatants, { _id: target.id });

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
          attackType,
          attackName: attackName,
          name,
          formula,
          attackDiceResult: total,
          attackResult:
            attackType === "challenge"
              ? rollD20() >= 10 + (attributeDefendingWith - 10)
                ? "Miss"
                : "Hit"
              : Number(total) > attributeDefendingWith
              ? Number(total) >= 20 &&
                Number(total) - attributeDefendingWith >= 5
                ? "Critical Hit"
                : "Hit"
              : "Miss",
        };
      })
    );

    console.log(data);
    response.status(200).send(data);
  } catch (e) {
    console.log(e);
    response.status(504).send(e);
  }
};

export default cors(handler);
