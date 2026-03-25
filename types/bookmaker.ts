export interface Bookmaker {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  bonus_json: BookmakerBonus | null;
  affiliate_url: string;
  countries: string[];
  priority: number;
  active: boolean;
}

export interface BookmakerBonus {
  type: string;
  amount: string;
  description: string;
  terms_url?: string;
  [key: string]: unknown;
}

export interface AffiliateClick {
  id: string;
  bookmaker_id: string;
  article_id: string | null;
  page_url: string;
  country: string | null;
  sub_id: string | null;
  timestamp: string;
}

export interface AffiliateClickWithBookmaker extends AffiliateClick {
  bookmaker: Bookmaker;
}
