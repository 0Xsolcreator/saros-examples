import { Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
/**
 * Custom wallet adapter that implements the required interface for Dialect SDK
 */
export class CustomWalletAdapter {
    keypair;
    constructor(keypair) {
        this.keypair = keypair;
    }
    get publicKey() {
        return this.keypair.publicKey;
    }
    async signTransaction(transaction) {
        if (transaction instanceof Transaction) {
            transaction.sign(this.keypair);
        }
        else if (transaction instanceof VersionedTransaction) {
            transaction.sign([this.keypair]);
        }
        return transaction;
    }
    async signAllTransactions(transactions) {
        return transactions.map(tx => {
            if (tx instanceof Transaction) {
                tx.sign(this.keypair);
            }
            else if (tx instanceof VersionedTransaction) {
                tx.sign([this.keypair]);
            }
            return tx;
        });
    }
    // Required properties for wallet adapter compatibility
    get connected() {
        return true;
    }
    get connecting() {
        return false;
    }
    async connect() {
        // Already connected
    }
    async disconnect() {
        // No-op
    }
}
/**
 * Load keypair from Solana CLI default location
 * @returns Keypair object that can be used to sign transactions
 */
export function loadWalletFromCLI() {
    try {
        // Load from the current CLI configured keypair path
        const keypairPath = "/home/creator/my-keypair.json";
        const keypairData = readFileSync(keypairPath, "utf8");
        const secretKey = JSON.parse(keypairData);
        return Keypair.fromSecretKey(new Uint8Array(secretKey));
    }
    catch (error) {
        console.error("Failed to load wallet from Solana CLI:", error);
        throw new Error("Could not load wallet. Make sure you have a keypair set up with 'solana-keygen new'");
    }
}
/**
 * Load keypair from a custom path
 * @param path - Path to the keypair JSON file
 * @returns Keypair object
 */
export function loadWalletFromPath(path) {
    try {
        const keypairData = readFileSync(path, "utf8");
        const secretKey = JSON.parse(keypairData);
        return Keypair.fromSecretKey(new Uint8Array(secretKey));
    }
    catch (error) {
        console.error(`Failed to load wallet from path ${path}:`, error);
        throw new Error(`Could not load wallet from ${path}`);
    }
}
/**
 * Alternative: Load from default Solana CLI location (~/.config/solana/id.json)
 * Use this if your keypair is in the default location
 */
export function loadWalletFromDefaultPath() {
    try {
        const defaultPath = join(homedir(), ".config", "solana", "id.json");
        return loadWalletFromPath(defaultPath);
    }
    catch (error) {
        console.error("Failed to load wallet from default path:", error);
        throw new Error("Could not load wallet from default Solana CLI path");
    }
}
//# sourceMappingURL=wallet.js.map