
export const PYUSD_TOKEN_DEVNET = {
    id: "pyusd",
    mintAddress: "CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM",
    symbol: "PYUSD",
    name: "PAYPAL USD",
    decimals: 6,
}

export const WSOL_TOKEN_DEVNET = {
    id: "wsol",
    mintAddress: "So11111111111111111111111111111111111111112",
    symbol: "WSOL",
    name: "Wrapped SOL",
    decimals: 9,
}

export const PYUSD_WSOL_POOL_DEVNET = {
    address: "H9EPqQKCvv9ddzK6KHjo8vvUPMLMJXmMmru9KUYNaDFQ",
    baseToken: PYUSD_TOKEN_DEVNET,
    quoteToken: WSOL_TOKEN_DEVNET,
    slippage: 0.5,
}