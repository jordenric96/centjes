const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTN9bFzUXNhhevW3Whon9dffKP9aNuHOAwtvUcQzo1W9hwMt97yPEu1x7u5kNhTo0Koh4FN56gLWZT/pub?gid=1291841456&single=true&output=csv";

const KOLOM_DATUM = "Uitvoeringsdatum"; 
const KOLOM_BEDRAG = "Bedrag"; 
const KOLOM_TEGENPARTIJ = "Naam van de tegenpartij";
const KOLOM_MEDEDELING = "Mededeling";
const KOLOM_DETAILS = "Details";
const KOLOM_TYPE = "Type verrichting";

// --- 1. JOUW SPECIFIEKE CATEGORIEËN ---
const CATEGORIE_RULES = {
    "Supermarkt": ["huwaert", "FLAVOR SHOP", "Kruidvat", "okay", "colruyt", "carrefour", "aldi", "CO&GO", "BON'AP", "ALBERT HEIJN", "delhaize", "FRESHVILLE", "FOOD FACTORY", "HELLOFRESH"],
    "Creche": ["disneyland"],
    "Automaat werk": ["SELECTA 2850 BOOM"],
    "Frietjes": ["Carnier", "Frit", "Brochettte", "friet"],
    "Restaurant": ["restaurant", "brasserie", "bistro", "pizzeria"], 
    "Bouwmarkt": ["Gamma", "Brico", "FLORALUX", "TUINCENTRUM"],
    "Dreamland": ["Dreamland"],
    "Bol": ["Bol"],
    "Broodjes": ["PRINSKE"],
    "Meubelwinkel": ["Jysk", "Ikea", "MATRATZEN", "HEMA"],
    "Apotheek": ["Apotheek", "NEWPHARMA", "Pharma"], 
    "Bakker": ["Exotica", "Locus"],
    "Tanken": ["Dats", "Total"],
    "Sushi": ["Sushi"],
    "Kleren": ["Fashion", "Zalando", "JBC", "H&M", "Zara", "DEDOLES"],
    "Kapper": ["Hair", "BLONDES & BROWNIES"],
    "Hobby's": ["Foot", "Padel", "Ludus", "Sportigo", "KV KESTER GOOIK", "VANDERVELDE-VOSSEN", "Decathlon", "Iboya"],
    "Kine": ["kine", "Action"],
    "Pluspas": ["Pluspas", "Corporate Benefits"],
    "Haviland": ["Haviland"],
    "AG insurance": ["AG"],
    "Lening": ["Woonkrediet", "ALPHA CREDIT"], 
    "Water, Gas & Elektriciteit": ["water", "watergroep", "LUMINUS", "ELECTRABEL"],
    "Internet & Telecom": ["internet", "telenet", "proximus", "orange", "base"]
};

// --- 2. DE HOOFDGROEPEN ---
const HOOFD_GROEPEN = {
    "Eten & Drinken": ["Supermarkt", "Frietjes", "Restaurant", "Broodjes", "Bakker", "Sushi"],
    "Wonen & Energie": ["Bouwmarkt", "Meubelwinkel", "Lening", "Water, Gas & Elektriciteit", "Internet & Telecom", "Haviland"],
    "Vervoer & Auto": ["Tanken"],
    "Gezondheid & Zorg": ["Apotheek", "Kapper", "Kine"],
    "Vrije Tijd & Kleding": ["Hobby's", "Dreamland", "Bol", "Kleren"],
    "Kinderen": ["Creche"],
    "Werk & Verzekeringen": ["Automaat werk", "Pluspas", "AG insurance"]
};

// --- 3. VASTE KOSTEN LIJST ---
const VASTE_CATEGORIEEN = [
    "AG insurance", "Lening", "Water, Gas & Elektriciteit", "Internet & Telecom", "Haviland"
];

let alleData = []; 
let mijnMaandGrafiek = null;
let mijnCatGrafiek = null;

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
    const tekstOmInTeZoeken = `${rij[KOLOM_TEGENPARTIJ] || ''} ${rij[KOLOM_MEDEDELING] || ''} ${rij[KOLOM_DETAILS] || ''} ${rij[KOLOM_TYPE] || ''}`.toLowerCase();
    for (const [categorie, trefwoorden] of Object.entries(CATEGORIE_RULES)) {
        for (const trefwoord of trefwoorden) {
            if (tekstOmInTeZoeken.includes(trefwoord.toLowerCase())) return categorie;
        }
    }
    return "Overig";
}

function bepaalHoofdgroep(subCategorie) {
    for (const [hoofdgroep, subCats] of Object.entries(HOOFD_GROEPEN)) {
        if (subCats.includes(subCategorie)) return hoofdgroep;
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

function haalMaandJaarSortering(datumStr) {
    if (!datumStr) return "Onbekend";
    const parts = String(datumStr).split(/[-/]/);
    if (parts.length >= 3) {
        if (parts[0].length === 4) return `${parts[0]}-${parts[1]}`; 
        return `${parts[2]}-${parts[1]}`; 
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

        if (sorteerKeuze === "uitgaven") return bedragA - bedragB;
        else if (sorteerKeuze === "inkomsten") return bedragB - bedragA;
        else {
            const parseDatum = (d) => {
                if (!d) return 0;
                const p = String(d).split(/[-/]/);
                if (p.length === 3) return p[0].length === 4 ? new Date(`${p[0]}-${p[1]}-${p[2]}`).getTime() : new Date(`${p[2]}-${p[1]}-${p[0]}`).getTime();
                return 0;
            };
            return parseDatum(b[KOLOM_DATUM]) - parseDatum(a[KOLOM_DATUM]);
        }
    });
    
    bouwTransactieTabel(tabelData);
}

function verwerkData(data) {
    let jaarIn = 0, jaarUit = 0;
    let vastTotaal = 0, variabelTotaal = 0;
    let grootsteUitgave = 0; 
    const maandData = {};
    const categorieData = {};
    const hoofdgroepData = {}; 

    data.forEach(rij => {
        let bedrag = rij[KOLOM_BEDRAG];
        if (typeof bedrag === 'string') bedrag = parseFloat(bedrag.replace(',', '.'));
        if (isNaN(bedrag) || bedrag === null) return;

        const datum = rij[KOLOM_DATUM];
        const maandJaar = haalMaandJaarSortering(datum);
        const categorie = bepaalCategorie(rij);
        const hoofdgroep = bepaalHoofdgroep(categorie);

        if (bedrag > 0) {
            jaarIn += bedrag;
        } else {
            jaarUit += bedrag;
            if (bedrag < grootsteUitgave) grootsteUitgave = bedrag;
            
            if (VASTE_CATEGORIEEN.includes(categorie)) vastTotaal += Math.abs(bedrag);
            else variabelTotaal += Math.abs(bedrag);
        }

        if (!maandData[maandJaar]) maandData[maandJaar] = { in: 0, uit: 0 };
        if (bedrag > 0) maandData[maandJaar].in += bedrag;
        else maandData[maandJaar].uit += bedrag;

        if (bedrag < 0) {
            if (!categorieData[categorie]) categorieData[categorie] = 0;
            categorieData[categorie] += Math.abs(bedrag);
            
            if (!hoofdgroepData[hoofdgroep]) hoofdgroepData[hoofdgroep] = 0;
            hoofdgroepData[hoofdgroep] += Math.abs(bedrag);
        }
    });

    document.getElementById('jaarInkomsten').innerText = formatBedrag(jaarIn);
    document.getElementById('jaarUitgaven').innerText = formatBedrag(jaarUit);
    document.getElementById('vastTotaal').innerText = formatBedrag(vastTotaal);
    document.getElementById('variabelTotaal').innerText = formatBedrag(variabelTotaal);
    
    const balans = jaarIn + jaarUit;
    const balansEl = document.getElementById('jaarBalans');
    balansEl.innerText = (balans < 0 ? "- " : "") + formatBedrag(balans);
    balansEl.className = balans > 0 ? 'bedrag positief' : (balans < 0 ? 'bedrag negatief' : 'bedrag neutraal');

    const aantalMaanden = Object.keys(maandData).length || 1;
    document.getElementById('statGemiddelde').innerText = formatBedrag(jaarUit / aantalMaanden);
    document.getElementById('statMax').innerText = formatBedrag(grootsteUitgave);

    let maandHtml = '';
    const gesorteerdeMaanden = Object.keys(maandData).sort(); 
    [...gesorteerdeMaanden].reverse().forEach(mnd => {
        const md = maandData[mnd];
        const mBalans = md.in + md.uit;
        let balansClass = mBalans >= 0 ? "tekst-positief" : "tekst-negatief";
        const mooieMaand = mnd.split('-')[1] + '-' + mnd.split('-')[0];

        maandHtml += `<tr>
            <td><strong>${mooieMaand}</strong></td>
            <td class="tekst-positief">${formatBedrag(md.in)}</td>
            <td class="tekst-negatief">${formatBedrag(md.uit)}</td>
            <td class="${balansClass}"><strong>${(mBalans < 0 ? "- " : "")}${formatBedrag(mBalans)}</strong></td>
        </tr>`;
    });
    document.getElementById('maandBody').innerHTML = maandHtml;

    let hgHtml = '';
    const gesorteerdeHG = Object.keys(hoofdgroepData).sort((a, b) => hoofdgroepData[b] - hoofdgroepData[a]);
    gesorteerdeHG.forEach(hg => {
        hgHtml += `<tr>
            <td><strong>${hg}</strong></td>
            <td>${formatBedrag(hoofdgroepData[hg])}</td>
        </tr>`;
    });
    document.getElementById('hoofdgroepBody').innerHTML = hgHtml;

    let catHtml = '';
    const gesorteerdeCat = Object.keys(categorieData).sort((a, b) => categorieData[b] - categorieData[a]);
    gesorteerdeCat.forEach(cat => {
        catHtml += `<tr>
            <td><strong>${cat}</strong></td>
            <td>${formatBedrag(categorieData[cat])}</td>
        </tr>`;
    });
    document.getElementById('categorieBody').innerHTML = catHtml;

    tekenGrafieken(maandData, gesorteerdeMaanden, hoofdgroepData, gesorteerdeHG);
}

function tekenGrafieken(maandData, gesorteerdeMaanden, hoofdgroepData, gesorteerdeHG) {
    // --- STAAFGRAFIEK MET ZACHTERE KLEUREN ---
    const ctxMaand = document.getElementById('maandGrafiek').getContext('2d');
    if (mijnMaandGrafiek) mijnMaandGrafiek.destroy(); 
    
    const maandLabels = gesorteerdeMaanden.map(m => m.split('-')[1] + '-' + m.split('-')[0]); 
    const inData = gesorteerdeMaanden.map(m => maandData[m].in);
    const uitData = gesorteerdeMaanden.map(m => Math.abs(maandData[m].uit));

    mijnMaandGrafiek = new Chart(ctxMaand, {
        type: 'bar',
        data: {
            labels: maandLabels,
            datasets: [
                { 
                    label: 'Inkomsten', 
                    data: inData, 
                    backgroundColor: 'rgba(5, 150, 105, 0.8)', // Zachter groen
                    borderRadius: 4 
                },
                { 
                    label: 'Uitgaven', 
                    data: uitData, 
                    backgroundColor: 'rgba(220, 38, 38, 0.8)', // Zachter rood
                    borderRadius: 4 
                }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // --- DONUT GRAFIEK MET PREMIUM BANK-PALET ---
    const ctxCat = document.getElementById('categorieGrafiek').getContext('2d');
    if (mijnCatGrafiek) mijnCatGrafiek.destroy(); 

    const hgDataArray = gesorteerdeHG.map(hg => hoofdgroepData[hg]);

    mijnCatGrafiek = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: gesorteerdeHG,
            datasets: [{
                data: hgDataArray,
                backgroundColor: [
                    '#1e3a8a', // Diep donkerblauw
                    '#3b82f6', // Helder blauw
                    '#0ea5e9', // Oceaan blauw
                    '#14b8a6', // Teal / Zeegroen
                    '#6366f1', // Zacht indigo
                    '#8b5cf6', // Zacht paars
                    '#94a3b8', // Neutraal leisteengrijs
                    '#cbd5e1'  // Lichtgrijs voor de restjes
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
        }
    });
}

function bouwTransactieTabel(data) {
    if(data.length === 0) {
        document.getElementById('tableHead').innerHTML = '';
        document.getElementById('tableBody').innerHTML = '<tr><td style="padding: 20px; text-align: center;">Geen transacties gevonden.</td></tr>';
        return;
    }

    const headers = Object.keys(data[0]);
    let headerHtml = '<tr>';
    headers.forEach(h => { headerHtml += `<th>${h}</th>`; });
    headerHtml += `<th>Hoofdgroep</th><th>Categorie</th></tr>`; 
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
        const berekendeHoofd = bepaalHoofdgroep(berekendeCat);
        
        const isOverig = berekendeCat === "Overig";
        const bgKleur = isOverig ? "#ffeedd" : "#e1e8ed";
        const tekstKleur = isOverig ? "#d35400" : "#34495e";
        
        bodyHtml += `<td><span class="status-badge" style="background-color: transparent; border: 1px solid #ccc; color: #666;">${berekendeHoofd}</span></td>`;
        bodyHtml += `<td><span class="status-badge" style="background-color: ${bgKleur}; color: ${tekstKleur};">${berekendeCat}</span></td>`;
        bodyHtml += '</tr>';
    });
    document.getElementById('tableBody').innerHTML = bodyHtml;
}
