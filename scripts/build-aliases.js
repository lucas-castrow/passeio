const fs = require('fs');

fetch('https://raw.githubusercontent.com/mledoze/countries/master/countries.json')
  .then(res => res.json())
  .then(data => {
    const aliases = {};
    
    // Helper to add an alias safely
    const addAlias = (alias, cca3) => {
        if (!alias) return;
        const normalized = alias.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        if (normalized && normalized.length > 2 && !aliases[normalized]) {
            aliases[normalized] = cca3;
        }
    };

    // Add manual important overrides first so they don't get overwritten
    const manualOverrides = {
        "eua": "USA", "usa": "USA", "estados unidos da america": "USA", "reino unido": "GBR", "inglaterra": "GBR", "escocia": "GBR",
        "pais de gales": "GBR", "irlanda do norte": "GBR", "holanda": "NLD", "coreia do sul": "KOR", "coreia do norte": "PRK", 
        "costa do marfim": "CIV", "rep checa": "CZE", "czechia": "CZE", "macau": "MAC", "taiwan": "TWN", "hong kong": "HKG",
        "emirados arabes": "ARE", "suazilandia": "SWZ", "guine bissau": "GNB", "sao tome e principe": "STP", "vaticano": "VAT",
        "cabo verde": "CPV", "timor leste": "TLS", "bosnia": "BIH", "macedonia": "MKD", "guiana francesa": "GUF", "birmania": "MMR",
        "mianmar": "MMR"
    };

    for (let k in manualOverrides) aliases[k] = manualOverrides[k];

    data.forEach(c => {
        const id = c.cca3;

        addAlias(c.name.common, id);
        addAlias(c.name.official, id);
        
        if (c.altSpellings) {
            c.altSpellings.forEach(alt => addAlias(alt, id));
        }

        if (c.translations) {
            if (c.translations.por) {
                addAlias(c.translations.por.common, id);
                addAlias(c.translations.por.official, id);
            }
            if (c.translations.spa) addAlias(c.translations.spa.common, id);
            if (c.translations.fra) addAlias(c.translations.fra.common, id);
            if (c.translations.ita) addAlias(c.translations.ita.common, id);
        }
    });

    fs.writeFileSync('src/data/aliases.json', JSON.stringify(aliases, null, 2));
    console.log('✅ Aliases massivo gerado com sucesso! Total:', Object.keys(aliases).length);
  });
