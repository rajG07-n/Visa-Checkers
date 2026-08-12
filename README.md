# Visa Checker by Nationality

Check visa requirements by nationality and destination.
Enter a nationality and destination to get visa type, stay details, important notes, and *optional localized (translated) output*. Results are stored as clean datasets, ready to view, export, or use in Excel.

## What this Actor Does

This actor retrieves visa requirements for a given nationality → destination combination using Wikipedia as the source.

It produces:

- Visa requirements (visa type, notes, availability)
- Optional localized (translated) fields
- Additional travel information links (passport rules, vaccinations, etc.)
- Structured datasets suitable for automation, export, and analysis

No manual searching required.

## Input

The actor expects the following input:

|Field|	Type	|Description|
|----|----|------|
|`nationality`|	string	| Citizen nationality (e.g. `Indian`, `United States`)|
|`destination`|	string	| Destination country (e.g. `Germany`)|
|`language` | string (optional) | Output language (`en`, `fr`, `es`, `de`, `hi`). |
|`maxRequestsPerCrawl`|	number (optional)	| Max requests per run (default: `1`)|

## Example Input
```json
{
  "nationality": "Indian",
  "destination": "Qatar",
  "language": "hi"
}
```

## Output
*1. Default Dataset*

The default dataset contains one row per run with visa information.

*Fields:*

- `nationality`
- `destination`
- `visaType`
- `visaType_localized` (translated, if language ≠ `en`)
- `visaTypeRaw` (original text from source)
- `maxStayDays` (number or null)
- `allowedStayText` (human-readable)
- `allowedStayText_localized`
- `stayPolicy` (`fixed`, `range`, `conditional`, `unlimited`, `unknown`)
- `notes`
- `notes_localized` (translated, if available)
- `language`
- `found`
- `scrapedAt`

*Example:*
```json
[
  {
    "type": "visa",
    "nationality": "Indian",
    "destination": "Qatar",
    "visaType": "Visa-free",
    "visaType_localized": "वीज़ा-मुक्त",
    "maxStayDays": 30,
    "allowedStayText": "30 days",
    "allowedStayText_localized": "30 दिन",
    "stayPolicy": "fixed",
    "notes": "A visa waiver for 30 days can be granted on arrival, given the following conditions: Must have a confirmed return ticket. Must provide a confirmed hotel reservation booked through the Discover Qatar website for the entire stay, subject to a minimum of a two-night booking.",
    "notes_localized": "आगमन पर 30 दिनों के लिए वीज़ा छूट दी जा सकती है, बशर्ते निम्नलिखित शर्तें पूरी हों: वापसी का पुष्ट टिकट होना चाहिए। पूरे प्रवास के लिए Discover Qatar वेबसाइट के माध्यम से बुक किया गया पुष्ट होटल आरक्षण प्रदान करना होगा, जिसमें न्यूनतम दो रात की बुकिंग अनिवार्य है।",
    "language": "hi",
    "found": true,
    "scrapedAt": "2025-12-26T08:24:19.686Z"
  }
]
```
English fields are always preserved. Localized fields are `additive`, not replacements.

*2. Named Dataset*

A separate dataset (additional-info) contains additional travel requirement links related to the nationality.

*Fields:*

- `title`
- `title_localized` (if language ≠ `en`)
- `url`
- `language`
- `scrapedAt`

*Example:*
```json
[
  {
  "type": "additional_info",
  "title": "Maximum passport age",
  "title_localized": "पासपोर्ट की अधिकतम आयु",
  "url": "https://en.wikipedia.org/wiki/Visa_requirements_for_Indian_citizens#Maximum_passport_age",
  "language": "hi",
  "scrapedAt": "2025-12-26T08:24:19.686Z"
 },
 {
  "type": "additional_info",
  "title": "Blank passport pages",
  "title_localized": "पासपोर्ट के खाली पृष्ठ",
  "url": "https://en.wikipedia.org/wiki/Visa_requirements_for_Indian_citizens#Blank_passport_pages",
  "language": "hi",
  "scrapedAt": "2025-12-26T08:24:19.686Z"
 },
 {
  "type": "additional_info",
  "title": "Vaccination",
  "title_localized": "टीकाकरण",
  "url": "https://en.wikipedia.org/wiki/Visa_requirements_for_Indian_citizens#Vaccination",
  "language": "hi",
  "scrapedAt": "2025-12-26T08:24:19.686Z"
 },
 {
  "type": "additional_info",
  "title": "Criminal record",
  "title_localized": "आपराधिक रिकॉर्ड",
  "url": "https://en.wikipedia.org/wiki/Visa_requirements_for_Indian_citizens#Criminal_record",
  "language": "hi",
  "scrapedAt": "2025-12-26T08:24:19.686Z"
 },
 {
  "type": "additional_info",
  "title": "Persona non grata",
  "title_localized": "पर्सोना नॉन ग्राटा",
  "url": "https://en.wikipedia.org/wiki/Visa_requirements_for_Indian_citizens#Persona_non_grata",
  "language": "hi",
  "scrapedAt": "2025-12-26T08:24:19.686Z"
 },
 {
  "type": "additional_info",
  "title": "Israeli stamps",
  "title_localized": "इज़राइली स्टैम्प",
  "url": "https://en.wikipedia.org/wiki/Visa_requirements_for_Indian_citizens#Israeli_stamps",
  "language": "hi",
  "scrapedAt": "2025-12-26T08:24:19.686Z"
 },
 {
  "type": "additional_info",
  "title": "Biometrics",
  "title_localized": "बायोमेट्रिक्स",
  "url": "https://en.wikipedia.org/wiki/Visa_requirements_for_Indian_citizens#Biometrics",
  "language": "hi",
  "scrapedAt": "2025-12-26T08:24:19.686Z"
 }
]
```

The dataset is cleared on each run to ensure only the latest data is stored.

*3. Kye-Value Store*

A structured summary of the visa lookup is also stored in the Key-Value Store under the key `RESULT`
This output contains the full structured response, including nested fields and localization data.

## Localization

- English is the source of truth

- *Localization is applied only to user-facing text:*
   - visaType
   - notes
   - additional info titles

- Powered by `lingo.dev`

- If localization fails, the actor safely falls back to English

## Exporting Data 

You can export datasets directly from the Apify UI or via the API.

*Excel (XLSX)*
```bash
https://api.apify.com/v2/datasets/<DATASET_ID>/items?format=xlsx&clean=true
```

*Works with:*

- Excel
- Google Sheets
- Power BI
- Automation pipelines

## Use Cases

- Travel planning
- Visa research
- Data analysis
- Automation workflows
- Excel / reporting pipelines

## One-line summary

Enter a nationality → choose a destination → get visa rules in your language, ready to export.
