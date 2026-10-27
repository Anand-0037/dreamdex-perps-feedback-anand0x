import { expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  positionSide: "long" as "long" | "short",
  markAfterEntry: 99,
  markReads: 0,
  ticks: 0,
  closeLabels: [] as string[],
}));

vi.mock("@dreamdex-bot-kit/perp-core", () => {
  const market = {
    symbol: "BTC/USDso:USDso",
    display: "BTC-PERP",
    info: { baseSymbol: "BTC" },
  };
  const exchange = { walletAddress: "0x00000000000000000000000000000000000000aa" };
  return {
    armBracket: vi.fn(),
    cancelStops: vi.fn(),
    closePosition: async (_ctx: unknown, _market: unknown, _account: unknown, opts: { label: string }) => {
      state.closeLabels.push(opts.label);
      return { sent: true, filled: 1n };
    },
    createExchange: () => ({ exchange, config: { dryRun: false, symbol: "BTC-PERP", owner: "0x00000000000000000000000000000000000000aa" } }),
    ensureLeverage: async () => ({ dryRun: false, changed: false, ownerOnly: true, from: 2 }),
    envNum: (_key: string, fallback: number) => fallback,
    loadEnv: () => {},
    liveMark: async () => ++state.markReads === 1 ? 100 : state.markAfterEntry,
    markOf: () => 100,
    onStop: () => () => state.ticks >= 1,
    pendingStops: async () => [],
    placePerp: vi.fn(),
    positionIn: async () => ({ side: state.positionSide, contracts: 1, unrealizedPnl: 0 }),
    preflight: async () => ({ ok: true, message: "preflight ok" }),
    requireMarket: async () => market,
    shutdown: async () => {},
    sizeForNotional: vi.fn(),
    sizeOrder: vi.fn(),
    sleep: async () => { state.ticks++; },
    somiPerStop: vi.fn(),
    tradingKeyCheck: async () => ({ ok: true }),
  };
});

for (const { side, mark, expectedClose } of [
  { side: "long" as const, mark: 99, expectedClose: "stop-loss" },
  { side: "short" as const, mark: 101, expectedClose: undefined },
  { side: "short" as const, mark: 102, expectedClose: "take-profit" },
]) {
  it(`checks the watched exit for an existing ${side} after the mark moves to ${mark}`, async () => {
    state.positionSide = side;
    state.markAfterEntry = mark;
    state.markReads = 0;
    state.ticks = 0;
    state.closeLabels.length = 0;
    process.env.DRY_RUN = "false";
    process.env.PERP_SIDE = "long";
    delete process.env.PERP_FLATTEN_ON_EXIT;
    vi.resetModules();
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await import("../src/index.js");
      await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
      expect(state.closeLabels).toEqual(expectedClose ? [expectedClose] : []);
    } finally {
      exit.mockRestore();
      log.mockRestore();
    }
  }, 30_000);
}
