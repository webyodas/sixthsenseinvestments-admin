export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  service_interested: string;
  investment_budget: string;
  message?: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Archived';
  notes?: string;
  created_at: string;
}

export interface Blog {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  cover_image: string;
  status: 'Published' | 'Draft';
  read_time: string;
  created_at: string;
  updated_at?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  features: string[];
  idealFor: string;
  badge?: string;
}
