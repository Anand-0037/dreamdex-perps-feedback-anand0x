import { expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  positionSide: "long" as "long" | "short",
  stopOrders: [] as Array<{ isBid: boolean; triggerPrice: bigint; pair: { isBid: boolean; triggerPrice: bigint } }>,
}));

vi.mock("@dreamdex-bot-kit/perp-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dreamdex-bot-kit/perp-core")>();
  const market = {
    symbol: "BTC/USDso:USDso",
    display: "BTC-PERP",
    info: {
      poolAddress: "0x00000000000000000000000000000000000000bb",
      marginBank: "0x00000000000000000000000000000000000000cc",
      stopRegistry: "0x00000000000000000000000000000000000000dd",
      tickSize: "1000000000000000000",
      baseSymbol: "BTC",
    },
  };
  const exchange = {
    walletAddress: "0x00000000000000000000000000000000000000aa",
    trader: {
      placePerpStopOrder: async (order: typeof state.stopOrders[number]) => {
        state.stopOrders.push(order);
        return { stopOrderId: 1n, pairedStopOrderId: 2n };
      },
    },
  };
  return {
    armBracket: actual.armBracket,
    cancelStops: async () => {},
    closePosition: vi.fn(),
    createExchange: () => ({ exchange, config: { dryRun: false, symbol: "BTC-PERP", operatorRegistry: "0x00000000000000000000000000000000000000ee" } }),
    ensureLeverage: async () => ({ changed: false, dryRun: false, ownerOnly: false, to: 2 }),
    envNum: (_key: string, fallback: number) => fallback,
    loadEnv: () => {},
    liveMark: async () => 100,
    markOf: () => 100,
    onStop: () => () => true,
    pendingStops: async () => [],
    placePerp: vi.fn(),
    positionIn: async () => ({ side: state.positionSide, contracts: 1 }),
    preflight: async () => ({ ok: true, message: "preflight ok" }),
    requireMarket: async () => market,
    shutdown: async () => {},
    sizeForNotional: vi.fn(),
    sizeOrder: vi.fn(),
    sleep: vi.fn(),
    somiPerStop: async () => 0n,
    tradingKeyCheck: async () => ({ ok: true }),
  };
});

for (const existingSide of ["long", "short"] as const) {
  it(`arms stops for an existing ${existingSide} while PERP_SIDE is long`, async () => {
    state.positionSide = existingSide;
    state.stopOrders.length = 0;
    process.env.DRY_RUN = "false";
    process.env.PERP_SIDE = "long";
    delete process.env.PERP_FLATTEN_ON_EXIT;
    vi.resetModules();
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await import("../src/index.js");
      await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
      expect(state.stopOrders).toHaveLength(1);
      const order = state.stopOrders[0]!;
      expect(order.isBid).toBe(false);
      expect(order.pair.isBid).toBe(false);
      expect(order.triggerPrice).toBe(102n * 10n ** 18n);
      expect(order.pair.triggerPrice).toBe(99n * 10n ** 18n);
      // A short needs BUY stops. A SELL reduce-only stop cannot reduce it.
      expect(order.isBid === (existingSide === "short")).toBe(existingSide === "long");
    } finally {
      exit.mockRestore();
      log.mockRestore();
    }
  }, 30_000);
}
