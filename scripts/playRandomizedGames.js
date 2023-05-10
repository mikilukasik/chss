import fetch from "node-fetch";
import { promises as fs } from "fs";
import path from "path";
import { getMovedBoard } from "../chss-lambda-ai/chss-module-engine/src/engine_new/utils/getMovedBoard.js";
import { getUpdatedLmfLmt } from "../chss-lambda-ai/chss-module-engine/src/engine_new/utils/getUpdatedLmfLmt.js";
import { fen2intArray } from "../chss-lambda-ai/chss-module-engine/src/engine_new/transformers/fen2intArray.js";
import { board2fen } from "../chss-lambda-ai/chss-module-engine/src/engine_new/transformers/board2fen.js";
import { moveString2move } from "../chss-lambda-ai/chss-module-engine/src/engine_new/transformers/moveString2move.js";

const filename = path.resolve(`moveScoreRatioStats-${Date.now()}.csv`);

const defaultStartingState = {
  startingFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  startingLmf: new Array(64).fill(255),
  startingLmt: new Array(64).fill(255),
};

const defaultEngineConfig = {
  depth: 4,
  moveSorters: [{ cutoff: 0.01 }],
  moveScoreRario: 1,
  winnerScoreRario: 1,
};

const startingMoves = ["e2e4", "e2e3", "d2d4", "d2d3", "c2c4"];

const customStartingStates = startingMoves.map((moveString) => {
  const board = fen2intArray(defaultStartingState.startingFen);
  const move = moveString2move(moveString);
  const movedBoard = getMovedBoard(move, board);
  const startingFen = board2fen(movedBoard);

  const { lmf, lmt } = getUpdatedLmfLmt({
    move,
    lmf: defaultStartingState.startingLmf,
    lmt: defaultStartingState.startingLmt,
  });

  return {
    startingFen,
    startingLmf: Array.from(lmf),
    startingLmt: Array.from(lmt),
  };
});

const getStartingState = () => {
  if (Math.random < 0.3) return defaultStartingState;

  return customStartingStates[Math.floor(Math.random() * startingMoves.length)];
};

(async () => {
  await fs.writeFile(filename, "moveScoreRario,winnerScoreRario,points\n");

  while (true) {
    const startingState = getStartingState();

    const engineConfig1 = {
      ...defaultEngineConfig,
      moveScoreRario: Math.random() / Math.random(),
      winnerScoreRario: Math.random() / Math.random(),
    };

    const engineConfig2 = {
      ...defaultEngineConfig,
      moveScoreRario: 0.92,
      winnerScoreRario: 0.4,
    };

    const result1 = await (
      await fetch("http://localhost:3000/lambda-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          command: "playFullGame",
          data: {
            ...startingState,
            darkEngineConfig: engineConfig1,
            lightEngineConfig: engineConfig2,
          },
        }),
      })
    ).json();

    const result2 = await (
      await fetch("http://localhost:3000/lambda-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          command: "playFullGame",
          data: {
            ...startingState,
            darkEngineConfig: engineConfig2,
            lightEngineConfig: engineConfig1,
          },
        }),
      })
    ).json();

    const engine1points =
      (result1.winner === "dark" ? 100 : 0) +
      (result1.winner === "light" ? -100 : 0) +
      (result2.winner === "light" ? 100 : 0) +
      (result2.winner === "dark" ? -100 : 0) +
      result2.balance -
      result1.balance;

    // const engine2points = -engine1points;

    await fs.appendFile(
      filename,
      `${engineConfig1.moveScoreRario},${engineConfig1.winnerScoreRario},${engine1points}\n` //${engineConfig2.moveScoreRario},${engineConfig2.winnerScoreRario},${engine2points}\n`
    );
  }
})().catch(console.error);
