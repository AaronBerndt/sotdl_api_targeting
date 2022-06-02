import axios from "axios";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { UPDATE_TEMPORARYEFFECTS_URL } from "../utilities/api.config";
import microCors from "micro-cors";
import Pusher = require("pusher");

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }

    const pusher = new Pusher({
      appId: "1417021",
      key: "26afa4c37fef2c3f93bc",
      secret: "a1a2731de395c9ba5bfe",
      cluster: "us2",
      useTLS: true,
    });

    const { temporaryEffectGiverId, targets, temporaryEffectName, duration } =
      request.body.data;

    const { data: temporaryEffectGiverData } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/characters?_id=${temporaryEffectGiverId}`
    );

    const regex = /([1-9]) (.*)/;

    const result = regex.exec(duration);

    const timeValue = result[1];
    const timeType = result[2];

    const timeValueObject = {
      minute: 6,
      hour: 360,
      day: 8640,
    };
    const totalRounds = Number(timeValue) * timeValueObject[timeType];

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

        pusher.trigger("my-channel", `Targeted with effect ${data._id}`, {
          temporaryEffectGiver: temporaryEffectGiverData.name,
          name: data.name,
          temporaryEffectAdd: temporaryEffectName,
          duration: totalRounds,
        });

        return {
          temporaryEffectGiver: temporaryEffectGiverData.name,
          name: data.name,
          temporaryEffectAdd: temporaryEffectName,
          duration: totalRounds,
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
