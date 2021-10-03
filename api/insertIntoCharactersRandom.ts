import { VercelRequest, VercelResponse } from "@vercel/node";
import { insertIntoCollection } from "../utilities/MongoUtils";
import { Character, Characteristic } from "../types";
import microCors from "micro-cors";
import axios from "axios";
import { random, shuffle, take } from "lodash";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }

    const { level, options } = request.body;

    const { data: ancestries } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/ancestries`
    );

    const { data: paths } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/paths`
    );

    const pickRandomAncestry = () => {
      const ancestry = ancestries[random(ancestries.length)];

      return ancestry;
    };

    const pickRandomPath = (pathType: string) => {
      const filteredPaths = paths.filter(({ type }) => type === pathType);

      const path = filteredPaths[random(filteredPaths.length)];

      return path;
    };

    const statList = ["Strength", "Agility", "Will", "Intellect"];
    const ancestry = pickRandomAncestry();
    const novicePath =
      level >= 1 && ancestry !== ("Jotun" || "Centaur")
        ? pickRandomPath("Novice")
        : "";

    const expertPath = level >= 3 ? pickRandomPath("Expert") : "";
    const masterPath = level >= 7 ? pickRandomPath("Master") : "";

    const pickRandomCharacteristics = (level: number) => {
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
        level >= 3 ? createRandomCharacteristicsList(2, 3) : [];
      const masterList =
        level >= 7 ? createRandomCharacteristicsList(3, 7) : [];

      return [...noviceList, ...expertList, ...masterList];
    };

    const rollForRandomCharacteristics = () => {
      const characteristics = ancestry.characteristics.filter(
        ({ level, name }) => level === 0 && statList.includes(name)
      );

      console.log(characteristics);

      const randomCharacteristics = characteristics.map(
        (characteristic: Characteristic) => {
          const ancestryModifter = characteristic.value - 2;
          const diceRoll = random(1, 3);
          const newCharacteristic = ancestryModifter + diceRoll;
          return {
            name: characteristic.name,
            value: newCharacteristic - characteristic.value,
          };
        }
      );

      return randomCharacteristics.filter(({ value }) => value !== 0);
    };

    console.log(options);
    const overrides = options?.rollForCharacteristics
      ? rollForRandomCharacteristics()
      : [];

    const newCharacterData: any = {
      name: "",
      level: level,
      ancestry: ancestry.name,
      novicePath: novicePath?.name ? novicePath?.name : novicePath,
      expertPath: expertPath?.name ? expertPath?.name : expertPath,
      masterPath: masterPath?.name ? masterPath?.name : masterPath,
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
        overrides,
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
