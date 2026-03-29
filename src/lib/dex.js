import { getServer, NETWORKS } from "./stellar";

export async function fetchOrderBook(
  sellingAsset,
  buyingAsset,
  network = "testnet",
  limit = 20,
) {
  const server = getServer(network);

  const orderbook = await server
    .orderbook(sellingAsset, buyingAsset)
    .limit(limit)
    .call();

  return {
    bids: orderbook.bids || [],
    asks: orderbook.asks || [],
    base: orderbook.base,
    counter: orderbook.counter,
  };
}

export async function fetchTrades(
  baseAsset,
  counterAsset,
  network = "testnet",
  limit = 50,
) {
  const server = getServer(network);

  const trades = await server
    .trades()
    .forAssetPair(baseAsset, counterAsset)
    .order("desc")
    .limit(limit)
    .call();

  return trades.records || [];
}

export async function fetchAllAssets(network = "testnet", limit = 200) {
  const server = getServer(network);

  const assets = await server.assets().limit(limit).call();

  return assets.records || [];
}

export async function fetchLiquidityPools(network = "testnet", limit = 50) {
  const server = getServer(network);

  const pools = await server.liquidityPools().limit(limit).call();

  return pools.records || [];
}

export function formatAsset(asset) {
  if (asset.isNative()) {
    return { type: "native", code: "XLM", issuer: null };
  }
  return {
    type: asset.getAssetType(),
    code: asset.getCode(),
    issuer: asset.getIssuer(),
  };
}

export function parseAssetString(assetStr) {
  if (assetStr === "native" || assetStr === "XLM") {
    return { type: "native", code: "XLM" };
  }

  const parts = assetStr.split(":");
  if (parts.length !== 2) {
    throw new Error('Invalid asset format. Use "CODE:ISSUER" or "native"');
  }

  return {
    type: parts[0].length <= 4 ? "credit_alphanum4" : "credit_alphanum12",
    code: parts[0],
    issuer: parts[1],
  };
}

export function calculateSpread(bids, asks) {
  if (!bids.length || !asks.length) return null;

  const bestBid = parseFloat(bids[0].price);
  const bestAsk = parseFloat(asks[0].price);

  return {
    absolute: bestAsk - bestBid,
    percentage: ((bestAsk - bestBid) / bestBid) * 100,
  };
}

export function aggregateOrderBookDepth(orders, levels = 10) {
  const aggregated = [];
  let cumulativeAmount = 0;

  for (let i = 0; i < Math.min(orders.length, levels); i++) {
    const order = orders[i];
    cumulativeAmount += parseFloat(order.amount);

    aggregated.push({
      price: parseFloat(order.price),
      amount: parseFloat(order.amount),
      cumulative: cumulativeAmount,
    });
  }

  return aggregated;
}
