import { sum } from "lodash";

const rollDice = (sides: number) => {
  const result = Math.floor(Math.random() * sides) + 1;
  return result;
};

export const rollD20 = () => rollDice(20);
export const rollD6 = () => rollDice(6);
export const rollD3 = () => rollDice(3);

export const rollMutipleDice = (type: string, amount: number) => {
  const diceResultList = [...Array(amount).keys()].map(() =>
    type === "d6" ? rollD6() : rollD3()
  );

  return {
    diceTotal: sum(diceResultList),
    diceResultList,
    max: Math.max(...diceResultList),
  };
};

export const rollDamageRoll = (damageRoll: string) => {
  const regex = /(-?\d+)/g;
  const result = damageRoll.match(regex);

  const diceAmount = result![0];
  const diceType = result![1];
  const extraWeaponDamage = result![2];

  const diceResult = rollMutipleDice(`d${diceType}`, parseInt(diceAmount));

  const total =
    diceResult.diceTotal +
    (extraWeaponDamage ? parseInt(extraWeaponDamage) : 0);

  return {
    total,
    formula: `${diceResult.diceTotal} +
    ${extraWeaponDamage ? parseInt(extraWeaponDamage) : 0}D`,
  };
};

export const rollAttackRoll = (attackRoll: string) => {
  const d20RollResult = rollD20();
  if (attackRoll.includes("B")) {
    const regex = /(.*)([+|-])(.*)B/;

    const regexResult = regex.exec(attackRoll);
    const modifier = Number(regexResult[1]);
    const isBoon = regexResult[2] === "+";
    const totalBB = Number(regexResult[3]);

    const bbResult = [Math.abs(totalBB)].some((amount) => amount !== 0)
      ? rollMutipleDice("d6", Math.abs(totalBB))
      : { diceTotal: 0, diceResultList: [], max: 0 };

    const total =
      d20RollResult + modifier + (isBoon ? bbResult.max : -bbResult.max);

    return {
      total,
      d20Result: d20RollResult,
      modifier,
      bbResult: isBoon ? bbResult.max : -bbResult.max,
    };
  }

  return {
    total: d20RollResult + Number(attackRoll),
    d20Result: d20RollResult,
    modifier: Number(attackRoll),
    bbResult: null,
  };
};
