import { VercelRequest, VercelResponse } from "@vercel/node";
import { insertIntoCollection } from "../utilities/MongoUtils";
import { Character, Characteristic, Talent } from "../types";
import microCors from "micro-cors";
import axios from "axios";
import { find, random, shuffle, take } from "lodash";
import traditionList from "./constants/traditionList";

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
      level >= 1 && !find(ancestry.talents, { name: "Powerful Ancestry" })
        ? pickRandomPath("Novice")
        : "";

    const expertPath = level >= 3 ? pickRandomPath("Expert") : "";
    const masterPath = level >= 7 ? pickRandomPath("Master") : "";
    let pastLife: any = "";

    const pickRandomCharacteristics = (level: number) => {
      const createRandomCharacteristicsList = (amount, atLevel, value) =>
        take(shuffle(statList), amount).map((characteristic) => ({
          id: `${characteristic}-${atLevel}`,
          name: characteristic,
          value,
          level: atLevel,
        }));

      const regex = /Increase (.*) by (.*)/gm;
      const hasAncestryChoice = find(ancestry.talents, {
        name: "Attributes Increase",
      });

      const ancestryChoice = hasAncestryChoice
        ? createRandomCharacteristicsList(
            1,
            0,
            parseInt(regex.exec(hasAncestryChoice.description)[2])
          )
        : [];

      const noviceList =
        level >= 1 ? createRandomCharacteristicsList(2, 1, 1) : [];
      const expertList =
        level >= 3 ? createRandomCharacteristicsList(2, 3, 1) : [];
      const masterList =
        level >= 7 ? createRandomCharacteristicsList(3, 7, 1) : [];

      return [...ancestryChoice, ...noviceList, ...expertList, ...masterList];
    };

    const rollForRandomCharacteristics = () => {
      const characteristics = (pastLife !== ""
        ? pastLife
        : ancestry
      ).characteristics.filter(
        ({ level, name }) => level === 0 && statList.includes(name)
      );

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

    const pickRandomChoices = () => {
      const talentsList = [
        ...ancestry?.talents,
        ...(novicePath !== "" ? novicePath?.talents : []),
        ...(expertPath !== "" ? expertPath?.talents : []),
        ...(masterPath !== "" ? masterPath?.talents : []),
      ]
        .filter(
          ({ name, description, level }: Talent) =>
            name === "Attributes Increase" ||
            description.includes("Choose") ||
            description.includes("Pick") ||
            level === 4
        )
        .map((talent: Talent) => {
          if (
            ["Faith", "Tradition Focus", "Knack", "Discipline"].includes(
              talent.name
            )
          ) {
            const choiceType = {
              faith: "faiths",
              knack: "knacks",
              discipline: "disciplines",
            };

            const choice =
              talent.name === "Tradition Focus"
                ? traditionList[random(traditionList.length)]
                : novicePath[choiceType[talent.name.toLowerCase()]][
                    random(
                      novicePath[choiceType[talent.name.toLowerCase()]].length
                    )
                  ];

            return {
              name: talent.name,
              value: choice.name,
              level: talent.level,
            };
          }
          if (talent.name === "Past Life") {
            const filteredAncestryList = ancestries.filter(
              ({ talents }: any) =>
                !talents.map(({ name }: Talent) => name).includes("Past Life")
            );

            pastLife =
              filteredAncestryList[random(filteredAncestryList.length)];

            return {
              name: talent.name,
              value: pastLife?.name,
              level: talent.level,
            };
          } else {
            return talent;
          }
        });

      return talentsList;
    };

    const choices = pickRandomChoices();

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
      choices,
      characterState: {
        damage: 0,
        expended: [],
        overrides,
        afflictions: [],
      },
    };
    const data = await insertIntoCollection("characters", newCharacterData);
    response.status(200).send(data);
  } catch (e) {
    console.log(e);
    response.status(504).send(e);
  }
};

export default cors(handler);
