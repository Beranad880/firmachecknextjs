const COMPANY_POOL = [
  // E-commerce & tech
  { name: 'Alza.cz', ico: '27082440' },
  { name: 'Mall.cz', ico: '26204335' },
  { name: 'Rohlík.cz', ico: '03739095' },
  { name: 'Heureka.cz', ico: '02387727' },
  { name: 'Notino', ico: '29144798' },
  { name: 'CZC.cz', ico: '25612697' },

  // Internet & software
  { name: 'Seznam.cz', ico: '26168685' },
  { name: 'Avast', ico: '02483561' },
  { name: 'JetBrains', ico: '26493323' },
  { name: 'Kiwi.com', ico: '29352886' },
  { name: 'Y Soft', ico: '26197669' },
  { name: 'Bohemia Interactive', ico: '60751400' },
  { name: 'Kentico', ico: '27647302' },

  // Automotive & průmysl
  { name: 'Škoda Auto', ico: '00177041' },
  { name: 'Bosch ČR', ico: '00668245' },
  { name: 'Continental Barum', ico: '00012858' },

  // Energetika
  { name: 'ČEZ', ico: '45274649' },

  // Banky & finance
  { name: 'Česká spořitelna', ico: '45244782' },
  { name: 'Komerční banka', ico: '45317054' },
  { name: 'ČSOB', ico: '00001350' },
  { name: 'Raiffeisenbank', ico: '49240901' },
  { name: 'Moneta Money Bank', ico: '25672720' },
  { name: 'Air Bank', ico: '29045371' },
  { name: 'Fio banka', ico: '61858374' },

  // Pojišťovny
  { name: 'Česká pojišťovna', ico: '45272956' },
  { name: 'Kooperativa', ico: '47116617' },
  { name: 'Allianz ČR', ico: '00001805' },

  // Telekomunikace
  { name: 'T-Mobile', ico: '64949681' },
  { name: 'Vodafone', ico: '25788001' },
  { name: 'O2', ico: '60193336' },

  // Retail & supermarkety
  { name: 'Lidl ČR', ico: '26187031' },
  { name: 'Kaufland', ico: '25317075' },
  { name: 'Penny Market', ico: '64944359' },
  { name: 'Tesco Stores ČR', ico: '45308314' },
  { name: 'IKEA', ico: '49705494' },
  { name: 'Decathlon', ico: '26590993' },

  // Logistika & doprava
  { name: 'Česká pošta', ico: '47114983' },
  { name: 'Zásilkovna', ico: '04539991' },
  { name: 'PPL CZ', ico: '25194798' },
  { name: 'DPD CZ', ico: '49622511' },
  { name: 'Czech Airlines', ico: '45795908' },

  // Média
  { name: 'Česká televize', ico: '00027383' },
  { name: 'Český rozhlas', ico: '45245053' },
  { name: 'TV Nova', ico: '45800456' },
  { name: 'FTV Prima', ico: '48115908' },

  // Potravinářství & nápoje
  { name: 'Plzeňský Prazdroj', ico: '45357366' },
  { name: 'Budějovický Budvar', ico: '00514986' },
  { name: 'Kofola', ico: '27767680' },
  { name: 'Madeta', ico: '63549391' },
];

export function getRandomSuggestions(count = 3) {
  const arr = [...COMPANY_POOL];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}
