import { storage } from "../server/storage";

describe("Storage createGame workflow", () => {
  const uniqueCode = `TEST${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
  let gameId: number;

  it("creates a game successfully", async () => {
    const game = await storage.createGame({
      gameCode: uniqueCode,
      hostId: "test-host",
      settings: { werewolves: 2, seer: true, doctor: true, shield: true },
      status: "lobby",
    });

    expect(game).toBeDefined();
    expect(game.gameCode).toBe(uniqueCode);
    gameId = game.id;
  });

  it("retrieves the game by code", async () => {
    const fetched = await storage.getGameByCode(uniqueCode);
    expect(fetched).toBeDefined();
    expect(fetched!.id).toBe(gameId);
  });
});
