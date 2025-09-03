import { Dialect } from "@dialectlabs/sdk";
import { SolanaSdkFactory } from "@dialectlabs/blockchain-sdk-solana";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
console.log("Testing Dialect SDK initialization...");
try {
    // Try a simpler initialization approach
    const wallet = Keypair.fromSecretKey(bs58.decode("3SBakQxEu245aJVjHtRp9BmwD4PJJYbURYPyqfhxWGxV2FYpMhtUpfHyWUnJkQvb57pyyvirFwADXByQSAPpWkwd"));
    console.log("Wallet created:", wallet.publicKey.toString());
    // Try with different environment
    const dialectSolanaSDK = Dialect.sdk({ environment: "production" }, // Try production instead of development
    SolanaSdkFactory.create({
        wallet: wallet
    }));
    console.log("Dialect SDK initialized successfully!");
}
catch (error) {
    console.error("Error initializing Dialect SDK:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
}
//# sourceMappingURL=test-dialect.js.map