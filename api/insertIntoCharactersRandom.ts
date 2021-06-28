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

    const { level } = request.body;

    const { data: ancestries } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/ancestries`
    );

    const { data: paths } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/paths`
    );

    const filterByLevel = (array) =>
      array.filter(({ level: filterLevel }) => filterLevel <= level);

    const pickRandomAncestry = () => {
      return { name };
    };

    const pickRandomPath = (type: string) => {
      const [path] = paths.filter(
        ({ type: filterType }) => filterType === type
      );

      return { name };
    };

    const pickRandomCharacteristics = () => {
      return [];
    };

    const newCharacterData: Character = {
      name: "",
      level: level,
      ancestry: "",
      novicePath: level <= 1 ? "" : "",
      expertPath: level <= 3 ? "" : "",
      masterPath: level <= 7 ? "" : "",
      characteristics: [
        ...filterByLevel(ancestries[0].characteristics),
        ...pickRandomCharacteristics(),
      ],
      talents: [...filterByLevel(ancestries[0].talents)],
      spells: [],
      traditions: [],
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
