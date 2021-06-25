import { VercelRequest, VercelResponse } from "@vercel/node";
import { insertIntoCollection } from "../utilities/MongoUtils";
import { Character } from "../types";
import microCors from "micro-cors";
import axios from "axios";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }
    const { documents } = request.body.data;

    const {
      data: [ancestry],
    } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/ancestries?name=${documents.ancestry}`
    );

    const filterByLevel = (array) =>
      array.filter(({ level }) => level <= documents.level);

    const newCharacterData: Character = {
      name: documents.name,
      description: "",
      level: documents.level,
      ancestry: documents.ancestry,
      novicePath: documents.novicePath,
      expertPath: documents.expertPath,
      masterPath: documents.masterPath,
      characteristics: [
        ...filterByLevel(ancestry.characteristics),
        ...documents.characteristics,
      ],
      talents: [...filterByLevel(ancestry.talents)],
      spells: documents.spells,
      traditions: documents.traditions,
      items: {
        weapons: [],
        armor: [],
        otherItems: [],
        currency: {
          bits: 0,
          copper: 0,
          silver: 0,
          gold: 0,
        },
      },
      languages: ["Common", "Dwarf"],
      professions: [{ name: "Guard", type: "Martial" }],
      details: [],
      characterState: {
        damage: 0,
        expended: [],
        overrides: [],
        afflictions: [],
      },
    };
    // const data = await insertIntoCollection("characters", documents);
    console.log(newCharacterData);
    response.status(200).send(newCharacterData);
  } catch (e) {
    console.log(e);
    response.status(504).send(e);
  }
};

export default cors(handler);
