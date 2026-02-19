export interface Expert {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  jurisdictions: string[];
  specializations: string[];
  rating: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  countries: string[];
  asset_types: string[];
  complexity: string;
  tax_years: string[];
  overall_status: string;
  notes_quick: string | null;
  pipeline_stage: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientExpert {
  id: string;
  client_id: string;
  expert_id: string;
  jurisdiction: string;
  status: string;
  earnings: number;
  created_at: string;
  // joined fields
  client?: Client;
  expert?: Expert;
}

export interface Task {
  id: string;
  client_id: string;
  expert_id: string;
  jurisdiction: string | null;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  // joined fields
  client?: Client;
}

export interface Payment {
  id: string;
  expert_id: string;
  client_id: string | null;
  amount: number;
  currency: string;
  description: string | null;
  paid_at: string;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  expert_id: string | null;
  client_id: string | null;
  action: string;
  details: string | null;
  created_at: string;
}

export interface ClientExchange {
  id: string;
  client_id: string;
  exchange_name: string;
  exchange_type: string; // "cex" | "dex"
  api_key_provided: boolean;
  csv_provided: boolean;
  imported_to_koinly: boolean;
  transaction_count: number | null;
  created_at: string;
}

export interface ClientWallet {
  id: string;
  client_id: string;
  wallet_address: string;
  blockchain: string;
  wallet_type: string | null;
  label: string | null;
  imported_to_koinly: boolean;
  transaction_count: number | null;
  created_at: string;
}

export interface Quote {
  id: string;
  client_id: string;
  expert_id: string;
  amount: number;
  currency: string;
  scope_description: string | null;
  jurisdictions: string[];
  estimated_timeline: string | null;
  valid_until: string | null;
  status: string; // "draft" | "sent" | "viewed" | "accepted" | "declined"
  sent_at: string | null;
  payment_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  expert_id: string;
  quote_id: string | null;
  invoice_number: string;
  amount: number;
  currency: string;
  description: string | null;
  due_date: string | null;
  payment_method: string | null;
  payment_link: string | null;
  status: string; // "draft" | "sent" | "overdue" | "paid"
  sent_at: string | null;
  paid_at: string | null;
  paid_amount: number | null;
  external_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  client_id: string;
  sender_type: string; // "expert" | "client" | "system"
  sender_id: string | null;
  sender_name: string;
  content: string;
  created_at: string;
}

export interface Document {
  id: string;
  client_id: string;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  jurisdiction: string | null;
  doc_category: string; // "Tax Report" | "Source Data" | "Exchange CSV" | etc.
  created_at: string;
}

export interface InternalNote {
  id: string;
  client_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface ClientUploadToken {
  id: string;
  client_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}
