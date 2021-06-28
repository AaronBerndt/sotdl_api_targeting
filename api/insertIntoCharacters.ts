import { VercelRequest, VercelResponse } from "@vercel/node";
import { insertIntoCollection } from "../utilities/MongoUtils";
import { Character } from "../types";
import microCors from "micro-cors";
import axios from "axios";
import { find } from "lodash";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }

    const { documents } = request.body.data;
    console.log(documents);

    const {
      data: [ancestry],
    } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/ancestries?name=${documents.ancestry}`
    );

    const { data: paths } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/paths`
    );

    const filterByLevel = (array) =>
      array.filter(({ level }) => level <= documents.level);

    const filterByPathName = (name: string) =>
      name !== "" ? find(paths, { name }).talents : [];

    const newCharacterData: Character = {
      name: documents.name,
      level: documents.level,
      ancestry: documents.ancestry,
      novicePath: documents.novicePath,
      expertPath: documents.expertPath,
      masterPath: documents.masterPath,
      characteristics: [
        ...filterByLevel(ancestry.characteristics),
        ...documents.characteristics,
      ],
      talents: [
        ...filterByLevel(ancestry.talents),
        ...filterByLevel(filterByPathName(documents.novicePath)),
        ...filterByLevel(filterByPathName(documents.expertPath)),
        ...filterByLevel(filterByPathName(documents.masterPath)),
      ],
      spells: documents.spells,
      traditions: documents.traditions,
      items: {
        weapons: documents.items.filter(
          ({ itemType }) => itemType === "weapon"
        ),
        armor: documents.items.filter(({ itemType }) => itemType === "armor"),
        otherItems: documents.items.filter(
          ({ itemType }) => itemType === "basic"
        ),
        currency: documents.currency,
      },
      languages: ["Common", "Dwarf"],
      professions: [{ name: "Guard", type: "Martial" }],
      details: [],
      characterState: {
        damage: 0,
        expended: [],
        overrides: documents.overrides,
        afflictions: [],
      },
    };
    await insertIntoCollection("characters", newCharacterData);
    response.status(200).send(newCharacterData);
  } catch (e) {
    console.log(e);
    response.status(504).send(e);
  }
};

export default cors(handler);
