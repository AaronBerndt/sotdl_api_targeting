import { VercelRequest, VercelResponse } from "@vercel/node";
import { insertIntoCollection } from "../utilities/MongoUtils";
import { Character } from "../types";
import microCors from "micro-cors";
import axios from "axios";
import { shuffle, take } from "lodash";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }

    const getRandomInt = (max) => Math.floor(Math.random() * max);

    const { level } = request.body;

    const { data: ancestries } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/ancestries`
    );

    const { data: paths } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/paths`
    );

    const pickRandomAncestry = () => {
      const { name } = ancestries[getRandomInt(ancestries.length + 1)];

      return name;
    };

    const pickRandomPath = (pathType: string) => {
      const filteredPaths = paths.filter(({ type }) => type === pathType);

      const { name } = filteredPaths[getRandomInt(filteredPaths.length + 1)];

      return name;
    };

    const pickRandomCharacteristics = (level: number) => {
      const statList = ["Strength", "Agility", "Will", "Intellect"];

      const createRandomCharacteristicsList = (amount, atLevel) =>
        take(shuffle(statList), amount).map((characteristic) => ({
          id: `${characteristic}-${atLevel}`,
          name: characteristic,
          value: 1,
          level: atLevel,
        }));

      const noviceList =
        level >= 1 ? createRandomCharacteristicsList(2, 1) : [];
      const expertList =
        level >= 1 ? createRandomCharacteristicsList(2, 3) : [];
      const masterList =
        level >= 1 ? createRandomCharacteristicsList(3, 7) : [];

      return [...noviceList, ...expertList, ...masterList];
    };

    const ancestry = pickRandomAncestry();
    const newCharacterData: any = {
      name: "",
      level: level,
      ancestry,
      novicePath:
        level >= 1 && ancestry !== ("Jotun" || "Centaur")
          ? pickRandomPath("Novice")
          : "",
      expertPath: level >= 3 ? pickRandomPath("Expert") : "",
      masterPath: level >= 7 ? pickRandomPath("Master") : "",
      characteristics: pickRandomCharacteristics(level),
      talents: [],
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
      languages: ["Common"],
      professions: [],
      details: [],
      choices: [],
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
