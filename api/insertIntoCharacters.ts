import { VercelRequest, VercelResponse } from "@vercel/node";
import { insertIntoCollection } from "../utilities/MongoUtils";
import { Character, Item } from "../types";
import microCors from "micro-cors";
import { ObjectId, ObjectID } from "mongodb";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }

    const { documents } = request.body.data;

    const newCharacterData: Character = {
      name: documents.name,
      level: documents.level,
      ancestry: documents.ancestry,
      novicePath: documents.novicePath,
      expertPath: documents.expertPath,
      masterPath: documents.masterPath,
      characteristics: [
        ...documents.characteristics,
      ].map(({ value, ...rest }) => ({ ...rest, value: Number(value) })),
      talents: [],
      spells: documents.spells,
      traditions: documents.traditions,
      items: {
        weapons: documents.items
          .filter(({ itemType }) => itemType === "weapon")
          .map(({ name }) => name),
        armor: documents.items
          .filter(({ itemType }) => itemType === "armor")
          .map(({ name }) => name),
        otherItems: documents.items
          .filter(({ itemType }) => itemType === "basic")
          .map(({ name }) => name),
        currency: documents.currency,
      },
      languages: [],
      professions: [],
      details: [],
      choices: documents.choices,
      characterState: {
        damage: 0,
        injured: false,
        expended: [],
        temporaryEffects: [],
        equiped: documents.items
          .filter(({ itemType }) => itemType !== "basic")
          .map((item: Item) => ({
            _id: new ObjectId(),
            name: item.name,
            equiped: true,
          })),
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
