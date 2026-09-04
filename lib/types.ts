export type PriceTier = {
  label: string;
  price: number;
};

export type DbEvent = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  zone: string;
  venue_name: string | null;
  place_id: string | null;
  source: string;
  date_start: string;
  date_end: string | null;
  price: number | null;
  is_free: boolean;
  price_tiers: PriceTier[];
  image_url: string | null;
  contact_link: string | null;
  sponsored: boolean;
  featured: boolean;
  tags: string[];
  status: 'pending' | 'published';
};

export type DbActivity = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  zone: string;
  venue_name: string | null;
  place_id: string | null;
  recurrence_text: string | null;
  price: number | null;
  is_free: boolean;
  price_tiers: PriceTier[];
  image_url: string | null;
  photo_urls: string[];
  contact_link: string | null;
  sponsored: boolean;
  featured: boolean;
  tags: string[];
  status: 'pending' | 'published';
};

export type PlacePhoto = {
  id: string;
  place_id: string;
  url: string;
  is_primary: boolean;
  order_index: number;
};

export type Place = {
  id: string;
  slug: string;
  name: string;
  primary_category: string | null;
  category: string | null;
  zone: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  rating_count: number | null;
  price_range: string | null;
  price_level: number | null;
  hours: Record<string, string> | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram_handle: string | null;
  google_maps_url: string | null;
  google_place_id: string | null;
  description: string | null;
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
  is_verified: boolean;
  is_active: boolean;
  editorial_notes: string | null;
  source: string | null;
};

export type DbBankPromotion = {
  id: string;
  bank: string;
  external_id: string;
  merchant_name: string;
  merchant_slug: string | null;
  title: string;
  discount_label: string;
  discount_pct: number | null;
  category: string | null;
  terms: string | null;
  image_url: string | null;
  source_url: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};
