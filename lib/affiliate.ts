interface Bookmaker {
  name: string;
  url: string;
  bonus: string;
}

const BOOKMAKER_BY_COUNTRY: Record<string, Bookmaker[]> = {
  CI: [
    {
      name: "1xBet",
      url: "https://reffpa.com/L?tag=d_689933m_2528c_&site=689933&ad=2528",
      bonus: "Bonus de bienvenue jusqu'à 200 000 FCFA",
    },
    {
      name: "Melbet",
      url: "https://refpa3665.com/L?tag=d_4814359m_45415c_&site=4814359&ad=45415&r=registration",
      bonus: "Bonus 100% sur le 1er dépôt",
    },
    {
      name: "1win",
      url: "https://1win.com/betting?p=1nye&sharebet=360foot&sub1=Foot360",
      bonus: "Bonus de bienvenue jusqu'à 500%",
    },
  ],
  SN: [
    {
      name: "1xBet",
      url: "https://reffpa.com/L?tag=d_689933m_2528c_&site=689933&ad=2528",
      bonus: "Bonus de bienvenue jusqu'à 200 000 FCFA",
    },
    {
      name: "Melbet",
      url: "https://refpa3665.com/L?tag=d_4814359m_45415c_&site=4814359&ad=45415&r=registration",
      bonus: "Bonus 100% sur le 1er dépôt",
    },
    {
      name: "1win",
      url: "https://1win.com/betting?p=1nye&sharebet=360foot&sub1=Foot360",
      bonus: "Bonus de bienvenue jusqu'à 500%",
    },
  ],
  CM: [
    {
      name: "1xBet",
      url: "https://reffpa.com/L?tag=d_689933m_2528c_&site=689933&ad=2528",
      bonus: "Bonus de bienvenue jusqu'à 200 000 FCFA",
    },
    {
      name: "Melbet",
      url: "https://refpa3665.com/L?tag=d_4814359m_45415c_&site=4814359&ad=45415&r=registration",
      bonus: "Bonus 100% sur le 1er dépôt",
    },
    {
      name: "1win",
      url: "https://1win.com/betting?p=1nye&sharebet=360foot&sub1=Foot360",
      bonus: "Bonus de bienvenue jusqu'à 500%",
    },
  ],
  ML: [
    {
      name: "1xBet",
      url: "https://reffpa.com/L?tag=d_689933m_2528c_&site=689933&ad=2528",
      bonus: "Bonus de bienvenue jusqu'à 200 000 FCFA",
    },
    {
      name: "Melbet",
      url: "https://refpa3665.com/L?tag=d_4814359m_45415c_&site=4814359&ad=45415&r=registration",
      bonus: "Bonus 100% sur le 1er dépôt",
    },
    {
      name: "1win",
      url: "https://1win.com/betting?p=1nye&sharebet=360foot&sub1=Foot360",
      bonus: "Bonus de bienvenue jusqu'à 500%",
    },
  ],
  BF: [
    {
      name: "1xBet",
      url: "https://reffpa.com/L?tag=d_689933m_2528c_&site=689933&ad=2528",
      bonus: "Bonus de bienvenue jusqu'à 200 000 FCFA",
    },
    {
      name: "Melbet",
      url: "https://refpa3665.com/L?tag=d_4814359m_45415c_&site=4814359&ad=45415&r=registration",
      bonus: "Bonus 100% sur le 1er dépôt",
    },
    {
      name: "1win",
      url: "https://1win.com/betting?p=1nye&sharebet=360foot&sub1=Foot360",
      bonus: "Bonus de bienvenue jusqu'à 500%",
    },
  ],
  FR: [
    {
      name: "1xBet",
      url: "https://reffpa.com/L?tag=d_689933m_2528c_&site=689933&ad=2528",
      bonus: "Bonus de bienvenue jusqu'à 100€",
    },
    {
      name: "Melbet",
      url: "https://refpa3665.com/L?tag=d_4814359m_45415c_&site=4814359&ad=45415&r=registration",
      bonus: "Bonus 100% sur le 1er dépôt",
    },
    {
      name: "1win",
      url: "https://1win.com/betting?p=1nye&sharebet=360foot&sub1=Foot360",
      bonus: "Bonus de bienvenue jusqu'à 500%",
    },
  ],
  DEFAULT: [
    {
      name: "1xBet",
      url: "https://reffpa.com/L?tag=d_689933m_2528c_&site=689933&ad=2528",
      bonus: "Welcome bonus up to 100%",
    },
    {
      name: "Melbet",
      url: "https://refpa3665.com/L?tag=d_4814359m_45415c_&site=4814359&ad=45415&r=registration",
      bonus: "100% first deposit bonus",
    },
    {
      name: "1win",
      url: "https://1win.com/betting?p=1nye&sharebet=360foot&sub1=Foot360",
      bonus: "Welcome bonus up to 500%",
    },
  ],
};

/**
 * Get all bookmakers for a given country code.
 * Falls back to the DEFAULT bookmakers if the country is not mapped.
 */
export function getBookmakers(countryCode: string): Bookmaker[] {
  return BOOKMAKER_BY_COUNTRY[countryCode] || BOOKMAKER_BY_COUNTRY.DEFAULT;
}

/**
 * Get the primary bookmaker for a given country code.
 */
export function getBookmaker(countryCode: string): Bookmaker {
  const bookmakers = getBookmakers(countryCode);
  return bookmakers[0];
}
