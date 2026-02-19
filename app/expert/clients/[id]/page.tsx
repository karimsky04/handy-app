"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useExpert } from "@/lib/context/expert-auth-context";
import type { Client } from "@/lib/types/expert";
import OverviewTab from "./tabs/overview-tab";
import DataCollectionTab from "./tabs/data-collection-tab";
import QuoteBillingTab from "./tabs/quote-billing-tab";
import TasksTab from "./tabs/tasks-tab";
import MessagesTab from "./tabs/messages-tab";
import DocumentsTab from "./tabs/documents-tab";
import NotesTab from "./tabs/notes-tab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "data", label: "Data Collection" },
  { key: "billing", label: "Quote & Billing" },
  { key: "tasks", label: "Tasks" },
  { key: "messages", label: "Messages" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface ClientExpertWithName {
  id: string;
  client_id: string;
  expert_id: string;
  jurisdiction: string;
  status: string;
  expert_name: string;
  is_you: boolean;
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gray-700/50 rounded animate-pulse ${className}`} />
  );
}

export default function ClientWorkspacePage() {
  const params = useParams();
  const clientId = params.id as string;
  const { expert } = useExpert();

  const [client, setClient] = useState<Client | null>(null);
  const [experts, setExperts] = useState<ClientExpertWithName[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const fetchData = useCallback(async () => {
    if (!expert || !clientId) return;
    const supabase = createClient();

    const { data: clientRow } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientRow) setClient(clientRow as Client);

    const { data: ceRows } = await supabase
      .from("client_experts")
      .select("*, expert:experts(full_name)")
      .eq("client_id", clientId);

    const expertRefs: ClientExpertWithName[] = (ceRows ?? []).map(
      (r: Record<string, unknown>) => ({
        id: r.id as string,
        client_id: r.client_id as string,
        expert_id: r.expert_id as string,
        jurisdiction: r.jurisdiction as string,
        status: r.status as string,
        expert_name:
          r.expert_id === expert!.id
            ? "You"
            : (r.expert as { full_name: string })?.full_name ?? "Unknown",
        is_you: r.expert_id === expert!.id,
      })
    );
    setExperts(expertRefs);
    setLoading(false);
  }, [expert, clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClientUpdate = async (updates: Partial<Client>) => {
    if (!client) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", client.id)
      .select()
      .single();
    if (data) setClient(data as Client);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-400">Client not found</p>
        <Link
          href="/expert/clients"
          className="text-gold hover:text-gold/80 text-sm mt-2 inline-block"
        >
          &larr; Back to clients
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/expert/clients"
          className="text-sm text-gray-400 hover:text-gold transition-colors"
        >
          &larr; Back to clients
        </Link>
      </div>

      {/* Client Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {client.full_name}
          </h1>
          <p className="text-sm text-gray-400">{client.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              client.overall_status === "Complete" || client.overall_status === "completed"
                ? "bg-teal/10 border-teal/30 text-teal"
                : client.overall_status === "On Hold"
                  ? "bg-gray-700/50 border-gray-600 text-gray-400"
                  : "bg-gold/10 border-gold/30 text-gold"
            }`}
          >
            {client.overall_status}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-navy border border-gray-700 text-gray-400">
            {client.complexity}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-800 mb-6">
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-gold text-gold"
                  : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
              }`}
            >
              {tab.key === "notes" && "🔒 "}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && (
          <OverviewTab
            client={client}
            experts={experts}
            onClientUpdate={handleClientUpdate}
            onRefresh={fetchData}
            expertId={expert!.id}
          />
        )}
        {activeTab === "data" && (
          <DataCollectionTab
            clientId={clientId}
            clientCountries={client.countries || []}
          />
        )}
        {activeTab === "billing" && (
          <QuoteBillingTab
            clientId={clientId}
            clientCountries={client.countries || []}
            expertId={expert!.id}
          />
        )}
        {activeTab === "tasks" && (
          <TasksTab
            clientId={clientId}
            clientCountries={client.countries || []}
            expertId={expert!.id}
          />
        )}
        {activeTab === "messages" && (
          <MessagesTab
            clientId={clientId}
            expertId={expert!.id}
            expertName={expert!.full_name}
          />
        )}
        {activeTab === "documents" && (
          <DocumentsTab
            clientId={clientId}
            clientCountries={client.countries || []}
            expertId={expert!.id}
            expertName={expert!.full_name}
          />
        )}
        {activeTab === "notes" && (
          <NotesTab
            clientId={clientId}
            expertId={expert!.id}
            expertName={expert!.full_name}
          />
        )}
      </div>
    </div>
  );
}
