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
