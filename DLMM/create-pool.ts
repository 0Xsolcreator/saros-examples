// import { Keypair } from "@solana/web3.js";
import { BIN_STEP_CONFIGS } from "@saros-finance/dlmm-sdk";
import { PYUSD_TOKEN_DEVNET, WSOL_TOKEN_DEVNET } from "./constants.js";
import { sarosDLMM } from "./service.js";
import { loadWalletFromCLI } from "./wallet.js";

const wallet = loadWalletFromCLI();
// const wallet1 = Keypair.generate();
console.log("Loaded wallet:", wallet.publicKey.toString());

const connection = sarosDLMM.connection;

const { blockhash } =
    await connection!.getLatestBlockhash({
    commitment: "confirmed",
});

const {tx, pair} = await sarosDLMM.createPairWithConfig({
    tokenBase: {
        mintAddress: PYUSD_TOKEN_DEVNET.mintAddress,
        decimal: PYUSD_TOKEN_DEVNET.decimals
    },
    tokenQuote: {
        mintAddress: WSOL_TOKEN_DEVNET.mintAddress,
        decimal: WSOL_TOKEN_DEVNET.decimals
    },
    binStep: BIN_STEP_CONFIGS[-1]?.binStep || 250,
    ratePrice: 1,
    payer: wallet.publicKey
});

tx.recentBlockhash = blockhash;
tx.feePayer = wallet.publicKey;

console.log(tx);

tx.sign(wallet);
const signature = await connection!.sendTransaction(tx, [wallet]);
console.log("Transaction signature:", signature);
console.log("pair address:", pair);