import { sarosDLMM } from "./service.js";
import { PublicKey } from "@solana/web3.js";
const allPools = await sarosDLMM.fetchPoolAddresses();
for (const pool of allPools) {
    if (pool) {
        const poolMetadata = await sarosDLMM.fetchPoolMetadata(pool);
        if (poolMetadata.extra.tokenBaseDecimal === 0 || poolMetadata.extra.tokenQuoteDecimal === 0) {
            console.warn(`Skipping pool ${pool} due to zero decimal places`);
            continue;
        }
        const quoteParams = {
            pair: new PublicKey(pool),
            tokenBase: new PublicKey(poolMetadata.baseMint),
            tokenQuote: new PublicKey(poolMetadata.quoteMint),
            amount: BigInt(1000000),
            swapForY: true,
            isExactInput: true,
            tokenBaseDecimal: poolMetadata.extra.tokenBaseDecimal,
            tokenQuoteDecimal: poolMetadata.extra.tokenQuoteDecimal,
            slippage: 0.1
        };
        try {
            const quote = await sarosDLMM.getQuote(quoteParams);
            console.log(`Pool: ${pool} Quote:`, quote);
        }
        catch (error) {
            console.error(`Error fetching quote for pool ${pool}:`, error);
        }
    }
}
//# sourceMappingURL=swap.js.map