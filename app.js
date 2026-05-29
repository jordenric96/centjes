const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTN9bFzUXNhhevW3Whon9dffKP9aNuHOAwtvUcQzo1W9hwMt97yPEu1x7u5kNhTo0Koh4FN56gLWZT/pub?gid=1291841456&single=true&output=csv";

const KOLOM_DATUM = "Uitvoeringsdatum"; 
const KOLOM_BEDRAG = "Bedrag"; 
const KOLOM_TEGENPARTIJ = "Naam van de tegenpartij";
const KOLOM_MEDEDELING = "Mededeling";
const KOLOM_DETAILS = "Details";
const KOLOM_TYPE = "Type verrichting";

// --- JOUW CATEGORIEËN (HIER MOETEN ALLE WOORDEN IN) ---
const CATEGORIE_RULES = {
    "Supermarkt": ["huwaert", "FLAVOR SHOP", "Kruidvat", "okay", "colruyt", "carrefour", "aldi", "CO&GO", "BON'AP", "ALBERT HEIJN", "delhaize", "FRESHVILLE", "FOOD FACTORY"],
    "Creche": ["disneyland"],
    "Automaat werk": ["SELECTA 2850 BOOM"],
    "Frietjes": ["Carnier", "Frit", "Brochettte", "friet"],
    "Bouwmarkt": ["Gamma", "Brico"],
    "Dreamland": ["Dreamland"],
    "Bol": ["Bol"],
    "Broodjes": ["PRINSKE"],
    "Meubelwinkel": ["Jysk", "Ikea"],
    "Apotheek": ["Apotheek"], 
    "Bakker": ["Exotica", "Locus"],
    "Tanken": ["Dats", "Total"],
    "Sushi": ["Sushi"],
    "Kleren": ["Fashion", "Zalando", "JBC", "H&M", "Zara"],
    "Kapper": ["Hair"],
    "Hobby's": ["Foot", "Padel", "Ludus", "Sportigo"]
    // Hieronder staan je vaste kosten inclusief hun zoekwoorden:
   
};

// --- NIEUW: VASTE KOSTEN LIJST (HIER ENKEL DE NAMEN VAN DE CATEGORIEËN) ---
// Alles wat hierin staat telt op als 'Vast', de rest is automatisch 'Variabel'.
const VASTE_CATEGORIEEN = [
    "AG insurance": ["AG"],
    "Lening": ["Woonkrediet", "ALPHA CREDIT"], 
    "Water, Gas & Elektriciteit": ["water", "watergroep"],
    "Internet & Telecom": ["internet", "telenet", "proximus", "orange", "base"]
];

let alleData = []; 

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

function bepaalCategorie(rij) {
    const tekstOmInTeZoeken = `
        ${rij[KOLOM_TEGENPARTIJ] || ''} 
        ${rij[KOLOM_MEDEDELING] || ''} 
        ${rij[KOLOM_DETAILS] || ''} 
        ${rij[KOLOM_TYPE] || ''}
    `.toLowerCase();

    for (const [categorie, trefwoorden] of Object.entries(CATEGORIE_RULES)) {
        for (const trefwoord of trefwoorden) {
            if (tekstOmInTeZoeken.includes(trefwoord.toLowerCase())) {
                return categorie;
            }
        }
    }
    return "Overig";
}

function haalJaar(datumStr) {
    if (!datumStr) return "Onbekend";
    const parts = String(datumStr).split(/[-/]/);
    if (parts.length >= 3) {
        if (parts[0].length === 4) return parts[0]; 
        return parts[2]; 
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
    select.innerHTML = ''; 
    
    jarenArray.forEach(jaar => {
        const option = document.createElement('option');
        option.value = jaar;
        option.textContent = jaar;
        select.appendChild(option);
    });

    select.addEventListener('change', updateDashboard);
    document.getElementById('toonEnkelOverig').addEventListener('change', updateDashboard);
    document.getElementById('sorteerSelect').addEventListener('change', updateDashboard);
    
    updateDashboard();
}

function updateDashboard() {
    const gekozenJaar = document.getElementById('jaarSelect').value;
    const filterOpOverig = document.getElementById('toonEnkelOverig').checked;
    const sorteerKeuze = document.getElementById('sorteerSelect').value;
    
    const jaardata = alleData.filter(rij => haalJaar(rij[KOLOM_DATUM]) === gekozenJaar);
    
    verwerkData(jaardata);
    
    let tabelData = [...jaardata];
    
    if (filterOpOverig) {
        tabelData = tabelData.filter(rij => bepaalCategorie(rij) === "Overig");
    }

    tabelData.sort((a, b) => {
        let bedragA = a[KOLOM_BEDRAG];
        let bedragB = b[KOLOM_BEDRAG];
        
        if (typeof bedragA === 'string') bedragA = parseFloat(bedragA.replace(',', '.'));
        if (typeof bedragB === 'string') bedragB = parseFloat(bedragB.replace(',', '.'));
        bedragA = isNaN(bedragA) ? 0 : bedragA;
        bedragB = isNaN(bedragB) ? 0 : bedragB;

        if (sorteerKeuze === "uitgaven") {
            return bedragA - bedragB;
        } else if (sorteerKeuze === "inkomsten") {
            return bedragB - bedragA;
        } else {
            const parseDatum = (d) => {
                if (!d) return 0;
                const p = String(d).split(/[-/]/);
                if (p.length === 3) {
                    return p[0].length === 4 ? new Date(`${p[0]}-${p[1]}-${p[2]}`).getTime() : new Date(`${p[2]}-${p[1]}-${p[0]}`).getTime();
                }
                return 0;
            };
            return parseDatum(b[KOLOM_DATUM]) - parseDatum(a[KOLOM_DATUM]);
        }
    });
    
    bouwTransactieTabel(tabelData);
}

function verwerkData(data) {
    let jaarIn = 0, jaarUit = 0;
    let vastTotaal = 0, variabelTotaal = 0; // Nieuwe tellers
    const maandData = {};
    const categorieData = {};

    data.forEach(rij => {
        let bedrag = rij[KOLOM_BEDRAG];
        if (typeof bedrag === 'string') bedrag = parseFloat(bedrag.replace(',', '.'));
        if (isNaN(bedrag) || bedrag === null) return;

        const datum = rij[KOLOM_DATUM];
        const maandJaar = haalMaandJaar(datum);
        const categorie = bepaalCategorie(rij);

        if (bedrag > 0) {
            jaarIn += bedrag;
        } else {
            jaarUit += bedrag;
            
            // Controleer of de uitgave VAST of VARIABEL is
            if (VASTE_CATEGORIEEN.includes(categorie)) {
                vastTotaal += Math.abs(bedrag);
            } else {
                variabelTotaal += Math.abs(bedrag);
            }
        }

        if (!maandData[maandJaar]) maandData[maandJaar] = { in: 0, uit: 0 };
        if (bedrag > 0) maandData[maandJaar].in += bedrag;
        else maandData[maandJaar].uit += bedrag;

        if (bedrag < 0) {
            if (!categorieData[categorie]) categorieData[categorie] = 0;
            categorieData[categorie] += Math.abs(bedrag);
        }
    });

    document.getElementById('jaarInkomsten').innerText = formatBedrag(jaarIn);
    document.getElementById('jaarUitgaven').innerText = formatBedrag(jaarUit);
    
    // Update de nieuwe HTML velden voor Vast en Variabel
    document.getElementById('vastTotaal').innerText = formatBedrag(vastTotaal);
    document.getElementById('variabelTotaal').innerText = formatBedrag(variabelTotaal);
    
    const balans = jaarIn + jaarUit;
    const balansEl = document.getElementById('jaarBalans');
    balansEl.innerText = (balans < 0 ? "- " : "") + formatBedrag(balans);
    if (balans > 0) balansEl.className = 'bedrag positief';
    else if (balans < 0) balansEl.className = 'bedrag negatief';

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
        document.getElementById('tableBody').innerHTML = '<tr><td style="padding: 20px; text-align: center;">Geen transacties gevonden voor deze selectie.</td></tr>';
        return;
    }

    const headers = Object.keys(data[0]);
    let headerHtml = '<tr>';
    headers.forEach(h => { headerHtml += `<th>${h}</th>`; });
    headerHtml += `<th>Berekende Categorie</th></tr>`;
    document.getElementById('tableHead').innerHTML = headerHtml;

    let bodyHtml = '';
    const toonData = data.slice(0, 150); 
    
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
        
        const berekendeCat = bepaalCategorie(rij);
        const bgKleur = berekendeCat === "Overig" ? "#ffeedd" : "#e1e8ed";
        const tekstKleur = berekendeCat === "Overig" ? "#d35400" : "#34495e";
        
        bodyHtml += `<td><span class="status-badge" style="background-color: ${bgKleur}; color: ${tekstKleur};">${berekendeCat}</span></td>`;
        bodyHtml += '</tr>';
    });
    document.getElementById('tableBody').innerHTML = bodyHtml;
}
