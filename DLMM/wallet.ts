import { Keypair } from "@solana/web3.js";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

/**
 * Load keypair from Solana CLI default location
 * @returns Keypair object that can be used to sign transactions
 */
export function loadWalletFromCLI(): Keypair {
  try {
    // Load from the current CLI configured keypair path
    const keypairPath = "/home/creator/my-keypair.json";
    const keypairData = readFileSync(keypairPath, "utf8");
    const secretKey = JSON.parse(keypairData);
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
  } catch (error) {
    console.error("Failed to load wallet from Solana CLI:", error);
    throw new Error("Could not load wallet. Make sure you have a keypair set up with 'solana-keygen new'");
  }
}

/**
 * Load keypair from a custom path
 * @param path - Path to the keypair JSON file
 * @returns Keypair object
 */
export function loadWalletFromPath(path: string): Keypair {
  try {
    const keypairData = readFileSync(path, "utf8");
    const secretKey = JSON.parse(keypairData);
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
  } catch (error) {
    console.error(`Failed to load wallet from path ${path}:`, error);
    throw new Error(`Could not load wallet from ${path}`);
  }
}

/**
 * Alternative: Load from default Solana CLI location (~/.config/solana/id.json)
 * Use this if your keypair is in the default location
 */
export function loadWalletFromDefaultPath(): Keypair {
  try {
    const defaultPath = join(homedir(), ".config", "solana", "id.json");
    return loadWalletFromPath(defaultPath);
  } catch (error) {
    console.error("Failed to load wallet from default path:", error);
    throw new Error("Could not load wallet from default Solana CLI path");
  }
}
