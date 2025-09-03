import { Keypair, Transaction, PublicKey, VersionedTransaction } from "@solana/web3.js";
/**
 * Custom wallet adapter that implements the required interface for Dialect SDK
 */
export declare class CustomWalletAdapter {
    private keypair;
    constructor(keypair: Keypair);
    get publicKey(): PublicKey;
    signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;
    get connected(): boolean;
    get connecting(): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}
/**
 * Load keypair from Solana CLI default location
 * @returns Keypair object that can be used to sign transactions
 */
export declare function loadWalletFromCLI(): Keypair;
/**
 * Load keypair from a custom path
 * @param path - Path to the keypair JSON file
 * @returns Keypair object
 */
export declare function loadWalletFromPath(path: string): Keypair;
/**
 * Alternative: Load from default Solana CLI location (~/.config/solana/id.json)
 * Use this if your keypair is in the default location
 */
export declare function loadWalletFromDefaultPath(): Keypair;
//# sourceMappingURL=wallet.d.ts.map