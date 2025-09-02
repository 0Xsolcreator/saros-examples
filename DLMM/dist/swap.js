import { sarosDLMM } from "./service.js";
import { PublicKey } from "@solana/web3.js";
const userbalance = await sarosDLMM.getUserPositions({
    payer: new PublicKey("AkuSSKFZ4BDDCDGR3DB3Fq2sKeRfVosqFeRnANRS3AL9"),
    pair: new PublicKey("H9EPqQKCvv9ddzK6KHjo8vvUPMLMJXmMmru9KUYNaDFQ")
});
console.log(userbalance);
//# sourceMappingURL=swap.js.map