// Crawlee - web scraping and browser automation library
import { CheerioCrawler } from '@crawlee/cheerio';
// Apify SDK - toolkit for building Apify Actors
import { Actor, Dataset } from 'apify';
import { LingoDotDevEngine } from "lingo.dev/sdk";
interface Input {
    nationality: string;
    destination: string;
    language?: string;
    maxRequestsPerCrawl?: number;
}

// Initialize Actor
await Actor.init();

/* ===============================
   INPUT
================================ */

const {
    nationality,
    destination,
    language = "en",
    maxRequestsPerCrawl = 1,
} = (await Actor.getInput<Input>()) ?? ({} as Input);

if (!nationality || !destination) {
    throw new Error('Input must include both "nationality" and "destination".');
}

const normalizeForDisplay = (value: string) =>
    value.trim()
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());

const nationalitySlug = normalizeForDisplay(nationality).replace(/\s+/g, '_');

const destinationInput = destination.trim();
const WIKI_BASE_URL =
    `https://en.wikipedia.org/wiki/Visa_requirements_for_${nationalitySlug}_citizens`;

/* ===============================
   HELPERS
================================ */
type VisaType =
    | 'Visa-free'
    | 'Visa on arrival'
    | 'eVisa'
    | 'Visa required'
    | 'Freedom of movement'
    | 'Other';
type StayPolicy = 'fixed' | 'range' | 'conditional' | 'unlimited' | 'unknown' | null;

type NonNullStayPolicy = Exclude<StayPolicy, null>;

type VisaResult = {
  nationality: string;
  destination: string;
  visaType: VisaType;
  visaType_localized?: string;
  visaTypeRaw: string;
  maxStayDays: number | null;
  allowedStayText: string | null;
  allowedStayText_localized?: string | null;
  stayPolicy: StayPolicy;
  notes: string | null;
  notes_localized?: string | null;
  additionalInfoUrls: {
    key: string;
    title: string;
    title_localized?: string;
    url: string;
  }[];
  language: string;
  scrapedAt: string;
  found: boolean;
};

const normalizeForCompare = (value: string) =>
    value.trim().toLowerCase().replace(/[^a-z]/g, '');


const cleanWikipediaText = (text: string): string => {
    return text
        .replace(/\[\d+\]/g, '')   // remove [123]
        .replace(/\s+/g, ' ')      // normalize whitespace
        .trim();
};

function generateVisaReportHTML(result: VisaResult): string {
    const {
        nationality,
        destination,
        visaType,
        visaType_localized,
        allowedStayText,
        allowedStayText_localized,
        stayPolicy,
        notes,
        notes_localized,
        additionalInfoUrls,
        language,
        found,
        scrapedAt,
    } = result;

    const displayVisaType =
        visaType_localized ?? visaType ?? '—';

    const stayPolicyLabelMap: Record<NonNullStayPolicy, string> = {
        fixed: 'Fixed duration',
        range: 'Limited period',
        conditional: 'Conditional stay',
        unlimited: 'Unlimited stay',
        unknown: 'Subject to conditions',
    };

    const displayPolicy =
        stayPolicy ? stayPolicyLabelMap[stayPolicy] ?? stayPolicy : null;

    const displayStay =
        allowedStayText_localized ??
        allowedStayText ??
        'Not specified';

    const displayNotes =
        notes_localized ??
        notes ??
        (found
            ? 'No additional notes available.'
            : 'Visa information not found for the given input.');

    const linksHtml = (additionalInfoUrls ?? [])
        .map(
            (l: any) => `
        <tr>
          <td>${l.title_localized ?? l.title}</td>
          <td><a href="${l.url}" target="_blank">View</a></td>
        </tr>`
        )
        .join('');

    return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <title>Visa Report</title>
  <style>
  :root {
    --primary: #2563eb;
    --bg: #f8fafc;
    --card: #ffffff;
    --text: #0f172a;
    --muted: #64748b;
    --border: #e5e7eb;
    --badge-bg: #eef2ff;
    --badge-text: #3730a3;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 40px 16px;
    background: var(--bg);
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    color: var(--text);
  }

  h1 {
    font-size: 28px;
    margin-bottom: 8px;
    letter-spacing: -0.02em;
  }

  h2 {
    font-size: 20px;
    margin-top: 32px;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--border);
    color: #1e293b;
  }

  p {
    margin: 8px 0;
    line-height: 1.6;
  }

  strong {
    font-weight: 600;
  }

  .badge {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 999px;
    background: var(--badge-bg);
    color: var(--badge-text);
    font-weight: 600;
    font-size: 14px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
    background: var(--card);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
  }

  th {
    background: #f1f5f9;
    color: #334155;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  th,
  td {
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
    text-align: left;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: #f8fafc;
  }

  a {
    color: var(--primary);
    font-weight: 500;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  .meta {
    margin-top: 32px;
    font-size: 13px;
    color: var(--muted);
    text-align: center;
  }

  @media (max-width: 640px) {
    body {
      padding: 24px 12px;
    }

    h1 {
      font-size: 24px;
    }

    h2 {
      font-size: 18px;
    }

    table {
      font-size: 14px;
    }
  }
</style>
</head>
<body>

<h1>Visa Information</h1>

<p><strong>Nationality:</strong> ${nationality}</p>
<p><strong>Destination:</strong> ${destination}</p>

<h2>Visa Status</h2>
<p class="badge">${displayVisaType}</p>

<h2>Allowed Stay</h2>
<p>${displayStay}</p>
${stayPolicy ? `<p><strong>Policy:</strong> ${displayPolicy}</p>` : ''}

<h2>Notes</h2>
<p>${displayNotes}</p>

${linksHtml
            ? `
<h2>Additional Travel Information</h2>
<table>
  <tr>
    <th>Topic</th>
    <th>Link</th>
  </tr>
  ${linksHtml}
</table>`
            : ''
        }

<p class="meta">
  Language: ${language} · Scraped at: ${new Date(scrapedAt).toLocaleString()}
</p>

</body>
</html>
`;
}

const parseVisaType = (text: string): {
    visaType: VisaType;
    visaTypeRaw: string;
    visaOptions?: string[];
} => {
    const raw = cleanWikipediaText(text);
    const t = raw.toLowerCase();

    if (t.includes('freedom of movement')) {
        return { visaType: 'Freedom of movement', visaTypeRaw: raw };
    }

    if (t.includes('visa not required') || t.includes('visa-free')) {
        return { visaType: 'Visa-free', visaTypeRaw: raw };
    }

    if (t.includes('online visa') && t.includes('visa on arrival')) {
        return {
            visaType: 'Visa on arrival',
            visaTypeRaw: raw,
            visaOptions: ['eVisa', 'Visa on arrival'],
        };
    }

    if (t.includes('online visa') || t.includes('e-visa')) {
        return { visaType: 'eVisa', visaTypeRaw: raw };
    }

    if (t.includes('visa on arrival')) {
        return { visaType: 'Visa on arrival', visaTypeRaw: raw };
    }

    if (t.includes('visa required')) {
        return { visaType: 'Visa required', visaTypeRaw: raw };
    }

    return { visaType: 'Other', visaTypeRaw: raw };
};


const parseAllowedStay = (text: string | null): {
    maxStayDays: number | null;
    allowedStayText: string | null;
    stayPolicy: StayPolicy;
} => {
    if (!text) {
        return {
            maxStayDays: null,
            allowedStayText: null,
            stayPolicy: null,
        };
    }

    const raw = cleanWikipediaText(text);
    const t = raw.toLowerCase();

    if (t.includes('unlimited')) {
        return {
            maxStayDays: null,
            allowedStayText: raw,
            stayPolicy: t.includes('only') || t.includes('except')
                ? 'conditional'
                : 'unlimited',
        };
    }

    const yearMatch = t.match(/(\d+)\s*year/);
    if (yearMatch) {
        return {
            maxStayDays: Number(yearMatch[1]) * 365,
            allowedStayText: raw,
            stayPolicy: 'fixed',
        };
    }

    const monthMatch = t.match(/(\d+)\s*month/);
    if (monthMatch) {
        return {
            maxStayDays: Number(monthMatch[1]) * 30,
            allowedStayText: raw,
            stayPolicy: 'fixed',
        };
    }

    const weekMatch = t.match(/(\d+)\s*week/);
    if (weekMatch) {
        return {
            maxStayDays: Number(weekMatch[1]) * 7,
            allowedStayText: raw,
            stayPolicy: 'fixed',
        };
    }

    const dayMatch = t.match(/(\d+)\s*day/);
    if (dayMatch) {
        return {
            maxStayDays: Number(dayMatch[1]),
            allowedStayText: raw,
            stayPolicy: 'fixed',
        };
    }

    if (t.includes('within') || t.includes('per')) {
        return {
            maxStayDays: null,
            allowedStayText: raw,
            stayPolicy: 'range',
        };
    }

    return {
        maxStayDays: null,
        allowedStayText: raw,
        stayPolicy: 'unknown',
    };
};



const ADDITIONAL_INFO_SECTIONS = [
    { key: 'maximum_passport_age', title: 'Maximum passport age', anchor: 'Maximum_passport_age' },
    { key: 'blank_passport_pages', title: 'Blank passport pages', anchor: 'Blank_passport_pages' },
    { key: 'vaccination', title: 'Vaccination', anchor: 'Vaccination' },
    { key: 'criminal_record', title: 'Criminal record', anchor: 'Criminal_record' },
    { key: 'persona_non_grata', title: 'Persona non grata', anchor: 'Persona_non_grata' },
    { key: 'israeli_stamps', title: 'Israeli stamps', anchor: 'Israeli_stamps' },
    { key: 'biometrics', title: 'Biometrics', anchor: 'Biometrics' },
];

const additionalInfoUrls = ADDITIONAL_INFO_SECTIONS.map(section => ({
    key: section.key,
    title: section.title,
    url: `${WIKI_BASE_URL}#${section.anchor}`,
}));

const lingo = new LingoDotDevEngine({
    apiKey: process.env.LINGODOTDEV_API_KEY!,
});
/* ===============================
   RESULT OBJECT
================================ */

let result: {
    nationality: string;
    destination: string;
    visaType: VisaType;
    visaType_localized?: string;
    visaTypeRaw: string;
    maxStayDays: number | null;
    allowedStayText: string | null;
    allowedStayText_localized?: string | null;
    stayPolicy: StayPolicy;
    notes: string | null;
    notes_localized?: string | null;
    additionalInfoUrls: {
        key: string;
        title: string;
        title_localized?: string;
        url: string;
    }[];
    language: string;
    scrapedAt: string;
    found: boolean;
} = {
    nationality,
    destination: destinationInput,
    visaType: 'Other',
    visaTypeRaw: '',
    maxStayDays: null,
    allowedStayText: null as string | null,
    stayPolicy: null,
    notes: null as string | null,
    additionalInfoUrls,
    language,
    scrapedAt: new Date().toISOString(),
    found: false,
};

/* ===============================
   CRAWLER
================================ */

const crawler = new CheerioCrawler({
    maxRequestsPerCrawl,
    requestHandler: async ({ $, log }) => {
        log.info('Processing visa table');

        const table = $('table.wikitable').filter((_, el) => {
            const headers = $(el).find('th').map((_, th) =>
                $(th).text().trim().toLowerCase()
            ).get();
            const hasCountryColumn = headers.some(h =>
                h.includes('country') || h.includes('region')
            );

            const hasVisaColumn = headers.some(h =>
                h.includes('visa')
            );
            return hasCountryColumn && hasVisaColumn;
        }).first();

        if (!table.length) {
            log.error('Visa table not found');
            return;
        }
        let countryColIndex = -1;
        let notesColIndex = -1;
        let allowedStayColIndex = -1;
        let visaColIndex = -1;
        table.find('tr').first().find('th').each((index, th) => {
            const headerText = $(th).text().toLowerCase().trim();

            if (headerText.includes('country') ||
                headerText.includes('region')) {
                countryColIndex = index;
            }

            if (headerText.includes('allowed stay')) {
                allowedStayColIndex = index;
            }

            if (headerText.includes('visa')) {
                visaColIndex = index;
            }

            if (headerText.includes('notes')) {
                notesColIndex = index;
            }
        });
        if (countryColIndex === -1) {
            log.error('Country column not found');
            return;
        }

        if (notesColIndex === -1) {
            log.error('Notes column not found');
            return;
        }

        const rows = table.find('tr').slice(1);
        let found = false;

        rows.each((_, row) => {
            if (found) return;
            const cols = $(row).find('td');
            if (cols.length < 2) return;

            const country = $(cols[countryColIndex]).text().trim();

            if (normalizeForCompare(country) === normalizeForCompare(destinationInput)) {
                const visaParsed = parseVisaType($(cols[visaColIndex]).text());
                const notesRaw = $(cols[notesColIndex]).text();
                const notes = cleanWikipediaText(notesRaw);
                const stayParsed =
                    allowedStayColIndex >= 0
                        ? parseAllowedStay($(cols[allowedStayColIndex]).text())
                        : { maxStayDays: null, allowedStayText: null, stayPolicy: null };
                result = {
                    ...result,
                    nationality: normalizeForDisplay(nationality),
                    destination: normalizeForDisplay(country),
                    visaType: visaParsed.visaType,
                    visaTypeRaw: visaParsed.visaTypeRaw,
                    maxStayDays: stayParsed.maxStayDays,
                    allowedStayText: stayParsed.allowedStayText,
                    stayPolicy: stayParsed.stayPolicy,
                    notes: notes.length ? notes : null,
                    additionalInfoUrls,
                    scrapedAt: new Date().toISOString(),
                    found: true,
                };

                log.info('Destination matched', { country });
                found = true;
            }
        });
        // Push main visa result (overview view)
    },
});

/* ===============================
   RUN
================================ */

await crawler.run([
    {
        url: `https://en.wikipedia.org/wiki/Visa_requirements_for_${nationalitySlug}_citizens`,
    },
]);

if (language !== "en" && result.found) {
    try {
        // Translate main fields
        const localizedMain = await lingo.localizeObject(
            {
                visaType: result.visaType,
                notes: result.notes,
                allowedStayText: result.allowedStayText,
            },
            {
                sourceLocale: "en",
                targetLocale: language,
            }
        );

        result.visaType_localized = localizedMain.visaType;
        result.notes_localized = localizedMain.notes;
        result.allowedStayText_localized = localizedMain.allowedStayText;
        // Translate additional info titles
        const titlesObject = Object.fromEntries(
            result.additionalInfoUrls.map((l, i) => [`title_${i}`, l.title])
        );

        const localizedTitles = await lingo.localizeObject(
            titlesObject,
            {
                sourceLocale: "en",
                targetLocale: language,
            }
        );

        result.additionalInfoUrls = result.additionalInfoUrls.map((l, i) => ({
            ...l,
            title_localized: localizedTitles[`title_${i}`],
        }));
    } catch (err) {
        console.warn("Localization failed, falling back to English");
    }
}
/* ===============================
   OUTPUT
================================ */

await Actor.setValue('RESULT', result);

const html = generateVisaReportHTML(result);

await Actor.setValue('report.html', html, {
    contentType: 'text/html',
});



// Push one row per additional info link (links view)
let additionalInfoDataset = await Actor.openDataset('additional-info');
await additionalInfoDataset.drop();
additionalInfoDataset = await Actor.openDataset('additional-info');
if (result.found) {
    // Goes to default dataset
    await Dataset.pushData({
        type: 'visa',
        nationality: result?.nationality,
        destination: result?.destination,
        visaType: result?.visaType,
        visaType_localized: result.visaType_localized ?? null,
        maxStayDays: result.maxStayDays ?? null,
        allowedStayText: result.allowedStayText,
        allowedStayText_localized: result.allowedStayText_localized ?? null,
        stayPolicy: result.stayPolicy,
        notes: result?.notes,
        notes_localized: result.notes_localized ?? null,
        language: result.language,
        found: result?.found,
        scrapedAt: result.scrapedAt,
    });

    // Goes to the named dataset
    for (const link of result.additionalInfoUrls) {
        await additionalInfoDataset.pushData({
            type: 'additional_info',
            title: link?.title,
            title_localized: link.title_localized ?? null,
            url: link?.url,
            language: result.language,
            scrapedAt: result.scrapedAt,
        });
    }
} else {
    await Dataset.pushData({
        type: 'visa',
        nationality: result.nationality,
        destination: result.destination,
        visaType: null,
        visaType_localized: null,
        maxStayDays: null,
        allowedStayText: null,
        allowedStayText_localized: null,
        stayPolicy: null,
        notes:
            result.notes ??
            'Visa information not found for the provided nationality and destination.',
        notes_localized: null,
        language: result.language,
        found: false,
        scrapedAt: result.scrapedAt,
    });
}


await Actor.exit();
