"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type {
  ClientExchange,
  ClientWallet,
  ClientUploadToken,
} from "@/lib/types/expert";

/* ═══════════════════════ TYPES ═══════════════════════ */

interface DataCollectionTabProps {
  clientId: string;
  clientCountries: string[];
}

interface NewExchangeForm {
  exchange_name: string;
  exchange_type: string;
}

interface NewWalletForm {
  wallet_address: string;
  blockchain: string;
  wallet_type: string;
  label: string;
}

/* ═══════════════════════ CONSTANTS ═══════════════════════ */

const BLOCKCHAINS = [
  "Ethereum",
  "Bitcoin",
  "Solana",
  "Polygon",
  "Avalanche",
  "BNB Chain",
  "Arbitrum",
  "Optimism",
  "Base",
  "Other",
];

const WALLET_TYPES = [
  "Hot Wallet",
  "Cold Wallet",
  "Exchange Wallet",
  "DeFi",
  "Other",
];

const EMPTY_EXCHANGE_FORM: NewExchangeForm = {
  exchange_name: "",
  exchange_type: "cex",
};

const EMPTY_WALLET_FORM: NewWalletForm = {
  wallet_address: "",
  blockchain: "Ethereum",
  wallet_type: "Hot Wallet",
  label: "",
};

/* ═══════════════════════ HELPERS ═══════════════════════ */

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function isTokenValid(token: ClientUploadToken): boolean {
  return new Date(token.expires_at) > new Date();
}

/* ═══════════════════════ SUB-COMPONENTS ═══════════════════════ */

function StatusToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`inline-flex items-center justify-center w-6 h-6 rounded transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${
        checked
          ? "bg-teal/20 text-teal hover:bg-teal/30"
          : "bg-red-500/15 text-red-400 hover:bg-red-500/25"
      }`}
    >
      {checked ? (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </button>
  );
}

function InlineNumberEditor({
  value,
  onSave,
}: {
  value: number | null;
  onSave: (val: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.toString() ?? "");

  function handleSave() {
    const parsed = draft.trim() === "" ? null : parseInt(draft, 10);
    if (draft.trim() !== "" && isNaN(parsed as number)) {
      setDraft(value?.toString() ?? "");
      setEditing(false);
      return;
    }
    onSave(parsed);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setDraft(value?.toString() ?? "");
            setEditing(false);
          }
        }}
        className="w-20 bg-navy border border-gray-700 rounded px-2 py-0.5 text-xs text-white text-center focus:outline-none focus:border-gold/50 transition-colors"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(value?.toString() ?? "");
        setEditing(true);
      }}
      className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-white/5 min-w-[40px] text-center"
      title="Click to edit"
    >
      {value !== null && value !== undefined ? value.toLocaleString() : "—"}
    </button>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
      title="Delete"
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */

export default function DataCollectionTab({
  clientId,
}: DataCollectionTabProps) {
  const supabase = createClient();

  /* ── State ── */
  const [exchanges, setExchanges] = useState<ClientExchange[]>([]);
  const [wallets, setWallets] = useState<ClientWallet[]>([]);
  const [uploadToken, setUploadToken] = useState<ClientUploadToken | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const [exchangeForm, setExchangeForm] =
    useState<NewExchangeForm>(EMPTY_EXCHANGE_FORM);
  const [savingExchange, setSavingExchange] = useState(false);

  const [showWalletForm, setShowWalletForm] = useState(false);
  const [walletForm, setWalletForm] =
    useState<NewWalletForm>(EMPTY_WALLET_FORM);
  const [savingWallet, setSavingWallet] = useState(false);

  const [generatingToken, setGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);

  /* ── Data Fetching ── */
  const fetchData = useCallback(async () => {
    const [exchangeRes, walletRes, tokenRes] = await Promise.all([
      supabase
        .from("client_exchanges")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true }),
      supabase
        .from("client_wallets")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true }),
      supabase
        .from("client_upload_tokens")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    setExchanges((exchangeRes.data ?? []) as ClientExchange[]);
    setWallets((walletRes.data ?? []) as ClientWallet[]);

    const latestToken =
      tokenRes.data && tokenRes.data.length > 0
        ? (tokenRes.data[0] as ClientUploadToken)
        : null;
    if (latestToken && isTokenValid(latestToken)) {
      setUploadToken(latestToken);
    } else {
      setUploadToken(null);
    }

    setLoading(false);
  }, [clientId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Progress Calculation ── */
  const totalSources = exchanges.length + wallets.length;
  const importedSources =
    exchanges.filter((e) => e.imported_to_koinly).length +
    wallets.filter((w) => w.imported_to_koinly).length;
  const progressPercent =
    totalSources > 0 ? Math.round((importedSources / totalSources) * 100) : 0;

  /* ── Exchange Actions ── */
  async function toggleExchangeField(
    exchange: ClientExchange,
    field: "api_key_provided" | "csv_provided" | "imported_to_koinly"
  ) {
    const newValue = !exchange[field];
    const { error } = await supabase
      .from("client_exchanges")
      .update({ [field]: newValue })
      .eq("id", exchange.id);

    if (!error) {
      setExchanges((prev) =>
        prev.map((e) => (e.id === exchange.id ? { ...e, [field]: newValue } : e))
      );
    }
  }

  async function updateExchangeTxCount(
    exchangeId: string,
    count: number | null
  ) {
    const { error } = await supabase
      .from("client_exchanges")
      .update({ transaction_count: count })
      .eq("id", exchangeId);

    if (!error) {
      setExchanges((prev) =>
        prev.map((e) =>
          e.id === exchangeId ? { ...e, transaction_count: count } : e
        )
      );
    }
  }

  async function deleteExchange(exchangeId: string) {
    const { error } = await supabase
      .from("client_exchanges")
      .delete()
      .eq("id", exchangeId);

    if (!error) {
      setExchanges((prev) => prev.filter((e) => e.id !== exchangeId));
    }
  }

  async function addExchange() {
    if (!exchangeForm.exchange_name.trim()) return;
    setSavingExchange(true);

    const { data, error } = await supabase
      .from("client_exchanges")
      .insert({
        client_id: clientId,
        exchange_name: exchangeForm.exchange_name.trim(),
        exchange_type: exchangeForm.exchange_type,
        api_key_provided: false,
        csv_provided: false,
        imported_to_koinly: false,
        transaction_count: null,
      })
      .select()
      .single();

    if (!error && data) {
      setExchanges((prev) => [...prev, data as ClientExchange]);
      setExchangeForm(EMPTY_EXCHANGE_FORM);
      setShowExchangeForm(false);
    }

    setSavingExchange(false);
  }

  /* ── Wallet Actions ── */
  async function toggleWalletImported(wallet: ClientWallet) {
    const newValue = !wallet.imported_to_koinly;
    const { error } = await supabase
      .from("client_wallets")
      .update({ imported_to_koinly: newValue })
      .eq("id", wallet.id);

    if (!error) {
      setWallets((prev) =>
        prev.map((w) =>
          w.id === wallet.id ? { ...w, imported_to_koinly: newValue } : w
        )
      );
    }
  }

  async function updateWalletTxCount(walletId: string, count: number | null) {
    const { error } = await supabase
      .from("client_wallets")
      .update({ transaction_count: count })
      .eq("id", walletId);

    if (!error) {
      setWallets((prev) =>
        prev.map((w) =>
          w.id === walletId ? { ...w, transaction_count: count } : w
        )
      );
    }
  }

  async function deleteWallet(walletId: string) {
    const { error } = await supabase
      .from("client_wallets")
      .delete()
      .eq("id", walletId);

    if (!error) {
      setWallets((prev) => prev.filter((w) => w.id !== walletId));
    }
  }

  async function addWallet() {
    if (!walletForm.wallet_address.trim()) return;
    setSavingWallet(true);

    const { data, error } = await supabase
      .from("client_wallets")
      .insert({
        client_id: clientId,
        wallet_address: walletForm.wallet_address.trim(),
        blockchain: walletForm.blockchain,
        wallet_type: walletForm.wallet_type,
        label: walletForm.label.trim() || null,
        imported_to_koinly: false,
        transaction_count: null,
      })
      .select()
      .single();

    if (!error && data) {
      setWallets((prev) => [...prev, data as ClientWallet]);
      setWalletForm(EMPTY_WALLET_FORM);
      setShowWalletForm(false);
    }

    setSavingWallet(false);
  }

  /* ── Upload Token Actions ── */
  async function generateUploadToken() {
    setGeneratingToken(true);
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data, error } = await supabase
      .from("client_upload_tokens")
      .insert({
        client_id: clientId,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (!error && data) {
      setUploadToken(data as ClientUploadToken);
    }

    setGeneratingToken(false);
  }

  function copyUploadLink() {
    if (!uploadToken) return;
    const url = `https://app.handytax.io/upload/${uploadToken.token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-navy-light border border-gray-700 rounded-xl p-5"
          >
            <div className="h-5 w-40 bg-gray-700/50 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-700/50 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-700/50 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ═══════════════════════ RENDER ═══════════════════════ */

  return (
    <div className="space-y-4">
      {/* ── Overall Progress ── */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-200">
            Import Progress
          </h3>
          <span className="text-sm text-gray-400">
            {importedSources} of {totalSources} sources imported
          </span>
        </div>
        <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-teal transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {totalSources === 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Add exchanges and wallets below to start tracking import progress.
          </p>
        )}
      </div>

      {/* ── Exchanges Section ── */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200">Exchanges</h3>
          <span className="text-xs text-gray-500">
            {exchanges.length} {exchanges.length === 1 ? "exchange" : "exchanges"}
          </span>
        </div>

        {exchanges.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-2 pr-3">
                    Name
                  </th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-2 pr-3">
                    Type
                  </th>
                  <th className="text-center text-xs text-gray-500 uppercase tracking-wider pb-2 pr-3">
                    API Key
                  </th>
                  <th className="text-center text-xs text-gray-500 uppercase tracking-wider pb-2 pr-3">
                    CSV
                  </th>
                  <th className="text-center text-xs text-gray-500 uppercase tracking-wider pb-2 pr-3">
                    Koinly
                  </th>
                  <th className="text-center text-xs text-gray-500 uppercase tracking-wider pb-2 pr-3">
                    Txns
                  </th>
                  <th className="pb-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {exchanges.map((exchange) => (
                  <tr
                    key={exchange.id}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2.5 pr-3">
                      <span className="text-sm text-white font-medium">
                        {exchange.exchange_name}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                          exchange.exchange_type === "cex"
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                        }`}
                      >
                        {exchange.exchange_type}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-center">
                      <StatusToggle
                        checked={exchange.api_key_provided}
                        onChange={() =>
                          toggleExchangeField(exchange, "api_key_provided")
                        }
                      />
                    </td>
                    <td className="py-2.5 pr-3 text-center">
                      <StatusToggle
                        checked={exchange.csv_provided}
                        onChange={() =>
                          toggleExchangeField(exchange, "csv_provided")
                        }
                      />
                    </td>
                    <td className="py-2.5 pr-3 text-center">
                      <StatusToggle
                        checked={exchange.imported_to_koinly}
                        onChange={() =>
                          toggleExchangeField(exchange, "imported_to_koinly")
                        }
                      />
                    </td>
                    <td className="py-2.5 pr-3 text-center">
                      <InlineNumberEditor
                        value={exchange.transaction_count}
                        onSave={(val) => updateExchangeTxCount(exchange.id, val)}
                      />
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DeleteButton
                          onClick={() => deleteExchange(exchange.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-6">
            No exchanges added yet
          </p>
        )}

        {/* Add Exchange Form */}
        {showExchangeForm ? (
          <div className="mt-4 p-4 bg-navy border border-gray-700 rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Exchange Name
                </label>
                <input
                  type="text"
                  value={exchangeForm.exchange_name}
                  onChange={(e) =>
                    setExchangeForm((f) => ({
                      ...f,
                      exchange_name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Binance, Coinbase, Kraken"
                  className="w-full bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Exchange Type
                </label>
                <select
                  value={exchangeForm.exchange_type}
                  onChange={(e) =>
                    setExchangeForm((f) => ({
                      ...f,
                      exchange_type: e.target.value,
                    }))
                  }
                  className="w-full bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50 transition-colors"
                >
                  <option value="cex">CEX (Centralized Exchange)</option>
                  <option value="dex">DEX (Decentralized Exchange)</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => {
                  setShowExchangeForm(false);
                  setExchangeForm(EMPTY_EXCHANGE_FORM);
                }}
                className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:border-gold/40 hover:text-gold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addExchange}
                disabled={
                  savingExchange || !exchangeForm.exchange_name.trim()
                }
                className="px-4 py-2 rounded-lg bg-gold text-navy font-semibold text-sm hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingExchange ? "Saving..." : "Save Exchange"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowExchangeForm(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-700 text-sm text-gray-500 hover:border-gold/30 hover:text-gold transition-colors w-full justify-center"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Exchange
          </button>
        )}
      </div>

      {/* ── Wallets Section ── */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200">Wallets</h3>
          <span className="text-xs text-gray-500">
            {wallets.length} {wallets.length === 1 ? "wallet" : "wallets"}
          </span>
        </div>

        {wallets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-2 pr-3">
                    Label
                  </th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-2 pr-3">
                    Address
                  </th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-2 pr-3">
                    Chain
                  </th>
                  <th className="text-center text-xs text-gray-500 uppercase tracking-wider pb-2 pr-3">
                    Koinly
                  </th>
                  <th className="text-center text-xs text-gray-500 uppercase tracking-wider pb-2 pr-3">
                    Txns
                  </th>
                  <th className="pb-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {wallets.map((wallet) => (
                  <tr
                    key={wallet.id}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2.5 pr-3">
                      <span className="text-sm text-white">
                        {wallet.label || "Unnamed"}
                      </span>
                      {wallet.wallet_type && (
                        <span className="ml-2 text-[10px] text-gray-500">
                          {wallet.wallet_type}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      <code
                        className="text-xs text-gray-400 bg-navy px-2 py-0.5 rounded font-mono"
                        title={wallet.wallet_address}
                      >
                        {truncateAddress(wallet.wallet_address)}
                      </code>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-gray-700/50 text-gray-300 border border-gray-700">
                        {wallet.blockchain}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-center">
                      <StatusToggle
                        checked={wallet.imported_to_koinly}
                        onChange={() => toggleWalletImported(wallet)}
                      />
                    </td>
                    <td className="py-2.5 pr-3 text-center">
                      <InlineNumberEditor
                        value={wallet.transaction_count}
                        onSave={(val) => updateWalletTxCount(wallet.id, val)}
                      />
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DeleteButton
                          onClick={() => deleteWallet(wallet.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-6">
            No wallets added yet
          </p>
        )}

        {/* Add Wallet Form */}
        {showWalletForm ? (
          <div className="mt-4 p-4 bg-navy border border-gray-700 rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={walletForm.wallet_address}
                  onChange={(e) =>
                    setWalletForm((f) => ({
                      ...f,
                      wallet_address: e.target.value,
                    }))
                  }
                  placeholder="0x... or bc1... or equivalent"
                  className="w-full bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors font-mono"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Blockchain
                </label>
                <select
                  value={walletForm.blockchain}
                  onChange={(e) =>
                    setWalletForm((f) => ({
                      ...f,
                      blockchain: e.target.value,
                    }))
                  }
                  className="w-full bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50 transition-colors"
                >
                  {BLOCKCHAINS.map((chain) => (
                    <option key={chain} value={chain}>
                      {chain}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Wallet Type
                </label>
                <select
                  value={walletForm.wallet_type}
                  onChange={(e) =>
                    setWalletForm((f) => ({
                      ...f,
                      wallet_type: e.target.value,
                    }))
                  }
                  className="w-full bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50 transition-colors"
                >
                  {WALLET_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">
                  Label{" "}
                  <span className="text-gray-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={walletForm.label}
                  onChange={(e) =>
                    setWalletForm((f) => ({ ...f, label: e.target.value }))
                  }
                  placeholder="e.g. Main ETH Wallet, Cold Storage"
                  className="w-full bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => {
                  setShowWalletForm(false);
                  setWalletForm(EMPTY_WALLET_FORM);
                }}
                className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:border-gold/40 hover:text-gold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addWallet}
                disabled={savingWallet || !walletForm.wallet_address.trim()}
                className="px-4 py-2 rounded-lg bg-gold text-navy font-semibold text-sm hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingWallet ? "Saving..." : "Save Wallet"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowWalletForm(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-700 text-sm text-gray-500 hover:border-gold/30 hover:text-gold transition-colors w-full justify-center"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Wallet
          </button>
        )}
      </div>

      {/* ── Client Upload Link ── */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">
              Client Upload Link
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Generate a secure link for your client to upload exchange CSVs and
              wallet data directly.
            </p>
          </div>
        </div>

        {uploadToken ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-navy border border-gray-700 rounded-lg">
              <code className="text-xs text-gold flex-1 truncate font-mono">
                https://app.handytax.io/upload/{uploadToken.token}
              </code>
              <button
                onClick={copyUploadLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                  copied
                    ? "bg-teal/20 text-teal border border-teal/30"
                    : "bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20"
                }`}
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Expires:{" "}
                {new Date(uploadToken.expires_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={generateUploadToken}
                disabled={generatingToken}
                className="text-xs text-gray-500 hover:text-gold transition-colors"
              >
                Generate new link
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={generateUploadToken}
            disabled={generatingToken}
            className="px-4 py-2 rounded-lg bg-gold text-navy font-semibold text-sm hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingToken ? "Generating..." : "Generate Client Upload Link"}
          </button>
        )}
      </div>
    </div>
  );
}
