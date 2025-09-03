import { Keypair, Transaction, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

/**
 * Custom wallet adapter that implements the required interface for Dialect SDK
 */
export class CustomWalletAdapter {
  private keypair: Keypair;

  constructor(keypair: Keypair) {
    this.keypair = keypair;
  }

  get publicKey(): PublicKey {
    return this.keypair.publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    if (transaction instanceof Transaction) {
      transaction.sign(this.keypair);
    } else if (transaction instanceof VersionedTransaction) {
      transaction.sign([this.keypair]);
    }
    return transaction;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    return transactions.map(tx => {
      if (tx instanceof Transaction) {
        tx.sign(this.keypair);
      } else if (tx instanceof VersionedTransaction) {
        tx.sign([this.keypair]);
      }
      return tx;
    });
  }

  // Required properties for wallet adapter compatibility
  get connected(): boolean {
    return true;
  }

  get connecting(): boolean {
    return false;
  }

  async connect(): Promise<void> {
    // Already connected
  }

  async disconnect(): Promise<void> {
    // No-op
  }
}

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
