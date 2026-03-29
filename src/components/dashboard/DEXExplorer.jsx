import React, { useState, useEffect } from "react";
import { useStore } from "../../lib/store";
import {
  fetchOrderBook,
  fetchTrades,
  calculateSpread,
  aggregateOrderBookDepth,
} from "../../lib/dex";
import * as StellarSdk from "@stellar/stellar-sdk";

function Panel({ title, subtitle, children }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "13px",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              marginTop: "4px",
              fontSize: "11px",
              color: "var(--text-muted)",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <div style={{ padding: "18px" }}>{children}</div>
    </div>
  );
}

function LabeledField({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <span
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function textInputStyle() {
  return {
    width: "100%",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-bright)",
    borderRadius: "var(--radius-md)",
    padding: "10px 14px",
    color: "var(--text-primary)",
    fontSize: "13px",
    fontFamily: "var(--font-mono)",
    outline: "none",
    transition: "var(--transition)",
    boxSizing: "border-box",
  };
}

function ActionButton({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 16px",
        background: disabled ? "var(--bg-elevated)" : "var(--cyan)",
        color: disabled ? "var(--text-muted)" : "var(--bg-base)",
        border: disabled ? "1px solid var(--border)" : "none",
        borderRadius: "var(--radius-md)",
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        fontSize: "12px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "var(--transition)",
      }}
    >
      {label}
    </button>
  );
}

export default function DEXExplorer() {
  const { network } = useStore();

  const [sellingAsset, setSellingAsset] = useState("native");
  const [buyingAsset, setBuyingAsset] = useState("");
  const [orderBook, setOrderBook] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function parseAsset(assetStr) {
    if (assetStr === "native" || assetStr === "XLM" || assetStr === "") {
      return StellarSdk.Asset.native();
    }

    const parts = assetStr.split(":");
    if (parts.length !== 2) {
      throw new Error('Invalid asset format. Use "CODE:ISSUER"');
    }

    return new StellarSdk.Asset(parts[0], parts[1]);
  }

  async function handleFetchOrderBook() {
    setError("");
    setLoading(true);

    try {
      const selling = parseAsset(sellingAsset);
      const buying = parseAsset(buyingAsset);

      const [orderbookData, tradesData] = await Promise.all([
        fetchOrderBook(selling, buying, network),
        fetchTrades(selling, buying, network),
      ]);

      setOrderBook(orderbookData);
      setTrades(tradesData);
    } catch (err) {
      setError(err.message || "Failed to fetch order book");
    } finally {
      setLoading(false);
    }
  }

  const spread = orderBook
    ? calculateSpread(orderBook.bids, orderBook.asks)
    : null;
  const aggregatedBids = orderBook
    ? aggregateOrderBookDepth(orderBook.bids, 10)
    : [];
  const aggregatedAsks = orderBook
    ? aggregateOrderBookDepth(orderBook.asks, 10)
    : [];

  return (
    <div
      className="animate-in"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "22px",
          fontWeight: 700,
        }}
      >
        DEX Order Book Explorer
      </div>

      <Panel
        title="Asset Pair Selection"
        subtitle="Select trading pair to view order book and recent trades"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "14px",
            marginBottom: "14px",
          }}
        >
          <LabeledField label="Selling Asset">
            <input
              value={sellingAsset}
              onChange={(e) => setSellingAsset(e.target.value)}
              placeholder="native or CODE:ISSUER"
              style={textInputStyle()}
            />
          </LabeledField>

          <LabeledField label="Buying Asset">
            <input
              value={buyingAsset}
              onChange={(e) => setBuyingAsset(e.target.value)}
              placeholder="CODE:ISSUER"
              style={textInputStyle()}
            />
          </LabeledField>
        </div>

        <ActionButton
          label={loading ? "Loading..." : "Fetch Order Book"}
          onClick={handleFetchOrderBook}
          disabled={loading || !buyingAsset.trim()}
        />

        {error && (
          <div
            style={{ marginTop: "12px", fontSize: "12px", color: "var(--red)" }}
          >
            {error}
          </div>
        )}
      </Panel>

      {spread && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          <div
            style={{
              padding: "14px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              Spread
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--cyan)",
              }}
            >
              {spread.percentage.toFixed(2)}%
            </div>
          </div>

          <div
            style={{
              padding: "14px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              Best Bid
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--green)",
              }}
            >
              {orderBook.bids[0]?.price || "N/A"}
            </div>
          </div>

          <div
            style={{
              padding: "14px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              Best Ask
            </div>
            <div
              style={{ fontSize: "16px", fontWeight: 600, color: "var(--red)" }}
            >
              {orderBook.asks[0]?.price || "N/A"}
            </div>
          </div>
        </div>
      )}

      {orderBook && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <Panel title="Bids" subtitle="Buy orders">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {aggregatedBids.length === 0 ? (
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  No bids
                </div>
              ) : (
                aggregatedBids.map((bid, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "12px",
                    }}
                  >
                    <span style={{ color: "var(--green)" }}>
                      {bid.price.toFixed(7)}
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {bid.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Asks" subtitle="Sell orders">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {aggregatedAsks.length === 0 ? (
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  No asks
                </div>
              ) : (
                aggregatedAsks.map((ask, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "12px",
                    }}
                  >
                    <span style={{ color: "var(--red)" }}>
                      {ask.price.toFixed(7)}
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {ask.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      )}

      {trades.length > 0 && (
        <Panel
          title="Recent Trades"
          subtitle={`Last ${trades.length} trades for this pair`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {trades.slice(0, 10).map((trade, i) => (
              <div
                key={trade.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "12px",
                }}
              >
                <span style={{ color: "var(--text-primary)" }}>
                  {parseFloat(trade.price).toFixed(7)}
                </span>
                <span style={{ color: "var(--text-secondary)" }}>
                  {parseFloat(trade.base_amount).toFixed(2)}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                  {new Date(trade.ledger_close_time).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
