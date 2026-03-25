-- Mettre à jour les bookmakers avec les vrais liens d'affiliation

-- Supprimer les anciens bookmakers
DELETE FROM bookmakers;

-- Insérer les 3 vrais bookmakers
INSERT INTO bookmakers (name, slug, affiliate_url, bonus_json, countries, priority, active) VALUES
  (
    '1xBet',
    '1xbet',
    'https://reffpa.com/L?tag=d_689933m_2528c_&site=689933&ad=2528',
    '{"CI": "Bonus de bienvenue jusqu''à 200 000 FCFA", "SN": "Bonus de bienvenue jusqu''à 200 000 FCFA", "CM": "Bonus de bienvenue jusqu''à 200 000 FCFA", "ML": "Bonus de bienvenue jusqu''à 200 000 FCFA", "BF": "Bonus de bienvenue jusqu''à 200 000 FCFA", "FR": "Bonus de bienvenue jusqu''à 100€", "default": "Welcome bonus up to 100%"}',
    ARRAY['CI', 'SN', 'CM', 'ML', 'BF', 'FR'],
    1,
    true
  ),
  (
    'Melbet',
    'melbet',
    'https://refpa3665.com/L?tag=d_4814359m_45415c_&site=4814359&ad=45415&r=registration',
    '{"CI": "Bonus 100% sur le 1er dépôt", "SN": "Bonus 100% sur le 1er dépôt", "CM": "Bonus 100% sur le 1er dépôt", "ML": "Bonus 100% sur le 1er dépôt", "BF": "Bonus 100% sur le 1er dépôt", "FR": "Bonus 100% sur le 1er dépôt", "default": "100% first deposit bonus"}',
    ARRAY['CI', 'SN', 'CM', 'ML', 'BF', 'FR'],
    2,
    true
  ),
  (
    '1win',
    '1win',
    'https://1win.com/betting?p=1nye&sharebet=360foot&sub1=Foot360',
    '{"CI": "Bonus de bienvenue jusqu''à 500%", "SN": "Bonus de bienvenue jusqu''à 500%", "CM": "Bonus de bienvenue jusqu''à 500%", "ML": "Bonus de bienvenue jusqu''à 500%", "BF": "Bonus de bienvenue jusqu''à 500%", "FR": "Bonus de bienvenue jusqu''à 500%", "default": "Welcome bonus up to 500%"}',
    ARRAY['CI', 'SN', 'CM', 'ML', 'BF', 'FR'],
    3,
    true
  );
