import { PYUSD_TOKEN_DEVNET, PYUSD_WSOL_POOL_DEVNET, WSOL_TOKEN_DEVNET } from "./constants.js";
import { sarosDLMM } from "./service.js";
import { PublicKey } from "@solana/web3.js";
import { loadWalletFromCLI } from "./wallet.js";

const wallet = loadWalletFromCLI();


const {amount, otherAmountOffset} = await sarosDLMM.getQuote({
    amount: BigInt(1e4),
    isExactInput: true,
    swapForY: true,
    pair: new PublicKey(PYUSD_WSOL_POOL_DEVNET.address),
    tokenBase: new PublicKey(PYUSD_TOKEN_DEVNET.mintAddress),
    tokenBaseDecimal: PYUSD_TOKEN_DEVNET.decimals,
    tokenQuote: new PublicKey(WSOL_TOKEN_DEVNET.mintAddress),
    tokenQuoteDecimal: WSOL_TOKEN_DEVNET.decimals,
    slippage: 0.5,  
})


const swapTx = await sarosDLMM.swap({
    amount,
    otherAmountOffset,
    pair: new PublicKey(PYUSD_WSOL_POOL_DEVNET.address),
    tokenMintX: new PublicKey(PYUSD_TOKEN_DEVNET.mintAddress),
    tokenMintY: new PublicKey(WSOL_TOKEN_DEVNET.mintAddress),
    swapForY: true,
    isExactInput: true,
    payer: wallet.publicKey,
    hook: sarosDLMM.hooksConfig,
})

const {blockhash} = await sarosDLMM.connection.getLatestBlockhash({ commitment: "confirmed" });

swapTx.recentBlockhash = blockhash;
swapTx.feePayer = wallet.publicKey;
swapTx.sign(wallet);

const signature = await sarosDLMM.connection.sendRawTransaction(swapTx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
})

console.log("Transaction signature:", signature);