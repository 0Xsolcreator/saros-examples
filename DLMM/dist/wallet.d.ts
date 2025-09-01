import { Keypair } from "@solana/web3.js";
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