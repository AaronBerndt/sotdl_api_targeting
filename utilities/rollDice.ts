import { sum } from "lodash";

const rollDice = (sides: number) => {
  const result = Math.floor(Math.random() * sides) + 1;
  return result;
};

export const rollD20 = () => rollDice(20);
export const rollD6 = () => rollDice(6);
export const rollD3 = () => rollDice(3);

// const rollMutipleDice = (type: string, amount: number) => {
//   console.log(amount);
//   const diceResultList = [...Array(amount).keys()].map(() =>
//     type === "d6" ? rollD6() : rollD3()
//   );

//   return {
//     diceTotal: sum(diceResultList),
//     diceResultList,
//     max: Math.max(...diceResultList),
//   };
// };
