const mismatch = [];

for(let slippage = 0.01; slippage <= 100; slippage += 0.01) {
    const PRECISION = 1_000_000_000;
    const slippageBps = Math.round(slippage * 100);
    const slippageScaledBps = (slippageBps * PRECISION) / 10_000; 

    const slippageFraction = slippage / 100;
    const slippageScaledFraction = Math.round(slippageFraction * PRECISION);

    console.log('slippageScaledBps : slippageScaledFraction', slippageScaledBps, slippageScaledFraction, slippageScaledFraction === slippageScaledBps);
    if(slippageScaledFraction !== slippageScaledBps) {
        mismatch.push(slippage);
    } else {
        console.log('match', slippage);
    }
}

console.log('mismatch', mismatch);
console.log('mismatch.length', mismatch.length);