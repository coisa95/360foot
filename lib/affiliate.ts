interface Bookmaker {
  name: string;
  url: string;
  bonus: string;
}

const BOOKMAKER_BY_COUNTRY: Record<string, Bookmaker> = {
  CI: {
    name: "1xBet",
    url: "https://1xbet.ci",
    bonus: "Bonus de bienvenue jusqu'a 200 000 FCFA",
  },
  SN: {
    name: "1xBet",
    url: "https://1xbet.sn",
    bonus: "Bonus de bienvenue jusqu'a 200 000 FCFA",
  },
  CM: {
    name: "1xBet",
    url: "https://1xbet.cm",
    bonus: "Bonus de bienvenue jusqu'a 200 000 FCFA",
  },
  ML: {
    name: "1xBet",
    url: "https://1xbet.ml",
    bonus: "Bonus de bienvenue jusqu'a 200 000 FCFA",
  },
  BF: {
    name: "1xBet",
    url: "https://1xbet.bf",
    bonus: "Bonus de bienvenue jusqu'a 200 000 FCFA",
  },
  FR: {
    name: "Betclic",
    url: "https://www.betclic.fr",
    bonus: "Jusqu'a 100€ offerts en freebets",
  },
  DEFAULT: {
    name: "Bet365",
    url: "https://www.bet365.com",
    bonus: "Up to $30 in Bet Credits",
  },
};

/**
 * Get the bookmaker for a given country code.
 * Falls back to the DEFAULT bookmaker if the country is not mapped.
 * @param countryCode - ISO 3166-1 alpha-2 country code
 */
export function getBookmaker(countryCode: string): Bookmaker {
  return BOOKMAKER_BY_COUNTRY[countryCode] || BOOKMAKER_BY_COUNTRY.DEFAULT;
}
