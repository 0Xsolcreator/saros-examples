import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { loadWalletFromCLI } from "./wallet.js";
import { sarosDLMM } from "./service.js";
import { PYUSD_TOKEN_DEVNET, PYUSD_WSOL_POOL_DEVNET, WSOL_TOKEN_DEVNET } from "./constants.js";
import { createUniformDistribution, findPosition, getBinRange, getMaxBinArray, getMaxPosition, LiquidityShape } from "@saros-finance/dlmm-sdk";
import bigDecimal from "js-big-decimal";

const wallet = loadWalletFromCLI();

const connection = sarosDLMM.connection;
const { blockhash } = await connection.getLatestBlockhash({ commitment: "confirmed" });

const pair = new PublicKey(PYUSD_WSOL_POOL_DEVNET.address);
const pairInfo = await sarosDLMM.getPairAccount(pair);

const binRange: [number, number] = [-5, 5];
const txQueue: Transaction[] = [];
const activeBin = pairInfo.activeId;
const binArrayList = getMaxBinArray(binRange, activeBin);
const binsAndVaultsTx = new Transaction();

await Promise.all([
  ...binArrayList.map(async (bin) => {
    await sarosDLMM.getBinArray({
      binArrayIndex: bin.binArrayLowerIndex,
      pair,
      payer: wallet.publicKey,
      transaction: binsAndVaultsTx as any,
    });
    await sarosDLMM.getBinArray({
      binArrayIndex: bin.binArrayUpperIndex,
      pair,
      payer: wallet.publicKey,
      transaction: binsAndVaultsTx as any,
    });
  }),
  ...[PYUSD_WSOL_POOL_DEVNET.baseToken, PYUSD_WSOL_POOL_DEVNET.quoteToken].map(async (token) => {
    await sarosDLMM.getPairVaultInfo({
      pair,
      payer: wallet.publicKey,
      transaction: binsAndVaultsTx as any,
      tokenAddress: new PublicKey(token.mintAddress),
    });
    await sarosDLMM.getUserVaultInfo({
      payer: wallet.publicKey,
      transaction: binsAndVaultsTx as any,
      tokenAddress: new PublicKey(token.mintAddress),
    });
  }),
]);

if (binsAndVaultsTx.instructions.length > 0) {
  binsAndVaultsTx.recentBlockhash = blockhash;
  binsAndVaultsTx.feePayer = wallet.publicKey;
  txQueue.push(binsAndVaultsTx);
}

const maxPositionList = getMaxPosition(binRange, activeBin);
const userPositions = await sarosDLMM.getUserPositions({ payer: wallet.publicKey, pair });
const maxLiquidityDistribution = createUniformDistribution({ shape: LiquidityShape.Spot, binRange });

const maxLiquidityDistributions = await Promise.all(
  maxPositionList.map(async (position) => {
    const { range, binLower, binUpper } = getBinRange(position, activeBin);
    const currentPosition = userPositions.find(findPosition(position, activeBin));

    const startIndex =
      maxLiquidityDistribution.findIndex((item) => item.relativeBinId === range[0]) ?? 0;
    const endIndex =
      (maxLiquidityDistribution.findIndex((item) => item.relativeBinId === range[1]) ?? maxLiquidityDistribution.length - 1) + 1;

    const liquidityDistribution = maxLiquidityDistribution.slice(startIndex, endIndex);

    const binArray = binArrayList.find(
      (item) =>
        item.binArrayLowerIndex * 256 <= binLower &&
        (item.binArrayUpperIndex + 1) * 256 > binUpper
    )!;

    const binArrayLower = await sarosDLMM.getBinArray({
      binArrayIndex: binArray.binArrayLowerIndex,
      pair: new PublicKey(pair),
      payer: wallet.publicKey,
    });
    const binArrayUpper = await sarosDLMM.getBinArray({
      binArrayIndex: binArray.binArrayUpperIndex,
      pair: new PublicKey(pair),
      payer: wallet.publicKey,
    });

    let positionMint: PublicKey;

    if (!currentPosition) {
      const createPositionTx = new Transaction();
      const newPositionMint = Keypair.generate();

      await sarosDLMM.createPosition({
        pair: new PublicKey(pair),
        payer: wallet.publicKey,
        relativeBinIdLeft: range[0]!,
        relativeBinIdRight: range[1]!,
        binArrayIndex: binArray.binArrayLowerIndex,
        positionMint: newPositionMint.publicKey,
        transaction: createPositionTx as any,
      });

      createPositionTx.recentBlockhash = blockhash;
      createPositionTx.feePayer = wallet.publicKey;
      createPositionTx.sign(wallet, newPositionMint);
      txQueue.push(createPositionTx);
      positionMint = newPositionMint.publicKey;
    } else {
      positionMint = currentPosition.positionMint;
    }

    return {
      positionMint,
      position,
      liquidityDistribution,
      binArrayLower: binArrayLower.toString(),
      binArrayUpper: binArrayUpper.toString(),
    };
  })
);

await Promise.all(
  maxLiquidityDistributions.map(async (maxLiquidityDistribution) => {
    const { positionMint, liquidityDistribution, binArrayLower, binArrayUpper } =
      maxLiquidityDistribution;

    const addLiquidityTx = new Transaction();

    const amountX = Number(
      new bigDecimal(Math.pow(10, PYUSD_TOKEN_DEVNET.decimals)).multiply(
        new bigDecimal(0.1)
      ).getValue()
    );
    const amountY = Number(
      new bigDecimal(Math.pow(10, WSOL_TOKEN_DEVNET.decimals)).multiply(
        new bigDecimal(0.1)
      ).getValue()
    );

    await sarosDLMM.addLiquidityIntoPosition({
      amountX,
      amountY,
      positionMint,
      liquidityDistribution,
      binArrayLower: new PublicKey(binArrayLower),
      binArrayUpper: new PublicKey(binArrayUpper),
      transaction: addLiquidityTx as any,
      payer: wallet.publicKey,
      pair,
    });

    addLiquidityTx.recentBlockhash = blockhash;
    addLiquidityTx.feePayer = wallet.publicKey;
    txQueue.push(addLiquidityTx);
  })
);

for (let i = 0; i < txQueue.length; i++) {
  const tx = txQueue[i];
  if (!tx) {
    console.log(`Skipping undefined transaction at index ${i}`);
    continue;
  }
  try {
    if (tx.signatures.length === 0) {
      tx.sign(wallet);
    }
    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    const confirmation = await connection.confirmTransaction(signature, "confirmed");
    if (confirmation.value.err) throw confirmation.value.err;
  } catch (error) {
    throw error;
  }
}
