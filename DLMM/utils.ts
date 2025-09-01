import { sarosDLMM } from "./service.js";

const allPools = await sarosDLMM.fetchPoolAddresses()

console.log(allPools)

console.log(allPools.find(pool => pool === "H9EPqQKCvv9ddzK6KHjo8vvUPMLMJXmMmru9KUYNaDFQ"))

console.log(await sarosDLMM.fetchPoolMetadata("H9EPqQKCvv9ddzK6KHjo8vvUPMLMJXmMmru9KUYNaDFQ"))