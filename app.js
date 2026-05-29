const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTN9bFzUXNhhevW3Whon9dffKP9aNuHOAwtvUcQzo1W9hwMt97yPEu1x7u5kNhTo0Koh4FN56gLWZT/pub?gid=1291841456&single=true&output=csv";

// Kolomnamen
const KOLOM_DATUM = "Uitvoeringsdatum"; 
const KOLOM_BEDRAG = "Bedrag"; 
const KOLOM_TEGENPARTIJ = "Naam van de tegenpartij";
const KOLOM_MEDEDELING = "Mededeling";
const KOLOM_DETAILS = "Details";
const KOLOM_TYPE = "Type verrichting";

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

const HOOFD_GROEPEN = {
    "Eten & Drinken": ["Supermarkt", "Frietjes", "Restaurant", "Broodjes", "Bakker", "Sushi"],
    "Wonen & Energie": ["Bouwmarkt", "Meubelwinkel", "Lening", "Water, Gas & Elektriciteit", "Internet & Telecom", "Haviland"],
    "Vervoer & Auto": ["Tanken"],
    "Gezondheid & Zorg": ["Apotheek", "Kapper", "Kine"],
    "Vrije Tijd & Kleding": ["Hobby's", "Dreamland", "Bol", "Kleren"],
    "Kinderen": ["Creche"],
    "Werk & Verzekeringen": ["Automaat werk", "Pluspas", "AG insurance"]
};

const VASTE_CATEGORIEEN = ["AG insurance", "Lening", "Water, Gas & Elektriciteit", "Internet & Telecom", "Haviland"];

let alleData = []; 
let mijnMaandGrafiek = null, mijnCatGrafiek = null;

Papa.parse(sheetUrl, {
    download: true, header: true, dynamicTyping: true, skipEmptyLines: true,
    complete: function(results) {
        alleData = results.data;
        initialiseerJaren();
    }
});

function bepaalCategorie(rij) {
    const tekst = `${rij[KOLOM_TEGENPARTIJ]} ${rij[KOLOM_MEDEDELING]} ${rij[KOLOM_DETAILS]}`.toLowerCase();
    for (const [cat, words] of Object.entries(CATEGORIE_RULES)) {
        for (const w of words) if (tekst.includes(w.toLowerCase())) return cat;
    }
    return "Overig";
}

function bepaalHoofdgroep(sub) {
    for (const [hg, subs] of Object.entries(HOOFD_GROEPEN)) if (subs.includes(sub)) return hg;
    return "Overig";
}

function formatBedrag(g) { return "€ " + Math.abs(g).toLocaleString('nl-BE', { minimumFractionDigits: 2 }); }

function initialiseerJaren() {
    const jaren = [...new Set(alleData.map(r => String(r[KOLOM_DATUM]).split(/[-/]/).slice(-1)[0]))].sort().reverse();
    const select = document.getElementById('jaarSelect');
    jaren.forEach(j => { const o = document.createElement('option'); o.value = j; o.text = j; select.add(o); });
    select.addEventListener('change', updateDashboard);
    document.getElementById('sorteerSelect').addEventListener('change', updateDashboard);
    document.getElementById('toonEnkelOverig').addEventListener('change', updateDashboard);
    updateDashboard();
}

function updateDashboard() {
    const jaar = document.getElementById('jaarSelect').value;
    const data = alleData.filter(r => String(r[KOLOM_DATUM]).includes(jaar));
    verwerkData(data);
}

function verwerkData(data) {
    let inkomsten = 0, uitgaven = 0, vast = 0;
    const maanden = {}, cats = {}, groepen = {}, hgBreakdown = {};

    data.forEach(r => {
        let b = typeof r[KOLOM_BEDRAG] === 'string' ? parseFloat(r[KOLOM_BEDRAG].replace(',','.')) : r[KOLOM_BEDRAG];
        if (isNaN(b)) return;

        const cat = bepaalCategorie(r);
        const hg = bepaalHoofdgroep(cat);
        const m = String(r[KOLOM_DATUM]).split(/[-/]/)[1] + "-" + jaarSelect.value;

        if (b > 0) inkomsten += b;
        else {
            uitgaven += b;
            if (VASTE_CATEGORIEEN.includes(cat)) vast += Math.abs(b);
            
            if (!cats[cat]) cats[cat] = 0; cats[cat] += Math.abs(b);
            if (!groepen[hg]) groepen[hg] = 0; groepen[hg] += Math.abs(b);
            
            // Voor de drill-down
            if (!hgBreakdown[hg]) hgBreakdown[hg] = {};
            if (!hgBreakdown[hg][cat]) hgBreakdown[hg][cat] = 0;
            hgBreakdown[hg][cat] += Math.abs(b);
        }

        if (!maanden[m]) maanden[m] = { in: 0, uit: 0 };
        b > 0 ? maanden[m].in += b : maanden[m].uit += b;
    });

    // Update UI
    document.getElementById('jaarInkomsten').innerText = formatBedrag(inkomsten);
    document.getElementById('jaarUitgaven').innerText = formatBedrag(uitgaven);
    document.getElementById('jaarBalans').innerText = formatBedrag(inkomsten + uitgaven);
    document.getElementById('vastTotaal').innerText = formatBedrag(vast);

    bouwDrillDownTabel(hgBreakdown, groepen);
    tekenGrafieken(maanden, groepen);
    bouwTransactieTabel(data);
}

function bouwDrillDownTabel(breakdown, totalen) {
    const container = document.getElementById('hoofdgroepBody');
    container.innerHTML = '';

    Object.keys(totalen).sort((a,b) => totalen[b] - totalen[a]).forEach(hg => {
        // Hoofdgroep rij
        const hgRow = document.createElement('tr');
        hgRow.className = 'hg-row';
        hgRow.innerHTML = `<td><i class="fa-solid fa-chevron-right"></i> ${hg}</td><td style="text-align: right;">${formatBedrag(totalen[hg])}</td>`;
        hgRow.onclick = () => {
            const isVisible = hgRow.classList.contains('active');
            document.querySelectorAll('.hg-row').forEach(r => r.classList.remove('active'));
            if (!isVisible) hgRow.classList.add('active');
        };
        container.appendChild(hgRow);

        // Sub rijen
        Object.keys(breakdown[hg]).sort((a,b) => breakdown[hg][b] - breakdown[hg][a]).forEach(sub => {
            const subRow = document.createElement('tr');
            subRow.className = 'sub-row';
            subRow.innerHTML = `<td>${sub}</td><td style="text-align: right;">${formatBedrag(breakdown[hg][sub])}</td>`;
            container.appendChild(subRow);
        });
    });
}

function tekenGrafieken(mndData, grpData) {
    const ctxMaand = document.getElementById('maandGrafiek').getContext('2d');
    if (mijnMaandGrafiek) mijnMaandGrafiek.destroy();
    mijnMaandGrafiek = new Chart(ctxMaand, {
        type: 'bar',
        data: {
            labels: Object.keys(mndData),
            datasets: [
                { label: 'In', data: Object.values(mndData).map(v => v.in), backgroundColor: '#059669' },
                { label: 'Uit', data: Object.values(mndData).map(v => Math.abs(v.uit)), backgroundColor: '#dc2626' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctxCat = document.getElementById('categorieGrafiek').getContext('2d');
    if (mijnCatGrafiek) mijnCatGrafiek.destroy();
    mijnCatGrafiek = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: Object.keys(grpData),
            datasets: [{
                data: Object.values(grpData),
                // PREMIUM EMERALD & SLATE PALET
                backgroundColor: ['#065f46', '#0d9488', '#0891b2', '#0369a1', '#1e40af', '#4338ca', '#6d28d9', '#9333ea'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

function bouwTransactieTabel(data) {
    const filter = document.getElementById('toonEnkelOverig').checked;
    const body = document.getElementById('tableBody');
    body.innerHTML = '';
    
    let filtered = [...data];
    if (filter) filtered = filtered.filter(r => bepaalCategorie(r) === "Overig");

    filtered.slice(0, 100).forEach(r => {
        const row = body.insertRow();
        row.insertCell(0).innerText = r[KOLOM_DATUM];
        row.insertCell(1).innerText = r[KOLOM_TEGENPARTIJ] || "Overig";
        row.insertCell(2).innerText = r[KOLOM_BEDRAG];
        row.insertCell(3).innerText = bepaalCategorie(r);
    });
}
