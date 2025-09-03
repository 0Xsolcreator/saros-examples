import { PublicKey, Transaction } from "@solana/web3.js";
import { sarosDLMM } from "./service.js";
import { PYUSD_TOKEN_DEVNET, PYUSD_WSOL_POOL_DEVNET, WSOL_TOKEN_DEVNET } from "./constants.js";
import { loadWalletFromCLI } from "./wallet.js";
import { PositionInfo, RemoveLiquidityType } from "@saros-finance/dlmm-sdk";

const wallet = loadWalletFromCLI();

const pair = new PublicKey(PYUSD_WSOL_POOL_DEVNET.address);
const pairInfo = await sarosDLMM.getPairAccount(pair);
const activeId = pairInfo.activeId;

const range: [number, number] = [activeId - 10, activeId + 10];

const positions = await sarosDLMM.getUserPositions({ payer: wallet.publicKey, pair });

const positionList = positions.filter(
  (item: PositionInfo) => !(item.upperBinId! < range[0] || item.lowerBinId! > range[1])
);

if (!positionList.length) throw new Error("No position found in this range");

const maxPositionList = positions.map((item: PositionInfo) => {
  const start = Math.max(range[0], item.lowerBinId!);
  const end = Math.min(range[1], item.upperBinId!);

  return {
    position: item.position,
    start,
    end,
    positionMint: item.positionMint,
  };
});

const { txs, txCreateAccount, txCloseAccount } =
  await sarosDLMM.removeMultipleLiquidity({
    maxPositionList,
    payer: wallet.publicKey,
    type: RemoveLiquidityType.BaseToken,
    pair,
    tokenMintX: new PublicKey(PYUSD_TOKEN_DEVNET.mintAddress),
    tokenMintY: new PublicKey(WSOL_TOKEN_DEVNET.mintAddress),
    activeId,
  });

const allTxs: Transaction[] = [];
if (txCreateAccount) allTxs.push(txCreateAccount as any);
allTxs.push(...txs as any);
if (txCloseAccount) allTxs.push(txCloseAccount as any);

const {blockhash} = await sarosDLMM.connection.getLatestBlockhash({ commitment: "confirmed" });

for (const tx of allTxs) {
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;
  tx.sign(wallet);
  const sig = await sarosDLMM.connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await sarosDLMM.connection.confirmTransaction(sig, "confirmed");
  console.log("Sent tx:", sig);
}
