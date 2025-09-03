import { Dialect } from "@dialectlabs/sdk";
import { sarosDLMM } from "./service.js";
import { SolanaSdkFactory } from "@dialectlabs/blockchain-sdk-solana";
import { Monitors, Pipelines } from "@dialectlabs/monitor";
import { Subject } from "rxjs";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { CustomWalletAdapter } from "./wallet.js";
const TARGET_BASE_MINT = "CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM";
const dialectSolanaSDK = Dialect.sdk({ environment: "development" }, SolanaSdkFactory.create({
    wallet: new CustomWalletAdapter(Keypair.fromSecretKey(bs58.decode("3SBakQxEu245aJVjHtRp9BmwD4PJJYbURYPyqfhxWGxV2FYpMhtUpfHyWUnJkQvb57pyyvirFwADXByQSAPpWkwd")))
}));
const subject = new Subject();
const alertPoolCreation = async () => {
    await sarosDLMM.listenNewPoolAddress(async (poolAddress) => {
        const poolMetadata = await sarosDLMM.fetchPoolMetadata(poolAddress);
        if (poolMetadata.baseMint === TARGET_BASE_MINT) {
            subject.next({
                data: {
                    POOL_ADDRESS: poolAddress,
                    BASE_MINT: poolMetadata.baseMint,
                },
                groupingKey: poolAddress,
            });
        }
    });
};
alertPoolCreation();
const monitor = Monitors.builder({ sdk: dialectSolanaSDK })
    .defineDataSource()
    .push(subject)
    .transform({
    keys: ["POOL_ADDRESS"],
    pipelines: [
        Pipelines.createNew((upstream) => upstream // just passthrough here
        ),
    ],
})
    .notify()
    .dialectSdk(({ value }) => {
    return {
        title: "PYUSD pool creation",
        message: `🚨 New PYUSD pool with address ${value} was created`,
    };
}, { dispatch: "broadcast" })
    .and()
    .build();
monitor.start();
//# sourceMappingURL=alert-pool-creation.js.map