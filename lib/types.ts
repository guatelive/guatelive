export type DbEvent = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  zone: string;
  venue_name: string | null;
  date_start: string;
  price: number | null;
  image_url: string | null;
  contact_link: string | null;
  sponsored: boolean;
};
