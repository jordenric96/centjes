// --- 1. CONFIGURATIE ---
const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTN9bFzUXNhhevW3Whon9dffKP9aNuHOAwtvUcQzo1W9hwMt97yPEu1x7u5kNhTo0Koh4FN56gLWZT/pub?gid=1291841456&single=true&output=csv";

// Kolomnamen exact zoals in jouw bank-export
const KOLOM_DATUM = "Uitvoeringsdatum"; 
const KOLOM_BEDRAG = "Bedrag"; 
const KOLOM_TEGENPARTIJ = "Naam van de tegenpartij";
const KOLOM_MEDEDELING = "Mededeling";
const KOLOM_DETAILS = "Details";
const KOLOM_TYPE = "Type verrichting";

// --- 2. CATEGORIE REGELS (Pas dit aan en breid dit uit!) ---
// Het script zoekt of een van deze woorden voorkomt in de transactiegegevens (hoofdletterongevoelig)
const CATEGORIE_RULES = {
    "Boodschappen": ["colruyt", "delhaize", "albert heijn", "carrefour", "lidl", "aldi", "bakkers", "slager"],
    "Kinderen & Gezin": ["ricour", "school", "opvang", "speelgoed", "kinderbijslag"],
    "Vaste Lasten": ["belfius", "kbc", "cm", "engie", "fluvius", "telenet", "proximus", "huur", "verzekering"],
    "Auto & Transport": ["total", "q8", "shell", "tank", "nmbs", "delijn", "parkeren"],
    "Vrije Tijd & Sport": ["padel", "restaurant", "café", "fortnite", "ps5", "decathlon", "cinema"],
    "Inkomsten / Loon": ["wedde", "salaris", "loon", "storting", "terugbetaling"]
};

let alleData = []; 

// Start het ophalen van de data zodra het script geladen is
Papa.parse(sheetUrl, {
    download: true,
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(results) {
        const data = results.data;
        if(data && data.length > 0) {
            alleData = data;
            document.getElementById('status').innerText = `Live verbonden (${data.length} transacties)`;
            document.getElementById('status').classList.add('succes');
            initialiseerJaren();
        } else {
            document.getElementById('status').innerText = "Spreadsheet is leeg of onleesbaar.";
        }
    }
});

// --- 3. INTELLIGENTE CATEGORISERING ---
function bepaalCategorie(rij) {
    // Voeg alle relevante tekstvelden samen om in te zoeken
    const tekstOmInTeZoeken = `
        ${rij[KOLOM_TEGENPARTIJ] || ''} 
        ${rij[KOLOM_MEDEDELING] || ''} 
        ${rij[KOLOM_DETAILS] || ''} 
        ${rij[KOLOM_TYPE] || ''}
    `.toLowerCase();

    // Loop door alle categorieën en hun trefwoorden heen
    for (const [categorie, trefwoorden] of Object.entries(CATEGORIE_RULES)) {
        for (const trefwoord of trefwoorden) {
            if (tekstOmInTeZoeken.includes(trefwoord.toLowerCase())) {
                return categorie; // Match gevonden! Return direct de categorie.
            }
        }
    }

    // Geen match? Dan valt het onder Overig
    return "Overig";
}

// --- 4. DATA VERWERKING & LOGICA ---
function haalJaar(datumStr) {
    if (!datumStr) return "Onbekend";
    const parts = String(datumStr).split(/[-/]/);
    if (parts.length >= 3) {
        if (parts[0].length === 4) return parts[0]; // YYYY-MM-DD
        return parts[2]; // DD-MM-YYYY
    }
    return "Onbekend";
}

function haalMaandJaar(datumStr) {
    if (!datumStr) return "Onbekend";
    const parts = String(datumStr).split(/[-/]/);
    if (parts.length >= 3) {
        if (parts[0].length === 4) return `${parts[1]}-${parts[0]}`; 
        return `${parts[1]}-${parts[2]}`; 
    }
    return "Onbekend";
}

function formatBedrag(getal) {
    return "€ " + Math.abs(getal).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function initialiseerJaren() {
    const jarenSet = new Set();
    alleData.forEach(rij => {
        const jaar = haalJaar(rij[KOLOM_DATUM]);
        if (jaar !== "Onbekend") jarenSet.add(jaar);
    });

    const jarenArray = Array.from(jarenSet).sort().reverse();
    const select = document.getElementById('jaarSelect');
    select.innerHTML = ''; // Maak leeg
    
    jarenArray.forEach(jaar => {
        const option = document.createElement('option');
        option.value = jaar;
        option.textContent = jaar;
        select.appendChild(option);
    });

    select.addEventListener('change', updateDashboard);
    updateDashboard();
}

function updateDashboard() {
    const gekozenJaar = document.getElementById('jaarSelect').value;
    const gefilterdeData = alleData.filter(rij => haalJaar(rij[KOLOM_DATUM]) === gekozenJaar);
    
    verwerkData(gefilterdeData);
    bouwTransactieTabel(gefilterdeData);
}

function verwerkData(data) {
    let jaarIn = 0, jaarUit = 0;
    const maandData = {};
    const categorieData = {};

    data.forEach(rij => {
        let bedrag = rij[KOLOM_BEDRAG];
        if (typeof bedrag === 'string') bedrag = parseFloat(bedrag.replace(',', '.'));
        if (isNaN(bedrag) || bedrag === null) return;

        const datum = rij[KOLOM_DATUM];
        const maandJaar = haalMaandJaar(datum);
        
        // Bepaal de categorie op basis van de ingebouwde regels
        const categorie = bepaalCategorie(rij);

        if (bedrag > 0) jaarIn += bedrag;
        else jaarUit += bedrag;

        if (!maandData[maandJaar]) maandData[maandJaar] = { in: 0, uit: 0 };
        if (bedrag > 0) maandData[maandJaar].in += bedrag;
        else maandData[maandJaar].uit += bedrag;

        // Categorie totalen berekenen (alleen voor uitgaven)
        if (bedrag < 0) {
            if (!categorieData[categorie]) categorieData[categorie] = 0;
            categorieData[categorie] += Math.abs(bedrag);
        }
    });

    // Update HTML Jaar kaarten
    document.getElementById('jaarInkomsten').innerText = formatBedrag(jaarIn);
    document.getElementById('jaarUitgaven').innerText = formatBedrag(jaarUit);
    
    const balans = jaarIn + jaarUit;
    const balansEl = document.getElementById('jaarBalans');
    balansEl.innerText = (balans < 0 ? "- " : "") + formatBedrag(balans);
    if (balans > 0) balansEl.className = 'bedrag positief';
    else if (balans < 0) balansEl.className = 'bedrag negatief';

    // Update HTML Maanden tabel
    let maandHtml = '';
    Object.keys(maandData).sort().reverse().forEach(mnd => {
        const md = maandData[mnd];
        const mBalans = md.in + md.uit;
        let balansClass = mBalans >= 0 ? "tekst-positief" : "tekst-negatief";
        
        maandHtml += `<tr>
            <td><strong>${mnd}</strong></td>
            <td class="tekst-positief">${formatBedrag(md.in)}</td>
            <td class="tekst-negatief">${formatBedrag(md.uit)}</td>
            <td class="${balansClass}"><strong>${(mBalans < 0 ? "- " : "")}${formatBedrag(mBalans)}</strong></td>
        </tr>`;
    });
    document.getElementById('maandBody').innerHTML = maandHtml;

    // Update HTML Categorieën tabel
    let catHtml = '';
    Object.keys(categorieData).sort((a, b) => categorieData[b] - categorieData[a]).forEach(cat => {
        catHtml += `<tr>
            <td><strong>${cat}</strong></td>
            <td>${formatBedrag(categorieData[cat])}</td>
        </tr>`;
    });
    document.getElementById('categorieBody').innerHTML = catHtml;
}

function bouwTransactieTabel(data) {
    if(data.length === 0) {
        document.getElementById('tableHead').innerHTML = '';
        document.getElementById('tableBody').innerHTML = '<tr><td>Geen transacties gevonden voor dit jaar.</td></tr>';
        return;
    }

    const headers = Object.keys(data[0]);
    
    let headerHtml = '<tr>';
    headers.forEach(h => { headerHtml += `<th>${h}</th>`; });
    // Voeg handmatig een extra header toe voor de berekende categorie
    headerHtml += `<th>Berekende Categorie</th></tr>`;
    document.getElementById('tableHead').innerHTML = headerHtml;

    let bodyHtml = '';
    const toonData = data.slice(0, 150); // Beperk tot laatste 150 rijen voor snelheid
    
    toonData.forEach(rij => {
        bodyHtml += '<tr>';
        headers.forEach(h => {
            let waarde = rij[h];
            if (h === KOLOM_BEDRAG) {
                let num = typeof waarde === 'string' ? parseFloat(waarde.replace(',', '.')) : waarde;
                if (!isNaN(num) && num !== null) {
                    let cssClass = num > 0 ? 'tekst-positief' : 'tekst-negatief';
                    waarde = `<span class="${cssClass}">${formatBedrag(num)}</span>`;
                }
            }
            bodyHtml += `<td>${waarde !== null && waarde !== undefined ? waarde : ''}</td>`;
        });
        
        // Voeg de berekende categorie als extra cel toe aan het einde van de rij
        const berekendeCat = bepaalCategorie(rij);
        bodyHtml += `<td><span class="status-badge" style="background-color: #f0f3f4; color: #34495e;">${berekendeCat}</span></td>`;
        bodyHtml += '</tr>';
    });
    document.getElementById('tableBody').innerHTML = bodyHtml;
}
