// Maps address text to a likely IANA timezone by checking for country,
// state, or city keywords. This is a heuristic — not a geocoding API —
// but covers the common cases well enough for property listings.

interface Rule {
  pattern: RegExp;
  timezone: string;
}

const RULES: Rule[] = [
  // ── United States ──
  { pattern: /\b(oregon|or|portland|salem|eugene|bend)\b/i, timezone: 'America/Los_Angeles' },
  { pattern: /\b(washington|wa|seattle|spokane|tacoma|olympia)\b/i, timezone: 'America/Los_Angeles' },
  { pattern: /\b(california|ca|los angeles|san francisco|san diego|sacramento|fresno)\b/i, timezone: 'America/Los_Angeles' },
  { pattern: /\b(nevada|nv|las vegas|reno|carson city)\b/i, timezone: 'America/Los_Angeles' },
  { pattern: /\b(arizona|az|phoenix|tucson|scottsdale)\b/i, timezone: 'America/Phoenix' },
  { pattern: /\b(mountain time|mt|idaho|id|boise|montana|mt|billings|missoula)\b/i, timezone: 'America/Denver' },
  { pattern: /\b(colorado|co|denver|boulder|aspen|aurora)\b/i, timezone: 'America/Denver' },
  { pattern: /\b(new mexico|nm|albuquerque|santa fe)\b/i, timezone: 'America/Denver' },
  { pattern: /\b(texas|tx|dallas|houston|austin|san antonio|fort worth)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(chicago|illinois|il|springfield il|peoria|naperville)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(minnesota|mn|minneapolis|st paul|rochester mn)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(wisconsin|wi|milwaukee|madison wi|green bay)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(iowa|ia|des moines|cedar rapids)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(missouri|mo|kansas city|st louis|springfield mo)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(kansas|ks|wichita|topeka|overland park)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(nebraska|ne|omaha|lincoln ne)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(south dakota|sd|sioux falls|rapid city)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(north dakota|nd|fargo|bismarck)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(arkansas|ar|little rock|fort smith)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(louisiana|la|new orleans|baton rouge|shreveport)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(oklahoma|ok|oklahoma city|tulsa|norman ok)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(alabama|al|birmingham al|montgomery|mobile al|huntsville)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(mississippi|ms|jackson ms|gulfport|biloxi)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(memphis|tennessee|tn|nashville|knoxville|chattanooga)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(kentucky|ky|louisville|lexington|bowling green)\b/i, timezone: 'America/Chicago' },
  { pattern: /\b(indiana|in|indianapolis|fort wayne|evansville|bloomington in)\b/i, timezone: 'America/Indiana/Indianapolis' },
  { pattern: /\b(ohio|oh|columbus|cleveland|cincinnati|toledo)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(michigan|mi|detroit|grand rapids|ann arbor|lansing)\b/i, timezone: 'America/Detroit' },
  { pattern: /\b(new york|ny|nyc|manhattan|brooklyn|queens|bronx|buffalo|albany ny)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(new jersey|nj|newark|jersey city|trenton|atlantic city)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(pennsylvania|pa|philadelphia|pittsburgh|allentown|erie pa)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(connecticut|ct|hartford|new haven|bridgeport)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(rhode island|ri|providence|newport ri)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(massachusetts|ma|boston|cambridge ma|worcester|springfield ma)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(vermont|vt|burlington|montpelier)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(new hampshire|nh|concord nh|manchester nh|nashua nh)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(maine|me|portland me|augusta|bangor)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(delaware|de|wilmington|dover)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(maryland|md|baltimore|annapolis|silver spring|rockville)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(virginia|va|richmond|virginia beach|arlington va|norfolk)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(west virginia|wv|charleston wv|huntington wv)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(north carolina|nc|charlotte|raleigh|greensboro|durham|winston)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(south carolina|sc|columbia sc|charleston sc|greenville sc)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(georgia|ga|atlanta|savannah|augusta ga|athens ga)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(florida|fl|miami|orlando|tampa|jacksonville|tallahassee|fort lauderdale)\b/i, timezone: 'America/New_York' },
  { pattern: /\b(alaska|ak|anchorage|fairbanks|juneau)\b/i, timezone: 'America/Anchorage' },
  { pattern: /\b(hawaii|hi|honolulu|maui|kauai|big island)\b/i, timezone: 'Pacific/Honolulu' },
  { pattern: /\b(united states|usa|u\.s\.a)\b/i, timezone: 'America/New_York' },

  // ── Europe ──
  { pattern: /\b(united kingdom|uk|u\.k\.|england|scotland|wales|northern ireland|london|manchester|birmingham uk|leeds|glasgow|edinburgh|liverpool|bristol|sheffield)\b/i, timezone: 'Europe/London' },
  { pattern: /\b(ireland|dublin|cork|galway|limerick)\b/i, timezone: 'Europe/Dublin' },
  { pattern: /\b(portugal|lisbon|porto|braga|faro)\b/i, timezone: 'Europe/Lisbon' },
  { pattern: /\b(france|paris|marseille|lyon|toulouse|nice|nantes|bordeaux|strasbourg|lille)\b/i, timezone: 'Europe/Paris' },
  { pattern: /\b(spain|madrid|barcelona|valencia|seville|bilbao|malaga|zaragoza)\b/i, timezone: 'Europe/Madrid' },
  { pattern: /\b(germany|deutschland|berlin|munich|munich|hamburg|frankfurt|cologne|stuttgart|düsseldorf|düsseldorf|leipzig|dresden)\b/i, timezone: 'Europe/Berlin' },
  { pattern: /\b(italy|italia|rome|milan|naples|turin|florence|venice|bologna|genoa)\b/i, timezone: 'Europe/Rome' },
  { pattern: /\b(netherlands|amsterdam|rotterdam|the hague|utrecht|eindhoven)\b/i, timezone: 'Europe/Amsterdam' },
  { pattern: /\b(belgium|brussels|antwerp|ghent|charleroi|bruges)\b/i, timezone: 'Europe/Brussels' },
  { pattern: /\b(switzerland|zurich|geneva|basel|bern|lausanne|winterthur)\b/i, timezone: 'Europe/Zurich' },
  { pattern: /\b(austria|vienna|salzburg|graz|linz|innsbruck)\b/i, timezone: 'Europe/Vienna' },
  { pattern: /\b(sweden|stockholm|gothenburg|malmo|uppsala)\b/i, timezone: 'Europe/Stockholm' },
  { pattern: /\b(norway|oslo|bergen|trondheim|stavanger)\b/i, timezone: 'Europe/Oslo' },
  { pattern: /\b(denmark|copenhagen|aarhus|odense|aalborg)\b/i, timezone: 'Europe/Copenhagen' },
  { pattern: /\b(finland|helsinki|espoo|tampere|turku)\b/i, timezone: 'Europe/Helsinki' },
  { pattern: /\b(poland|warsaw|krakow|lodz|wroclaw|poznan|gdansk)\b/i, timezone: 'Europe/Warsaw' },
  { pattern: /\b(czech republic|prague|brno|ostrava|plzen)\b/i, timezone: 'Europe/Prague' },
  { pattern: /\b(greece|athens|thessaloniki|patras|heraklion)\b/i, timezone: 'Europe/Athens' },
  { pattern: /\b(hungary|budapest|debrecen|szeged|miskolc)\b/i, timezone: 'Europe/Budapest' },
  { pattern: /\b(romania|bucharest|cluj|iasi|timisoara)\b/i, timezone: 'Europe/Bucharest' },
  { pattern: /\b(bulgaria|sofia|plovdiv|varna|burgas)\b/i, timezone: 'Europe/Sofia' },
  { pattern: /\b(croatia|zagreb|split|rijeka|osijek)\b/i, timezone: 'Europe/Zagreb' },
  { pattern: /\b(ireland|dublin)\b/i, timezone: 'Europe/Dublin' },
  { pattern: /\b(luxembourg)\b/i, timezone: 'Europe/Luxembourg' },

  // ── Other common ──
  { pattern: /\b(canada|toronto|ontario|ottawa|montreal|quebec|vancouver|british columbia|calgary|alberta|edmonton|winnipeg|manitoba|halifax|nova scotia)\b/i, timezone: 'America/Toronto' },
  { pattern: /\b(australia|sydney|melbourne|brisbane|perth|adelaide|canberra|gold coast)\b/i, timezone: 'Australia/Sydney' },
  { pattern: /\b(new zealand|auckland|wellington|christchurch|hamilton)\b/i, timezone: 'Pacific/Auckland' },
  { pattern: /\b(dubai|uae|united arab emirates|abu dhabi)\b/i, timezone: 'Asia/Dubai' },
  { pattern: /\b(israel|tel aviv|jerusalem|haifa|beer sheva)\b/i, timezone: 'Asia/Jerusalem' },
  { pattern: /\b(japan|tokyo|osaka|kyoto|yokohama|nagoya|sapporo)\b/i, timezone: 'Asia/Tokyo' },
  { pattern: /\b(singapore)\b/i, timezone: 'Asia/Singapore' },
  { pattern: /\b(hong kong)\b/i, timezone: 'Asia/Hong_Kong' },
  { pattern: /\b(india|mumbai|delhi|bangalore|chennai|hyderabad|kolkata|pune|ahmedabad)\b/i, timezone: 'Asia/Kolkata' },
];

export function detectTimezoneFromAddress(address: string): string {
  for (const rule of RULES) {
    if (rule.pattern.test(address)) {
      return rule.timezone;
    }
  }
  return 'America/New_York';
}
