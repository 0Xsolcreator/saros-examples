import { LiquidityBookServices, MODE } from "@saros-finance/dlmm-sdk";

export const sarosDLMM = new LiquidityBookServices({
  mode: MODE.DEVNET,
  options: {
    rpcUrl:
      "https://devnet.helius-rpc.com/?api-key=f831b443-8520-4f01-8228-59af9bb829b7",
  },
});
