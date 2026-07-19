import { mkdir, writeFile } from "node:fs/promises";

const coins = [
  {
    accent: "green",
    mint: "A1afs3nmxoVfh7YDxHmiHHywJtH7CM9vhLNkUvVN3Vxb",
    fallbackName: "Rib It! 1",
    fallbackSymbol: "PPFR1"
  },
  {
    accent: "purple",
    mint: "TGtcV9hyQXGeznnggqffWkpCRwuMemL9BiF3SbkF6Ga",
    fallbackName: "Rib It! 2",
    fallbackSymbol: "PPFR2"
  },
  {
    accent: "green",
    mint: "B5BszZGez8JWAawUssyT9vKTAe2cfqJze4wmjn1LzyWP",
    fallbackName: "Rib It! 3",
    fallbackSymbol: "PPFR3"
  },
  {
    accent: "blue",
    mint: "Dx2yRpx6dyHrd4T8Xw7f69jA9YzQxS2KiFFCAbTdY4qE",
    fallbackName: "Rib It! 4",
    fallbackSymbol: "PPFR4"
  }
];

async function fetchCoin(coin) {
  const url = `https://frontend-api-v3.pump.fun/coins/${coin.mint}?sync=true`;
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "mad-pepe-github-pages/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`${coin.mint} returned ${response.status}`);
  }

  const data = await response.json();

  return {
    accent: coin.accent,
    mint: coin.mint,
    name: data.name || coin.fallbackName,
    symbol: data.symbol || coin.fallbackSymbol,
    marketCapUsd: Number(data.usd_market_cap ?? 0),
    marketCapSol: Number(data.market_cap ?? data.market_cap_quote ?? 0),
    athMarketCapUsd: Number(data.ath_market_cap ?? 0),
    complete: Boolean(data.complete),
    updatedAt: data.updated_at ? new Date(data.updated_at * 1000).toISOString() : null,
    pumpUrl: `https://pump.fun/coin/${coin.mint}`,
    dexUrl: `https://dexscreener.com/solana/${coin.mint}`
  };
}

const results = await Promise.allSettled(coins.map(fetchCoin));
const coinData = results.map((result, index) => {
  if (result.status === "fulfilled") {
    return result.value;
  }

  const coin = coins[index];
  return {
    accent: coin.accent,
    mint: coin.mint,
    name: coin.fallbackName,
    symbol: coin.fallbackSymbol,
    marketCapUsd: null,
    marketCapSol: null,
    athMarketCapUsd: null,
    complete: false,
    updatedAt: null,
    pumpUrl: `https://pump.fun/coin/${coin.mint}`,
    dexUrl: `https://dexscreener.com/solana/${coin.mint}`,
    error: result.reason instanceof Error ? result.reason.message : String(result.reason)
  };
});

const output = {
  source: "pump.fun",
  updatedAt: new Date().toISOString(),
  coins: coinData
};

await mkdir("data", { recursive: true });
await writeFile("data/coins.json", `${JSON.stringify(output, null, 2)}\n`);

const successCount = coinData.filter((coin) => Number.isFinite(coin.marketCapUsd)).length;
console.log(`Updated ${successCount}/${coins.length} coin market caps`);
