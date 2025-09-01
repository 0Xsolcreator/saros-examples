import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { loadWalletFromCLI } from "./wallet.js";
import { sarosDLMM } from "./service.js";
import { PYUSD_TOKEN_DEVNET, PYUSD_WSOL_POOL_DEVNET, WSOL_TOKEN_DEVNET } from "./constants.js";
import { createUniformDistribution, findPosition, getBinRange, getMaxBinArray, getMaxPosition, LiquidityShape } from "@saros-finance/dlmm-sdk";
import bigDecimal from "js-big-decimal";

const wallet = loadWalletFromCLI();

const binRange: [number, number] = [-5, 5];

const allTxs: Transaction[] = [];

const connection = sarosDLMM.connection;
const { blockhash } = await connection.getLatestBlockhash({
    commitment: "confirmed",
});

const convertBalanceToWei = (strValue: number, iDecimal: number = 9) => {
    if (strValue === 0) return 0;

    try {
      const multiplyNum = new bigDecimal(Math.pow(10, iDecimal));
      const convertValue = new bigDecimal(Number(strValue));
      const result = multiplyNum.multiply(convertValue);
      return result.getValue();
    } catch {
      return 0;
    }
};

const pair = new PublicKey(PYUSD_WSOL_POOL_DEVNET.address);
const pairInfo = await sarosDLMM.getPairAccount(pair);
const activeBin = pairInfo.activeId;

const binArrayList = getMaxBinArray(binRange, activeBin);

const binsAndVaultsTx = new Transaction();

await Promise.all([
    ...binArrayList.map(async (bin) => {
        await sarosDLMM.getBinArray({
            binArrayIndex: bin.binArrayLowerIndex,
            pair: pair,
            payer: wallet.publicKey,
            transaction: binsAndVaultsTx as any,
        })

        await sarosDLMM.getBinArray({
            binArrayIndex: bin.binArrayUpperIndex,
            pair: pair,
            payer: wallet.publicKey,
            transaction: binsAndVaultsTx as any,
        })
    }),
    ...[PYUSD_WSOL_POOL_DEVNET.baseToken, PYUSD_WSOL_POOL_DEVNET.quoteToken].map(async (token) => {
        await sarosDLMM.getPairVaultInfo({
            pair: pair,
            payer: wallet.publicKey,
            transaction: binsAndVaultsTx as any,
            tokenAddress: new PublicKey(token.mintAddress),
        })

        await sarosDLMM.getUserVaultInfo({
            payer: wallet.publicKey,
            transaction: binsAndVaultsTx as any,
            tokenAddress: new PublicKey(token.mintAddress),
        })
    })
])

if (binsAndVaultsTx.instructions.length > 0) {
    binsAndVaultsTx.recentBlockhash = blockhash;
    binsAndVaultsTx.feePayer = wallet.publicKey;
    allTxs.push(binsAndVaultsTx);
}

const maxPositionList = getMaxPosition(binRange, activeBin)
const userPositions = await sarosDLMM.getUserPositions({ payer: wallet.publicKey, pair })


const maxLiquidityDistribution = createUniformDistribution({ shape:LiquidityShape.Spot, binRange})

const maxLiquidityDistributions = await Promise.all( maxPositionList.map( async (position) => {
    const {
        range,
        binLower,
        binUpper,
      } = getBinRange(position, activeBin);

      const currentPosition = userPositions.find(findPosition(position, activeBin))

      const findStartIndex = maxLiquidityDistribution.findIndex(
        (item) => item.relativeBinId === range[0]
      );
      const startIndex = findStartIndex === -1 ? 0 : findStartIndex;

      const findEndIndex = maxLiquidityDistribution.findIndex(
        (item) => item.relativeBinId === range[1]
      );
      const endIndex =
        findEndIndex === -1 ? maxLiquidityDistribution.length : findEndIndex + 1;

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
    
    if(!currentPosition){
        const createPositionTx = new Transaction();

        const newPositionMint = Keypair.generate();

        const { position } = await sarosDLMM.createPosition({
            pair: new PublicKey(pair),
            payer: wallet.publicKey,
            relativeBinIdLeft: range[0]!,
            relativeBinIdRight: range[1]!,
            binArrayIndex: binArray.binArrayLowerIndex,
            positionMint: newPositionMint.publicKey,
            transaction: createPositionTx as any,
        });

        console.log(position)

        createPositionTx.recentBlockhash = blockhash;
        createPositionTx.feePayer = wallet.publicKey;
        
        // Sign the transaction with both wallet and position mint
        createPositionTx.sign(wallet, newPositionMint);
        
        allTxs.push(createPositionTx);
        
        // Use the newly created position mint
        positionMint = newPositionMint.publicKey;
    } else {
        // Use the existing position mint
        positionMint = currentPosition.positionMint;
    }

    return {
        positionMint: positionMint,
        position,
        liquidityDistribution,
        binArrayLower: binArrayLower.toString(),
        binArrayUpper: binArrayUpper.toString(),
    }

}))

await Promise.all(
    maxLiquidityDistributions.map(async (maxLiquidityDistribution) => {
        const {
            positionMint,
            liquidityDistribution,
            binArrayLower,
            binArrayUpper,
          } = maxLiquidityDistribution;

          const addLiquidityTx = new Transaction()

    await sarosDLMM.addLiquidityIntoPosition({
        amountX: Number(convertBalanceToWei(0.1, PYUSD_TOKEN_DEVNET.decimals)),
        amountY: Number(convertBalanceToWei(0.1, WSOL_TOKEN_DEVNET.decimals)),
        positionMint: positionMint,
        liquidityDistribution: liquidityDistribution,
        binArrayLower: new PublicKey(binArrayLower),
        binArrayUpper: new PublicKey(binArrayUpper),
        transaction: addLiquidityTx as any,
        payer: wallet.publicKey,
        pair: pair,
    })

    addLiquidityTx.recentBlockhash = blockhash;
    addLiquidityTx.feePayer = wallet.publicKey;
    allTxs.push(addLiquidityTx);

})    
)

// Sign and send all transactions
console.log(`Signing and sending ${allTxs.length} transactions...`);

for (let i = 0; i < allTxs.length; i++) {
    const tx = allTxs[i];
    if (!tx) {
        console.log(`Skipping undefined transaction at index ${i}`);
        continue;
    }
    console.log(`Processing transaction ${i + 1}/${allTxs.length}...`);
    
    try {
        // Check if transaction is already signed (position creation transactions are pre-signed)
        if (tx.signatures.length === 0) {
            // Sign the transaction if not already signed
            tx.sign(wallet);
        }
        
        // Send the transaction - use sendRawTransaction for pre-signed transactions
        const signature = await connection.sendRawTransaction(tx.serialize(), {
            skipPreflight: false,
            preflightCommitment: "confirmed",
        });
        
        console.log(`Transaction ${i + 1} sent successfully! Signature: ${signature}`);
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(signature, "confirmed");
        if (confirmation.value.err) {
            console.error(`Transaction ${i + 1} failed:`, confirmation.value.err);
        } else {
            console.log(`Transaction ${i + 1} confirmed successfully!`);
        }
        
    } catch (error) {
        console.error(`Failed to process transaction ${i + 1}:`, error);
        throw error;
    }
}

console.log("All transactions completed!");