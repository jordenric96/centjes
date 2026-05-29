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
let mijnMaandGrafiek = null, mijnCatGrafiek = null;

Papa.parse(sheetUrl, {
    download: true, header: true, dynamicTyping: true, skipEmptyLines: true,
    complete: function(results) {
        alleData = results.data;
        document.getElementById('status').innerText = `Live verbonden (${alleData.length} transacties)`;
        document.getElementById('status').classList.add('succes');
        initialiseerJaren();
    }
});

function bepaalCategorie(rij) {
    const tekst = `${rij[KOLOM_TEGENPARTIJ] || ''} ${rij[KOLOM_MEDEDELING] || ''} ${rij[KOLOM_DETAILS] || ''} ${rij[KOLOM_TYPE] || ''}`.toLowerCase();
    for (const [cat, words] of Object.entries(CATEGORIE_RULES)) {
        for (const w of words) if (tekst.includes(w.toLowerCase())) return cat;
    }
    return "Overig";
}

function bepaalHoofdgroep(sub) {
    for (const [hg, subs] of Object.entries(HOOFD_GROEPEN)) if (subs.includes(sub)) return hg;
    return "Overig";
}

function formatBedrag(g) { return "€ " + Math.abs(g).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function haalJaar(datumStr) {
    if (!datumStr) return "Onbekend";
    const parts = String(datumStr).split(/[-/]/);
    if (parts.length >= 3) return parts[0].length === 4 ? parts[0] : parts[2];
    return "Onbekend";
}

function initialiseerJaren() {
    const jarenSet = new Set();
    alleData.forEach(rij => {
        const jaar = haalJaar(rij[KOLOM_DATUM]);
        if (jaar !== "Onbekend") jarenSet.add(jaar);
    });

    const select = document.getElementById('jaarSelect');
    select.innerHTML = ''; 
    Array.from(jarenSet).sort().reverse().forEach(j => { 
        const o = document.createElement('option'); o.value = j; o.text = j; select.add(o); 
    });
    
    select.addEventListener('change', updateDashboard);
    document.getElementById('sorteerSelect').addEventListener('change', updateDashboard);
    document.getElementById('toonEnkelOverig').addEventListener('change', updateDashboard);
    
    updateDashboard();
}

function updateDashboard() {
    const gekozenJaar = document.getElementById('jaarSelect').value;
    const filterOpOverig = document.getElementById('toonEnkelOverig').checked;
    const sorteerKeuze = document.getElementById('sorteerSelect').value;
    
    // FILTER: Jaartal selecteren én de spaarrekening uitsluiten!
    const jaardata = alleData.filter(rij => {
        const isJuisteJaar = haalJaar(rij[KOLOM_DATUM]) === gekozenJaar;
        
        // Zoek naar de naam (in kleine letters om fouten te voorkomen)
        const tegenpartij = String(rij[KOLOM_TEGENPARTIJ] || "").toLowerCase();
        const mededeling = String(rij[KOLOM_MEDEDELING] || "").toLowerCase();
        
        // Als het een overschrijving naar de spaarrekening is, negeren we de rij volledig (return false)
        if (tegenpartij.includes("ricour-de bruyn") || mededeling.includes("ricour-de bruyn")) {
            return false; 
        }
        
        return isJuisteJaar;
    });
    
    verwerkData(jaardata, gekozenJaar);
    
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

function verwerkData(data, huidigJaar) {
    let inkomsten = 0, uitgaven = 0, vast = 0, grootsteUitgave = 0;
    const maanden = {}, cats = {}, groepen = {}, hgBreakdown = {};

    data.forEach(r => {
        let b = typeof r[KOLOM_BEDRAG] === 'string' ? parseFloat(r[KOLOM_BEDRAG].replace(',','.')) : r[KOLOM_BEDRAG];
        if (isNaN(b)) return;

        const cat = bepaalCategorie(r);
        const hg = bepaalHoofdgroep(cat);
        
        const dParts = String(r[KOLOM_DATUM]).split(/[-/]/);
        let m = "Onbekend";
        if(dParts.length >= 3) {
            if(dParts[0].length === 4) m = `${dParts[0]}-${dParts[1]}`;
            else m = `${dParts[2]}-${dParts[1]}`;
        }

        if (b > 0) {
            inkomsten += b;
        } else {
            uitgaven += b;
            if (b < grootsteUitgave) grootsteUitgave = b;
            if (VASTE_CATEGORIEEN.includes(cat)) vast += Math.abs(b);
            
            if (!cats[cat]) cats[cat] = 0; cats[cat] += Math.abs(b);
            if (!groepen[hg]) groepen[hg] = 0; groepen[hg] += Math.abs(b);
            
            if (!hgBreakdown[hg]) hgBreakdown[hg] = {};
            if (!hgBreakdown[hg][cat]) hgBreakdown[hg][cat] = 0;
            hgBreakdown[hg][cat] += Math.abs(b);
        }

        if (!maanden[m]) maanden[m] = { in: 0, uit: 0 };
        b > 0 ? maanden[m].in += b : maanden[m].uit += b;
    });

    document.getElementById('jaarInkomsten').innerText = formatBedrag(inkomsten);
    document.getElementById('jaarUitgaven').innerText = formatBedrag(uitgaven);
    
    const balans = inkomsten + uitgaven;
    const balansEl = document.getElementById('jaarBalans');
    balansEl.innerText = (balans < 0 ? "- " : "") + formatBedrag(balans);
    balansEl.className = balans > 0 ? 'bedrag positief' : (balans < 0 ? 'bedrag negatief' : 'bedrag neutraal');
    
    document.getElementById('vastTotaal').innerText = formatBedrag(vast);
    
    const aantalMaanden = Object.keys(maanden).length || 1;
    if(document.getElementById('statGemiddelde')) document.getElementById('statGemiddelde').innerText = formatBedrag(uitgaven / aantalMaanden);
    if(document.getElementById('statMax')) document.getElementById('statMax').innerText = formatBedrag(grootsteUitgave);

    let maandHtml = '';
    const gesorteerdeMaanden = Object.keys(maanden).sort();
    [...gesorteerdeMaanden].reverse().forEach(mnd => {
        if(mnd === "Onbekend") return;
        const md = maanden[mnd];
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
    if(document.getElementById('maandBody')) document.getElementById('maandBody').innerHTML = maandHtml;

    bouwDrillDownTabel(hgBreakdown, groepen);
    tekenGrafieken(maanden, groepen, gesorteerdeMaanden);
}

function bouwDrillDownTabel(breakdown, totalen) {
    const container = document.getElementById('hoofdgroepBody');
    if(!container) return;
    container.innerHTML = '';

    Object.keys(totalen).sort((a,b) => totalen[b] - totalen[a]).forEach(hg => {
        const hgRow = document.createElement('tr');
        hgRow.className = 'hg-row';
        hgRow.style.cursor = 'pointer';
        hgRow.style.backgroundColor = '#f8fafc';
        hgRow.innerHTML = `<td><span class="pijl" style="display:inline-block; transition: transform 0.2s; margin-right:8px; font-size:0.8rem;">▶</span> <strong>${hg}</strong></td><td style="text-align: right;"><strong>${formatBedrag(totalen[hg])}</strong></td>`;
        container.appendChild(hgRow);

        const subRows = [];
        Object.keys(breakdown[hg]).sort((a,b) => breakdown[hg][b] - breakdown[hg][a]).forEach(sub => {
            const subRow = document.createElement('tr');
            subRow.className = 'sub-row';
            subRow.style.display = 'none'; 
            subRow.style.backgroundColor = '#ffffff';
            subRow.innerHTML = `<td style="padding-left: 30px; color: #64748b; border-left: 3px solid #e2e8f0;">${sub}</td><td style="text-align: right; color: #64748b;">${formatBedrag(breakdown[hg][sub])}</td>`;
            container.appendChild(subRow);
            subRows.push(subRow);
        });

        hgRow.onclick = () => {
            const isExpanded = hgRow.classList.contains('expanded');
            
            document.querySelectorAll('.hg-row').forEach(r => {
                r.classList.remove('expanded');
                const p = r.querySelector('.pijl');
                if(p) p.style.transform = 'rotate(0deg)';
            });
            document.querySelectorAll('.sub-row').forEach(r => r.style.display = 'none');
            
            if (!isExpanded) {
                hgRow.classList.add('expanded');
                const p = hgRow.querySelector('.pijl');
                if(p) p.style.transform = 'rotate(90deg)';
                subRows.forEach(r => r.style.display = 'table-row');
            }
        };
    });
}

function tekenGrafieken(mndData, grpData, gesorteerdeMaanden) {
    const ctxMaand = document.getElementById('maandGrafiek').getContext('2d');
    if (mijnMaandGrafiek) mijnMaandGrafiek.destroy();
    
    const maandLabels = gesorteerdeMaanden.map(m => m.split('-')[1] + '-' + m.split('-')[0]);
    mijnMaandGrafiek = new Chart(ctxMaand, {
        type: 'bar',
        data: {
            labels: maandLabels,
            datasets: [
                { label: 'Inkomsten', data: gesorteerdeMaanden.map(m => mndData[m].in), backgroundColor: '#00E676', borderRadius: 4 }, 
                { label: 'Uitgaven', data: gesorteerdeMaanden.map(m => Math.abs(mndData[m].uit)), backgroundColor: '#FF3D00', borderRadius: 4 } 
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctxCat = document.getElementById('categorieGrafiek').getContext('2d');
    if (mijnCatGrafiek) mijnCatGrafiek.destroy();
    
    const frisseKleuren = [
        '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A733FF', '#FF3366', '#00E5FF', '#999999'  
    ];

    const gesorteerdeGroepen = Object.keys(grpData).sort((a, b) => grpData[b] - grpData[a]);

    mijnCatGrafiek = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: gesorteerdeGroepen,
            datasets: [{
                data: gesorteerdeGroepen.map(hg => grpData[hg]),
                backgroundColor: frisseKleuren,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
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
