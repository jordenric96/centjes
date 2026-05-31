// app.js - Financiële Dashboard + Strakke tabellen en Lijngrafiek

const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTN9bFzUXNhhevW3Whon9dffKP9aNuHOAwtvUcQzo1W9hwMt97yPEu1x7u5kNhTo0Koh4FN56gLWZT/pub?gid=1291841456&single=true&output=csv";
const budgetSheetUrl = ""; // VUL HIER DE LINK NAAR JE NIEUWE WEEKMENU CSV IN

const KOLOM_DATUM = "Uitvoeringsdatum"; 
const KOLOM_BEDRAG = "Bedrag"; 
const KOLOM_TEGENPARTIJ = "Naam van de tegenpartij";
const KOLOM_MEDEDELING = "Mededeling";
const KOLOM_DETAILS = "Details";
const KOLOM_TYPE = "Type verrichting";

const CATEGORIE_RULES = {
    "Supermarkt": ["huwaert", "FLAVOR SHOP", "AVA", "Kruidvat", "okay", "colruyt", "carrefour", "aldi", "CO&GO", "BON'AP", "ALBERT HEIJN", "delhaize", "FRESHVILLE", "FOOD FACTORY", "HELLOFRESH", "WIBRA", "FOODCOMPANY"],
    "Creche": ["disneyland"],
    "Automaat werk": ["SELECTA 2850 BOOM"],
    "Frietjes": ["Carnier", "Frit", "Brochettte", "friet", "MCDONALD'S", "HOGENBERG"],
    "Restaurant": ["restaurant", "brasserie", "bistro", "pizzeria", "WOLF BRUXELLES"], 
    "Bouwmarkt": ["Gamma", "Brico", "FLORALUX", "TUINCENTRUM", "HORTA", "ERICA"],
    "Dreamland": ["Dreamland"],
    "Online": ["Bol", "Amazon", "Coolblue", "Ali"],
    "Ijsjes": ["Ijs", "Krijmerie", "Martinique", "Choconelly"],
    "Broodjes": ["PRINSKE"],
    "Meubelwinkel": ["Jysk", "Ikea", "MATRATZEN", "HEMA"],
    "Apotheek": ["Apotheek", "NEWPHARMA", "Pharma", "FARMALINE"], 
    "Bakker": ["Exotica", "Locus"],
    "Tanken": ["Dats", "Total"],
    "Sushi": ["Sushi"],
    "Kleren": ["Fashion", "Zalando", "JBC", "H&M", "Zara", "DEDOLES"],
    "Kapper": ["Hair", "BLONDES & BROWNIES"],
    "Hobby's": ["Foot", "Padel", "Ludus", "Sportigo", "KV KESTER GOOIK", "VANDERVELDE-VOSSEN", "Decathlon", "Iboya", "TEAMSWEAR"],
    "Kine": ["kine", "Action"],
    "Pluspas": ["Pluspas", "Corporate Benefi"],
    "Haviland": ["Haviland"],
    "AG insurance": ["AG"],
    "Bloemen": ["Bloomon"],
    "Bril": ["Optiek", "D EN M NV"],
    "Ketel onderhoud": ["Vaillant"],
    "Lening": ["Woonkrediet", "ALPHA CREDIT"], 
    "Visa": ["Visa"], 
    "Geldafhaling": ["Geldopneming"], 
    "Water, Gas & Elektriciteit": ["water", "watergroep", "LUMINUS", "ELECTRABEL"],
    "Internet & Telecom": ["internet", "telenet", "proximus", "orange", "base"]
};

const HOOFD_GROEPEN = {
    "Eten en drinken": ["Supermarkt", "Frietjes", "Restaurant", "Ijsjes", "Broodjes", "Bakker", "Sushi"],
    "Huis": ["Bouwmarkt", "Meubelwinkel", "Lening", "Water, Gas & Elektriciteit", "Internet & Telecom", "Haviland", "Ketel onderhoud", "Bloemen"],
    "Verzorging": ["Apotheek", "Kapper", "Kine", "Bril"],
    "Verzekeringen": ["AG insurance"],
    "Werk": ["Automaat werk", "Pluspas"],
    "Hobby's": ["Hobby's"],
    "Lou & Noé": ["Creche", "Dreamland"],
    "Auto": ["Tanken"],
    "Shoppen & Kleding": ["Kleren", "Bol"]
};

const VASTE_CATEGORIEEN = ["AG insurance", "Lening", "Water, Gas & Elektriciteit", "Internet & Telecom", "Haviland"];

let alleData = []; 
let budgetData = []; 
let mijnMaandGrafiek = null, mijnCatGrafiek = null, mijnTrendGrafiek = null;

let huidigDatum = new Date();
let toonJaar = huidigDatum.getFullYear();
let toonWeek = getISOWeek(huidigDatum);

function switchView(viewName) {
    document.getElementById('view-dashboard').style.display = viewName === 'dashboard' ? 'block' : 'none';
    document.getElementById('view-weekbudget').style.display = viewName === 'weekbudget' ? 'block' : 'none';
    
    document.getElementById('btn-tab-dash').className = viewName === 'dashboard' ? 'tab-btn active' : 'tab-btn';
    document.getElementById('btn-tab-week').className = viewName === 'weekbudget' ? 'tab-btn active' : 'tab-btn';
    
    if(viewName === 'weekbudget') { updateWeekbudgetUI(); }
}

Papa.parse(sheetUrl, {
    download: true, header: true, dynamicTyping: true, skipEmptyLines: true,
    complete: function(results) {
        alleData = results.data;
        document.getElementById('status').innerText = `Bank verbonden (${alleData.length} transacties)`;
        document.getElementById('status').classList.add('succes');
        
        if (budgetSheetUrl !== "") {
            Papa.parse(budgetSheetUrl, {
                download: true, header: true, dynamicTyping: true, skipEmptyLines: true,
                complete: function(budgetRes) { budgetData = budgetRes.data; initialiseerJaren(); },
                error: function() { initialiseerJaren(); } 
            });
        } else {
            initialiseerJaren();
        }
    }
});

// --- HELPER FUNCTIES ---
function parseDatumToDate(datumStr) {
    if (!datumStr) return null;
    const parts = String(datumStr).split(/[-/]/);
    if (parts.length === 3) return parts[0].length === 4 ? new Date(parts[0], parts[1]-1, parts[2]) : new Date(parts[2], parts[1]-1, parts[0]);
    return null;
}

function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

function getISOYear(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    return d.getUTCFullYear();
}

function getDateOfISOWeek(w, y) {
    let simple = new Date(y, 0, 1 + (w - 1) * 7);
    let dow = simple.getDay();
    let ISOweekStart = simple;
    if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
}

function haalJaar(datumStr) {
    if (!datumStr) return "Onbekend";
    const parts = String(datumStr).split(/[-/]/);
    if (parts.length >= 3) return parts[0].length === 4 ? parts[0] : parts[2];
    return "Onbekend";
}

function haalRuweMaand(datumStr) {
    if (!datumStr) return null;
    const parts = String(datumStr).split(/[-/]/);
    if (parts.length >= 3) return parts[0].length === 4 ? parseInt(parts[1]) - 1 : parseInt(parts[1]) - 1;
    return null;
}

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

// NIEUW: De verbeterde stofzuiger! Deze haalt specifieke woorden weg, maar laat de namen intact.
function schoonNaamOp(rij) {
    let parts = [];
    if (rij[KOLOM_TEGENPARTIJ]) parts.push(String(rij[KOLOM_TEGENPARTIJ]).trim());
    if (rij[KOLOM_MEDEDELING]) parts.push(String(rij[KOLOM_MEDEDELING]).trim());
    if (rij[KOLOM_DETAILS]) parts.push(String(rij[KOLOM_DETAILS]).trim());
    let t = parts.join(" ");
    
    // Snij de lelijke bank-teksten exact weg
    t = t.replace(/BETALING MET DEBETKAART NUMMER [A-Z0-9\sX*]+/gi, ' ');
    t = t.replace(/BANCONTACT BANKREFERENTIE\s*:\s*[A-Z0-9\-]+/gi, ' ');
    t = t.replace(/VALUTADATUM\s*:\s*\d{2}\/\d{2}\/\d{4}/gi, ' ');
    t = t.replace(/Naam van de tegenpartij\s*:/gi, ' ');
    t = t.replace(/Mededeling\s*:/gi, ' ');
    t = t.replace(/Volgnummer\s*:\s*\w+/gi, ' ');
    
    // Datums en tijdstippen los in de tekst (bijv. 24/05/2026 11:50) weghalen
    t = t.replace(/\d{2}\/\d{2}\/\d{4}\s*\d{2}:\d{2}/gi, ' ');
    t = t.replace(/\b\d{2}\/\d{2}\/\d{4}\b/gi, ' ');
    
    // Spaties en vreemde leestekens fatsoeneren
    t = t.replace(/\s+/g, ' ').trim();
    t = t.replace(/^[-:/]+|[-:/]+$/g, '').trim();
    
    if (t.length < 2) return "Transactie (Geen details)";
    return t;
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

function veranderWeek(delta) {
    toonWeek += delta;
    if(toonWeek < 1) { toonWeek = 52; toonJaar--; } 
    if(toonWeek > 52) { toonWeek = 1; toonJaar++; }
    updateWeekbudgetUI();
}

function updateWeekbudgetUI() {
    let refDate = getDateOfISOWeek(toonWeek, toonJaar);
    let doelMaand = refDate.getMonth();
    let doelJaar = refDate.getFullYear();
    
    let toonMaandNaam = refDate.toLocaleString('nl-BE', { month: 'long' });
    toonMaandNaam = toonMaandNaam.charAt(0).toUpperCase() + toonMaandNaam.slice(1);
    
    document.getElementById('week-titel').innerText = `Week ${toonWeek}, ${toonJaar}`;
    document.getElementById('maandTitel').innerText = `Totaal ${toonMaandNaam}`;
    
    let totaalUitgegeven = 0;
    let totaalBudget = 0;
    let totaalMaandUitgegeven = 0;
    let gecombineerdeLijst = [];

    alleData.forEach(rij => {
        if(bepaalCategorie(rij) !== 'Supermarkt') return;
        
        let bedrag = typeof rij[KOLOM_BEDRAG] === 'string' ? parseFloat(rij[KOLOM_BEDRAG].replace(',','.')) : rij[KOLOM_BEDRAG];
        if(isNaN(bedrag) || bedrag >= 0) return; 

        let rijJaar = parseInt(haalJaar(rij[KOLOM_DATUM]));
        let rijMaand = haalRuweMaand(rij[KOLOM_DATUM]);
        if (rijJaar === doelJaar && rijMaand === doelMaand) totaalMaandUitgegeven += Math.abs(bedrag);

        const d = parseDatumToDate(rij[KOLOM_DATUM]);
        if(!d) return;

        if (getISOWeek(d) === toonWeek && getISOYear(d) === toonJaar) {
            totaalUitgegeven += Math.abs(bedrag);
            
            gecombineerdeLijst.push({ 
                datumObj: d, datumStr: rij[KOLOM_DATUM], 
                naam: schoonNaamOp(rij), // Gebruik de nieuwe stofzuiger hier!
                bedrag: Math.abs(bedrag), bron: 'bank' 
            });
        }
    });

    if (budgetData.length > 0) {
        budgetData.forEach(rij => {
            let dStr = rij['Datum'] || rij['datum'];
            let bStr = rij['Bedrag'] || rij['bedrag'];
            if (!dStr || bStr == null) return;
            
            const d = parseDatumToDate(dStr);
            if(!d) return;

            if (getISOWeek(d) === toonWeek && getISOYear(d) === toonJaar) {
                let bedrag = typeof bStr === 'string' ? parseFloat(bStr.replace(',','.')) : bStr;
                totaalBudget += Math.abs(bedrag);
                gecombineerdeLijst.push({ 
                    datumObj: d, datumStr: dStr, 
                    naam: "Gepland Menu / Handmatige Invoer", 
                    bedrag: Math.abs(bedrag), bron: 'sheet' 
                });
            }
        });
    }

    document.getElementById('weekBudgetTonen').innerText = formatBedrag(totaalBudget);
    document.getElementById('weekUitgegevenTonen').innerText = formatBedrag(totaalUitgegeven);
    document.getElementById('maandUitgegevenTonen').innerText = formatBedrag(totaalMaandUitgegeven);
    
    let verschil = totaalBudget - totaalUitgegeven;
    let verschEl = document.getElementById('weekVerschilTonen');
    verschEl.innerText = (verschil < 0 ? "- " : "+ ") + formatBedrag(verschil);
    
    if (budgetData.length === 0) {
        document.getElementById('weekVerschilKaart').style.display = 'none'; 
    } else {
        document.getElementById('weekVerschilKaart').style.display = 'block';
        verschEl.className = verschil >= 0 ? 'bedrag positief' : 'bedrag negatief';
    }

    gecombineerdeLijst.sort((a, b) => b.datumObj - a.datumObj); 
    
    let tbody = document.getElementById('weekTransactiesBody');
    if (gecombineerdeLijst.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Geen supermarkt-uitgaven of budget gevonden in deze week.</td></tr>';
    } else {
        let html = '';
        gecombineerdeLijst.forEach(item => {
            let bronBadge = item.bron === 'bank' ? `<span class="bron-badge bron-bank">Bank (Werkelijk)</span>` : `<span class="bron-badge bron-sheet">Spreadsheet (Gepland)</span>`;
            let bedragClass = item.bron === 'bank' ? 'tekst-negatief' : 'tekst-positief'; 
            
            html += `<tr>
                <td><strong>${item.datumStr}</strong></td>
                <td><div style="max-width: 450px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.naam}">${item.naam}</div></td>
                <td class="${bedragClass}"><strong>${formatBedrag(item.bedrag)}</strong></td>
                <td>${bronBadge}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    }
}

function updateDashboard() {
    const gekozenJaar = document.getElementById('jaarSelect').value;
    const filterOpOverig = document.getElementById('toonEnkelOverig').checked;
    const sorteerKeuze = document.getElementById('sorteerSelect').value;
    
    const jaardata = alleData.filter(rij => {
        const isJuisteJaar = haalJaar(rij[KOLOM_DATUM]) === gekozenJaar;
        const tegenpartij = String(rij[KOLOM_TEGENPARTIJ] || "").toLowerCase();
        const mededeling = String(rij[KOLOM_MEDEDELING] || "").toLowerCase();
        if (tegenpartij.includes("ricour-de bruyn") || mededeling.includes("ricour-de bruyn")) return false; 
        return isJuisteJaar;
    });
    
    verwerkData(jaardata, gekozenJaar);
    
    let tabelData = [...jaardata];
    if (filterOpOverig) tabelData = tabelData.filter(rij => bepaalCategorie(rij) === "Overig");

    tabelData.sort((a, b) => {
        let bedragA = a[KOLOM_BEDRAG]; let bedragB = b[KOLOM_BEDRAG];
        if (typeof bedragA === 'string') bedragA = parseFloat(bedragA.replace(',', '.'));
        if (typeof bedragB === 'string') bedragB = parseFloat(bedragB.replace(',', '.'));
        bedragA = isNaN(bedragA) ? 0 : bedragA; bedragB = isNaN(bedragB) ? 0 : bedragB;

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
    const trendData = { 'Supermarkt': {}, 'Bol': {}, 'Kleren': {} };

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

        if (!maanden[m]) {
            maanden[m] = { in: 0, uit: 0 };
            trendData['Supermarkt'][m] = 0;
            trendData['Bol'][m] = 0;
            trendData['Kleren'][m] = 0;
        }

        if (b > 0) {
            inkomsten += b;
            maanden[m].in += b;
        } else {
            uitgaven += b;
            maanden[m].uit += b;
            if (b < grootsteUitgave) grootsteUitgave = b;
            if (VASTE_CATEGORIEEN.includes(cat)) vast += Math.abs(b);
            
            if (!cats[cat]) cats[cat] = 0; cats[cat] += Math.abs(b);
            if (!groepen[hg]) groepen[hg] = 0; groepen[hg] += Math.abs(b);
            
            if (!hgBreakdown[hg]) hgBreakdown[hg] = {};
            if (!hgBreakdown[hg][cat]) hgBreakdown[hg][cat] = 0;
            hgBreakdown[hg][cat] += Math.abs(b);
            
            // Verzamel data voor de lijngrafiek
            if (cat === 'Supermarkt') trendData['Supermarkt'][m] += Math.abs(b);
            if (cat === 'Bol') trendData['Bol'][m] += Math.abs(b);
            if (cat === 'Kleren') trendData['Kleren'][m] += Math.abs(b);
        }
    });

    document.getElementById('jaarInkomsten').innerText = formatBedrag(inkomsten);
    document.getElementById('jaarUitgaven').innerText = formatBedrag(uitgaven);
    const balans = inkomsten + uitgaven;
    const balansEl = document.getElementById('jaarBalans');
    balansEl.innerText = (balans < 0 ? "- " : "") + formatBedrag(balans);
    balansEl.className = balans > 0 ? 'bedrag positief' : (balans < 0 ? 'bedrag negatief' : 'bedrag neutraal');
    document.getElementById('vastTotaal').innerText = formatBedrag(vast);
    
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
    tekenGrafieken(maanden, groepen, gesorteerdeMaanden, trendData);
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

function tekenGrafieken(mndData, grpData, gesorteerdeMaanden, trendData) {
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
    const frisseKleuren = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A733FF', '#FF3366', '#00E5FF', '#999999', '#4CAF50'];
    const gesorteerdeGroepen = Object.keys(grpData).sort((a, b) => grpData[b] - grpData[a]);
    mijnCatGrafiek = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: gesorteerdeGroepen,
            datasets: [{ data: gesorteerdeGroepen.map(hg => grpData[hg]), backgroundColor: frisseKleuren, borderWidth: 2, borderColor: '#ffffff' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });

    // NIEUW: De Lijngrafiek
    const ctxTrend = document.getElementById('trendGrafiek').getContext('2d');
    if (mijnTrendGrafiek) mijnTrendGrafiek.destroy();
    
    // Verwijder 'Onbekend' labels indien die erin zitten
    const geldigeMaanden = gesorteerdeMaanden.filter(m => m !== 'Onbekend');
    const labelsLijn = geldigeMaanden.map(m => m.split('-')[1] + '-' + m.split('-')[0]);

    mijnTrendGrafiek = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: labelsLijn,
            datasets: [
                {
                    label: 'Supermarkt',
                    data: geldigeMaanden.map(m => trendData['Supermarkt'][m]),
                    borderColor: '#059669', // Groen
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    borderWidth: 2, fill: true, tension: 0.3
                },
                {
                    label: 'Online (Bol.com)',
                    data: geldigeMaanden.map(m => trendData['Bol'][m]),
                    borderColor: '#3b82f6', // Blauw
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2, fill: true, tension: 0.3
                },
                {
                    label: 'Kleren',
                    data: geldigeMaanden.map(m => trendData['Kleren'][m]),
                    borderColor: '#ec4899', // Roze
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    borderWidth: 2, fill: true, tension: 0.3
                }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// NIEUW: Een super strakke, georganiseerde tabel onderaan in plaats van alle rommelige bankkolommen
function bouwTransactieTabel(data) {
    if(data.length === 0) {
        document.getElementById('tableHead').innerHTML = '';
        document.getElementById('tableBody').innerHTML = '<tr><td style="padding: 20px; text-align: center;">Geen transacties gevonden.</td></tr>';
        return;
    }

    // We hardcoden hier enkel de nuttige kolommen
    let headerHtml = `<tr>
        <th>Datum</th>
        <th>Omschrijving (Opgeschoond)</th>
        <th>Bedrag</th>
        <th>Hoofdgroep</th>
        <th>Categorie</th>
    </tr>`; 
    document.getElementById('tableHead').innerHTML = headerHtml;

    let bodyHtml = '';
    data.slice(0, 150).forEach(rij => {
        let datum = rij[KOLOM_DATUM] || '';
        let omschrijving = schoonNaamOp(rij);
        let bedrag = rij[KOLOM_BEDRAG];
        
        let num = typeof bedrag === 'string' ? parseFloat(bedrag.replace(',', '.')) : bedrag;
        let bedragHtml = '';
        if (!isNaN(num) && num !== null) {
            let cssClass = num > 0 ? 'tekst-positief' : 'tekst-negatief';
            bedragHtml = `<span class="${cssClass}"><strong>${formatBedrag(num)}</strong></span>`;
        }
        
        const berekendeCat = bepaalCategorie(rij);
        const berekendeHoofd = bepaalHoofdgroep(berekendeCat);
        const isOverig = berekendeCat === "Overig";
        
        bodyHtml += `<tr>
            <td>${datum}</td>
            <td><div style="max-width: 350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${omschrijving}">${omschrijving}</div></td>
            <td>${bedragHtml}</td>
            <td><span class="status-badge" style="background-color: transparent; border: 1px solid #ccc; color: #666;">${berekendeHoofd}</span></td>
            <td><span class="status-badge" style="background-color: ${isOverig ? "#ffeedd" : "#e1e8ed"}; color: ${isOverig ? "#d35400" : "#34495e"};">${berekendeCat}</span></td>
        </tr>`;
    });
    
    document.getElementById('tableBody').innerHTML = bodyHtml;
}
