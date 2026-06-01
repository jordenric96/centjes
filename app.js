// app.js - Financiële Dashboard (Multi-Sheet ondersteuning, Anti-NaN, Spaardoel)

// De 3 links naar jouw aparte tabbladen:
const bankSheetUrls = [
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTN9bFzUXNhhevW3Whon9dffKP9aNuHOAwtvUcQzo1W9hwMt97yPEu1x7u5kNhTo0Koh4FN56gLWZT/pub?gid=1291841456&single=true&output=csv",
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTN9bFzUXNhhevW3Whon9dffKP9aNuHOAwtvUcQzo1W9hwMt97yPEu1x7u5kNhTo0Koh4FN56gLWZT/pub?gid=1758541093&single=true&output=csv"
];
const supermarktSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTN9bFzUXNhhevW3Whon9dffKP9aNuHOAwtvUcQzo1W9hwMt97yPEu1x7u5kNhTo0Koh4FN56gLWZT/pub?gid=1527123423&single=true&output=csv"; 

const KOLOM_DATUM = "Uitvoeringsdatum"; 
const KOLOM_BEDRAG = "Bedrag"; 
const KOLOM_TEGENPARTIJ = "Naam van de tegenpartij";
const KOLOM_MEDEDELING = "Mededeling";
const KOLOM_DETAILS = "Details";
const KOLOM_TYPE = "Type verrichting";

const CATEGORIE_RULES = {
    "Supermarkt": ["huwaert", "Dierendo", "ESN", "FLAVOR SHOP", "AVA", "Kruidvat", "okay", "colruyt", "carrefour", "aldi", "CO&GO", "BON'AP", "ALBERT HEIJN", "delhaize", "Alvo", "FOOD FACTORY", "HELLOFRESH", "WIBRA"],
    "Creche": ["disneyland", "kinderopvang", "creche"],
    "Automaat werk": ["SELECTA 2850 BOOM", "BNP PARIBAS FORTIS 1000 BRUSSEL 29"],
    "Frietjes": ["Carnier", "Frit", "Brochettte", "friet", "MCDONALD'S", "HOGENBERG", "FOODCOMPANY", "The Foodcompany"],
    "Restaurant": ["restaurant", "brasserie", "JANE'S", "bistro", "pizzeria", "PIAZZA", "WOLF BRUXELLES", "DIMATTO", "FRAMILIE", "BUYSSE MOBIELE", "LUYCKX GIANNI"], 
    "Bouwmarkt": ["Gamma", "Brico", "FLORALUX", "TUINCENTRUM", "HORTA", "ERICA", "VANNEROM"],
    "Dreamland": ["Dreamland"],
    "Online": ["Bol", "Amazon", "Coolblue", "VANDEN BORRE", "Mediamarkt", "VEEPEE", "Cabau", "TODDIE", "TEMU"],
    "Ijsjes": ["Ijs", "Krijmerie", "Martinique", "Choconelly"],
    "Broodjes": ["PRINSKE"],
    "Meubelwinkel": ["Jysk", "Ikea", "MATRATZEN", "HEMA"],
    "Apotheek": ["Apotheek", "NEWPHARMA", "Pharma", "FARMALINE"], 
    "Bakker": ["Exotica", "Locus"],
    
    // --- Auto & Belastingen ---
    "Tanken": ["Dats", "Total"],
    "Auto (Kosten & Taks)": ["verkeersbelasting", "vlaamse belastingdienst", "autoverzekering", "autokeuring"],
    "Belastingen (Huis)": ["kadastraal", "onroerende voorheffing", "belasting"],
    
    "Sushi": ["Sushi"],
    "Kleren": ["Fashion", "Zalando", "JBC", "H&M", "Zara", "DEDOLES", "KIABI"],
    "Kapper": ["Hair", "BLONDES & BROWNIES"],
    "Hobby's": ["Foot", "PassaSportsbe", "Padel", "Ludus", "Sportigo", "KV KESTER GOOIK", "VANDERVELDE-VOSSEN", "Decathlon", "Iboya", "TEAMSWEAR"],
    "Kine": ["kine", "Action"],
    "Pluspas": ["Pluspas", "Corporate Benefi"],
    "Haviland": ["Haviland"],
    "AG insurance": ["AG"],
    "Bloemen": ["Bloomon"],
    "Bril": ["Optiek", "D EN M NV"],
    "Ketel onderhoud": ["Vaillant"],
    "Lening": ["Woonkrediet", "ALPHA CREDIT"], 
    "Visa": ["Visa"], 
    "Geldafhaling": ["Geldopneming", "Bancontact"], 
    "Water, Gas & Elektriciteit": ["water", "watergroep", "LUMINUS", "ELECTRABEL"],
    "Internet & Telecom": ["internet", "telenet", "proximus", "orange", "base"],
    "Loon": ["loon", "salaris", "wedde", "bezoldiging"],
    "Kinderbijslag": ["groeipakket", "kinderbijslag", "fons", "infino", "kidslife", "parentia", "myfamily"],
    "Terugbetaling": ["terugbetaling", "mutualiteit", "cm", "solidaris", "helAN"]
};

const HOOFD_GROEPEN = {
    "Eten en drinken": ["Supermarkt", "Frietjes", "Restaurant", "Ijsjes", "Broodjes", "Bakker", "Sushi"],
    "Huis": ["Bouwmarkt", "Meubelwinkel", "Lening", "Water, Gas & Elektriciteit", "Internet & Telecom", "Haviland", "Ketel onderhoud", "Bloemen", "Belastingen (Huis)"],
    "Verzorging": ["Apotheek", "Kapper", "Kine", "Bril"],
    "Verzekeringen": ["AG insurance"],
    "Werk": ["Automaat werk", "Pluspas"],
    "Hobby's": ["Hobby's"],
    "Lou & Noé": ["Creche", "Dreamland"],
    "Auto": ["Tanken", "Auto (Kosten & Taks)"],
    "Shoppen & Kleding": ["Kleren", "Online"],
    "Bank & Geldzaken": ["Visa", "Geldafhaling"],
    "Inkomsten": ["Loon", "Kinderbijslag", "Terugbetaling"]
};

const VASTE_CATEGORIEEN = ["AG insurance", "Lening", "Water, Gas & Elektriciteit", "Internet & Telecom", "Haviland", "Belastingen (Huis)", "Auto (Kosten & Taks)"];

let alleData = []; 
let budgetData = []; 
let mijnMaandGrafiek = null, mijnCatGrafiek = null, mijnBalansGrafiek = null;
let chartSup = null, chartOnl = null, chartFri = null;

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

// Meerdere tabbladen ophalen via async functies
function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        if (!url || url.includes("HIER_PLAKKEN")) { resolve([]); return; }
        Papa.parse(url, {
            download: true, header: true, dynamicTyping: true, skipEmptyLines: true,
            complete: function(results) { resolve(results.data); },
            error: function(err) { console.warn("Kon CSV niet laden:", url); resolve([]); }
        });
    });
}

async function laadAlleData() {
    try {
        let statusEl = document.getElementById('status');
        statusEl.innerText = "Gegevens ophalen...";
        statusEl.classList.remove('succes');

        // Haal beide bank tabbladen tegelijk op
        let bankPromises = bankSheetUrls.map(url => fetchCSV(url));
        let bankResults = await Promise.all(bankPromises);
        
        alleData = [];
        bankResults.forEach(data => alleData = alleData.concat(data));

        // Haal het supermarkt tabblad op
        budgetData = await fetchCSV(supermarktSheetUrl);

        if (alleData.length > 0) {
            statusEl.innerText = `Bank verbonden (${alleData.length} transacties)`;
            statusEl.classList.add('succes');
        } else {
            statusEl.innerText = `Geen data gevonden (check je links)`;
            statusEl.style.backgroundColor = "#ef4444";
        }
        
        initialiseerDropdowns();

    } catch (error) {
        document.getElementById('status').innerText = "Fout bij laden!";
    }
}

// Start het ophalen
laadAlleData();

function haalWaarde(rij, kolomMatch) {
    if (rij[kolomMatch] !== undefined) return rij[kolomMatch];
    for (let k in rij) {
        if (k.toLowerCase().includes(kolomMatch.toLowerCase())) return rij[k];
    }
    return undefined;
}

function parseBedragNumber(val) {
    if (val === null || val === undefined || val === '') return NaN;
    if (typeof val === 'number') return val;
    let str = String(val).trim().replace(/[€\s]/g, '');
    if (str.includes('.') && str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
        str = str.replace(',', '.');
    }
    return parseFloat(str);
}

function parseDatumToDate(datumStr) {
    if (!datumStr) return null;
    const parts = String(datumStr).split(/[-/]/);
    if (parts.length === 3) {
        let y = parts[0].length === 4 ? parts[0] : parts[2];
        let d = parts[0].length === 4 ? parts[2] : parts[0];
        let m = parts[1];
        let date = new Date(y, m-1, d);
        if (!isNaN(date.getTime())) return date;
    }
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
    if (parts.length >= 3) {
        let j = parts[0].length === 4 ? parts[0] : parts[2];
        if(!isNaN(parseInt(j))) return j;
    }
    return "Onbekend";
}

function haalRuweMaand(datumStr) {
    if (!datumStr) return null;
    const parts = String(datumStr).split(/[-/]/);
    if (parts.length >= 3) {
        let m = parseInt(parts[1]) - 1;
        if(!isNaN(m)) return m;
    }
    return null;
}

function bepaalCategorie(rij) {
    if (rij["Eigen Categorie"] && String(rij["Eigen Categorie"]).trim() !== "") return String(rij["Eigen Categorie"]).trim();
    
    let tp = haalWaarde(rij, KOLOM_TEGENPARTIJ) || '';
    let md = haalWaarde(rij, KOLOM_MEDEDELING) || '';
    let dt = haalWaarde(rij, KOLOM_DETAILS) || '';
    let ty = haalWaarde(rij, KOLOM_TYPE) || '';
    
    const tekst = `${tp} ${md} ${dt} ${ty}`.toLowerCase();
    for (const [cat, words] of Object.entries(CATEGORIE_RULES)) {
        for (const w of words) if (tekst.includes(w.toLowerCase())) return cat;
    }
    return "Overig";
}

function bepaalHoofdgroep(sub) {
    for (const [hg, subs] of Object.entries(HOOFD_GROEPEN)) if (subs.includes(sub)) return hg;
    return "Overig";
}

function formatBedrag(g) { 
    if (isNaN(g) || g === null) return "€ 0.00";
    return "€ " + Math.abs(g).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); 
}

function schoonNaamOp(rij) {
    let tp = haalWaarde(rij, KOLOM_TEGENPARTIJ) || '';
    let md = haalWaarde(rij, KOLOM_MEDEDELING) || '';
    let dt = haalWaarde(rij, KOLOM_DETAILS) || '';
    
    let parts = [];
    if (tp) parts.push(String(tp).trim());
    if (md) parts.push(String(md).trim());
    if (dt) parts.push(String(dt).trim());
    let t = parts.join(" ");

    let tl = t.toLowerCase();
    if (tl.includes("okay")) return "Okay";
    if (tl.includes("kruidvat")) return "Kruidvat";
    if (tl.includes("schelck huwaert")) return "Delhaize";
    if (tl.includes("albert heijn")) return "Albert Heijn";
    if (tl.includes("freshville")) return "Alvo";
    
    t = t.replace(/BETALING MET DEBETKAART NUMMER\s+[\d\sX*]{15,30}/gi, ''); 
    t = t.replace(/BANCONTACT BANKREFERENTIE\s*:\s*[A-Z0-9\-]+/gi, '');
    t = t.replace(/VALUTADATUM\s*:\s*\d{2}\/\d{2}\/\d{4}/gi, '');
    t = t.replace(/Naam van de tegenpartij\s*:/gi, '');
    t = t.replace(/Mededeling\s*:/gi, '');
    t = t.replace(/Volgnummer\s*:\s*\w+/gi, '');
    t = t.replace(/\bBANCONTACT\b/gi, '');
    t = t.replace(/\/?\d{2}\/\d{4}\s*\d{2}:\d{2}/gi, '');
    t = t.replace(/\/?\d{2}\/\d{4}/gi, '');
    t = t.replace(/\d{2}\/\d{2}\/\d{4}/gi, '');
    t = t.replace(/\s+/g, ' ').trim();
    t = t.replace(/^[-:/,]+|[-:/,]+$/g, '').trim();
    if (t.length < 2) return "Transactie (Geen details)";
    return t;
}

function initialiseerDropdowns() {
    const jarenSet = new Set();
    alleData.forEach(rij => { 
        const jaar = haalJaar(haalWaarde(rij, KOLOM_DATUM)); 
        if (jaar !== "Onbekend") jarenSet.add(jaar); 
    });
    
    // Zorg dat in ieder geval het huidige jaar in de dropdown staat, ook als sheet leeg is
    jarenSet.add(String(new Date().getFullYear()));
    
    const jaarSelect = document.getElementById('jaarSelect');
    jaarSelect.innerHTML = ''; 
    Array.from(jarenSet).sort().reverse().forEach(j => { jaarSelect.innerHTML += `<option value="${j}">${j}</option>`; });
    
    const mndSelect = document.getElementById('filterMaand');
    const maandenNaam = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
    mndSelect.innerHTML = '<option value="alle">Alle Maanden</option>';
    maandenNaam.forEach((m, i) => { mndSelect.innerHTML += `<option value="${i}">${m}</option>`; });
    
    const hgSelect = document.getElementById('filterHoofdgroep');
    hgSelect.innerHTML = '<option value="alle">Alle Hoofdgroepen</option>';
    Object.keys(HOOFD_GROEPEN).sort().forEach(hg => { hgSelect.innerHTML += `<option value="${hg}">${hg}</option>`; });
    hgSelect.innerHTML += '<option value="Overig">Overig</option>';
    
    const catSelect = document.getElementById('filterCategorie');
    catSelect.innerHTML = '<option value="alle">Alle Categorieën</option>';
    Object.keys(CATEGORIE_RULES).sort().forEach(cat => { catSelect.innerHTML += `<option value="${cat}">${cat}</option>`; });
    catSelect.innerHTML += '<option value="Overig">Overig</option>';
    
    ['jaarSelect', 'filterMaand', 'filterHoofdgroep', 'filterCategorie', 'sorteerSelect', 'toonEnkelOverig'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateDashboard);
    });
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
    let endOfWeek = new Date(refDate); endOfWeek.setDate(refDate.getDate() + 6);
    let formatOpt = { day: 'numeric', month: 'short' };
    let datumBereik = `${refDate.toLocaleDateString('nl-BE', formatOpt)} - ${endOfWeek.toLocaleDateString('nl-BE', formatOpt)}`;
    let toonMaandNaam = refDate.toLocaleString('nl-BE', { month: 'long' });
    toonMaandNaam = toonMaandNaam.charAt(0).toUpperCase() + toonMaandNaam.slice(1);
    
    document.getElementById('week-titel').innerHTML = `Week ${toonWeek}, ${toonJaar}<br><span style="font-size:0.85rem; color:#64748b; font-weight:600;">${datumBereik}</span>`;
    document.getElementById('maandTitel').innerText = `Totaal ${toonMaandNaam}`;
    
    let totaalUitgegeven = 0, totaalMaandUitgegeven = 0, gecombineerdeLijst = [];
    
    // 1. Bank Data voor supermarkt inladen
    alleData.forEach(rij => {
        if(bepaalCategorie(rij) !== 'Supermarkt') return;
        
        let bedrag = parseBedragNumber(haalWaarde(rij, KOLOM_BEDRAG));
        if(isNaN(bedrag) || bedrag >= 0) return; 
        
        let absoluteBedrag = Math.abs(bedrag);
        let rijJaar = parseInt(haalJaar(haalWaarde(rij, KOLOM_DATUM)));
        let rijMaand = haalRuweMaand(haalWaarde(rij, KOLOM_DATUM));
        
        if (rijJaar === doelJaar && rijMaand === doelMaand) totaalMaandUitgegeven += absoluteBedrag;
        
        const d = parseDatumToDate(haalWaarde(rij, KOLOM_DATUM));
        if(d && getISOWeek(d) === toonWeek && getISOYear(d) === toonJaar) {
            totaalUitgegeven += absoluteBedrag;
            gecombineerdeLijst.push({ datumObj: d, datumStr: haalWaarde(rij, KOLOM_DATUM), naam: schoonNaamOp(rij), bedrag: absoluteBedrag });
        }
    });

    // 2. Handmatige bonnen inladen uit je nieuwe "supermarkt" tabblad
    if (budgetData.length > 0) {
        budgetData.forEach(rij => {
            let dStr = haalWaarde(rij, 'datum');
            let bStr = haalWaarde(rij, 'bedrag');
            let winkel = haalWaarde(rij, 'winkel') || 'Handmatige bon';
            
            if (!dStr || bStr == null) return;
            
            let bedrag = parseBedragNumber(bStr);
            if (isNaN(bedrag)) return;
            
            let absoluteBedrag = Math.abs(bedrag);
            let d = parseDatumToDate(dStr);
            
            // Controleer of de bon in deze maand viel
            if (d && d.getFullYear() === doelJaar && d.getMonth() === doelMaand) {
                totaalMaandUitgegeven += absoluteBedrag;
            }

            if(d && getISOWeek(d) === toonWeek && getISOYear(d) === toonJaar) {
                totaalUitgegeven += absoluteBedrag;
                gecombineerdeLijst.push({ 
                    datumObj: d, 
                    datumStr: dStr, 
                    naam: "✍️ " + winkel, 
                    bedrag: absoluteBedrag 
                });
            }
        });
    }
    
    let uitgavenKleur = totaalUitgegeven <= 180 ? 'bedrag positief' : 'bedrag negatief';
    let tonenEl = document.getElementById('weekUitgegevenTonen');
    tonenEl.innerText = formatBedrag(totaalUitgegeven);
    tonenEl.className = uitgavenKleur;

    document.getElementById('maandUitgegevenTonen').innerText = formatBedrag(totaalMaandUitgegeven);
    gecombineerdeLijst.sort((a, b) => b.datumObj - a.datumObj); 
    
    let tbody = document.getElementById('weekTransactiesBody');
    tbody.innerHTML = gecombineerdeLijst.length === 0 ? '<tr><td colspan="3" style="text-align:center; padding: 20px;">Geen transacties.</td></tr>' : gecombineerdeLijst.map(item => `<tr><td><strong>${item.datumStr}</strong></td><td><div class="omschrijving-cel" title="${item.naam}">${item.naam}</div></td><td class="tekst-negatief"><strong>${formatBedrag(item.bedrag)}</strong></td></tr>`).join('');
}

function updateDashboard() {
    const gekozenJaar = document.getElementById('jaarSelect').value;
    const jaardata = alleData.filter(rij => haalJaar(haalWaarde(rij, KOLOM_DATUM)) === gekozenJaar);
    verwerkData(jaardata, gekozenJaar);
    bouwTrendGrafieken(); 
    
    let tabelData = [...jaardata];
    const fMaand = document.getElementById('filterMaand').value;
    const fHoofd = document.getElementById('filterHoofdgroep').value;
    const fCat = document.getElementById('filterCategorie').value;
    
    if (document.getElementById('toonEnkelOverig').checked) tabelData = tabelData.filter(rij => bepaalCategorie(rij) === "Overig");
    else {
        if (fMaand !== "alle") tabelData = tabelData.filter(rij => haalRuweMaand(haalWaarde(rij, KOLOM_DATUM)) === parseInt(fMaand));
        if (fHoofd !== "alle") tabelData = tabelData.filter(rij => bepaalHoofdgroep(bepaalCategorie(rij)) === fHoofd);
        if (fCat !== "alle") tabelData = tabelData.filter(rij => bepaalCategorie(rij) === fCat);
    }
    
    tabelData.sort((a, b) => {
        let bedragA = parseBedragNumber(haalWaarde(a, KOLOM_BEDRAG)); 
        let bedragB = parseBedragNumber(haalWaarde(b, KOLOM_BEDRAG));
        bedragA = isNaN(bedragA) ? 0 : bedragA; bedragB = isNaN(bedragB) ? 0 : bedragB;
        if (document.getElementById('sorteerSelect').value === "uitgaven") return bedragA - bedragB;
        return parseDatumToDate(haalWaarde(b, KOLOM_DATUM)) - parseDatumToDate(haalWaarde(a, KOLOM_DATUM));
    });
    bouwTransactieTabel(tabelData);
}

function verwerkData(data, huidigJaar) {
    let inkomsten = 0, uitgaven = 0, vast = 0;
    let spaarBalansVanafJuni = 0; 
    let actueelJaar = parseInt(huidigJaar);
    let startDatumSpaardoel = new Date(actueelJaar, 5, 1); // 1 JUNI als reset-punt

    const maanden = {}, cats = {}, groepen = {}, hgBreakdown = {};
    
    data.forEach(r => {
        let b = parseBedragNumber(haalWaarde(r, KOLOM_BEDRAG));
        if (isNaN(b)) return;

        const d = parseDatumToDate(haalWaarde(r, KOLOM_DATUM));
        if (d && d.getTime() >= startDatumSpaardoel.getTime()) {
            spaarBalansVanafJuni += b;
        }

        const cat = bepaalCategorie(r), hg = bepaalHoofdgroep(cat), datumVal = haalWaarde(r, KOLOM_DATUM);
        let jaar = haalJaar(datumVal);
        let maandNum = haalRuweMaand(datumVal);
        let m = (jaar !== "Onbekend" && maandNum !== null) ? `${jaar}-${String(maandNum + 1).padStart(2, '0')}` : "Onbekend";
        
        if (!maanden[m]) maanden[m] = { in: 0, uit: 0 };
        
        if (b > 0) { inkomsten += b; maanden[m].in += b; } 
        else {
            uitgaven += b; maanden[m].uit += b;
            if (VASTE_CATEGORIEEN.includes(cat)) vast += Math.abs(b);
            if (!cats[cat]) cats[cat] = 0; cats[cat] += Math.abs(b);
            if (!groepen[hg]) groepen[hg] = 0; groepen[hg] += Math.abs(b);
            if (!hgBreakdown[hg]) hgBreakdown[hg] = {};
            if (!hgBreakdown[hg][cat]) hgBreakdown[hg][cat] = 0;
            hgBreakdown[hg][cat] += Math.abs(b);
        }
    });
    
    document.getElementById('jaarInkomsten').innerText = formatBedrag(inkomsten);
    document.getElementById('jaarUitgaven').innerText = formatBedrag(uitgaven);
    const balans = inkomsten + uitgaven;
    document.getElementById('jaarBalans').innerText = (balans < 0 ? "- " : "") + formatBedrag(balans);
    document.getElementById('vastTotaal').innerText = formatBedrag(vast);
    
    const spaarDoel = 2000;
    let percentage = (spaarBalansVanafJuni / spaarDoel) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    
    const bar = document.getElementById('spaardoelBar');
    const tekst = document.getElementById('spaardoelTekst');
    if (bar && tekst) {
        bar.style.width = percentage + '%';
        tekst.innerText = formatBedrag(spaarBalansVanafJuni);
        if (spaarBalansVanafJuni >= spaarDoel) { bar.style.backgroundColor = '#059669'; } 
        else { bar.style.backgroundColor = '#10b981'; }
    }
    
    const gesorteerdeMaanden = Object.keys(maanden).sort();
    
    document.getElementById('maandBody').innerHTML = [...gesorteerdeMaanden].reverse().map(mnd => {
        if(mnd === "Onbekend") return '';
        const md = maanden[mnd], mBalans = md.in + md.uit;
        let tmpD = mnd.split('-');
        let mNaam = new Date(tmpD[0], parseInt(tmpD[1])-1, 1).toLocaleString('nl-BE', { month: 'short' });
        return `<tr><td><strong>${mNaam.charAt(0).toUpperCase() + mNaam.slice(1)} ${tmpD[0]}</strong></td><td class="tekst-positief">${formatBedrag(md.in)}</td><td class="tekst-negatief">${formatBedrag(md.uit)}</td><td class="${mBalans >= 0 ? "tekst-positief" : "tekst-negatief"}"><strong>${formatBedrag(mBalans)}</strong></td></tr>`;
    }).join('');
    
    bouwDrillDownTabel(hgBreakdown, groepen);
    tekenBasisGrafieken(maanden, groepen, gesorteerdeMaanden);
}

function bouwDrillDownTabel(breakdown, totalen) {
    const container = document.getElementById('hoofdgroepBody');
    if(!container) return;
    container.innerHTML = '';
    Object.keys(totalen).sort((a,b) => totalen[b] - totalen[a]).forEach(hg => {
        const hgRow = document.createElement('tr');
        hgRow.className = 'hg-row'; hgRow.style.cursor = 'pointer'; hgRow.style.backgroundColor = '#f8fafc';
        hgRow.innerHTML = `<td><span class="pijl" style="display:inline-block; transition: transform 0.2s; margin-right:8px; font-size:0.8rem;">▶</span> <strong>${hg}</strong></td><td style="text-align: right;"><strong>${formatBedrag(totalen[hg])}</strong></td>`;
        container.appendChild(hgRow);
        const subRows = [];
        Object.keys(breakdown[hg]).sort((a,b) => breakdown[hg][b] - breakdown[hg][a]).forEach(sub => {
            const subRow = document.createElement('tr'); subRow.className = 'sub-row'; subRow.style.display = 'none'; subRow.style.backgroundColor = '#ffffff';
            subRow.innerHTML = `<td style="padding-left: 30px; color: #64748b; border-left: 3px solid #e2e8f0;">${sub}</td><td style="text-align: right; color: #64748b;">${formatBedrag(breakdown[hg][sub])}</td>`;
            container.appendChild(subRow); subRows.push(subRow);
        });
        hgRow.onclick = () => {
            const isExpanded = hgRow.classList.contains('expanded');
            document.querySelectorAll('.hg-row').forEach(r => { r.classList.remove('expanded'); const p = r.querySelector('.pijl'); if(p) p.style.transform = 'rotate(0deg)'; });
            document.querySelectorAll('.sub-row').forEach(r => r.style.display = 'none');
            if (!isExpanded) { hgRow.classList.add('expanded'); const p = hgRow.querySelector('.pijl'); if(p) p.style.transform = 'rotate(90deg)'; subRows.forEach(r => r.style.display = 'table-row'); }
        };
    });
}

function tekenBasisGrafieken(mndData, grpData, gesorteerdeMaanden) {
    if (mijnMaandGrafiek) mijnMaandGrafiek.destroy();
    const maandLabels = gesorteerdeMaanden.map(m => {
        if(m === "Onbekend") return m;
        let tmpD = m.split('-'); return new Date(tmpD[0], parseInt(tmpD[1])-1, 1).toLocaleString('nl-BE', { month: 'short' }).replace(/^\w/, c => c.toUpperCase());
    });
    mijnMaandGrafiek = new Chart(document.getElementById('maandGrafiek').getContext('2d'), {
        type: 'line',
        data: { labels: maandLabels, datasets: [
            { label: 'Inkomsten', data: gesorteerdeMaanden.map(m => mndData[m].in), borderColor: '#00E676', backgroundColor: '#00E676', borderWidth: 3, tension: 0.4 }, 
            { label: 'Uitgaven', data: gesorteerdeMaanden.map(m => Math.abs(mndData[m].uit)), borderColor: '#FF3D00', backgroundColor: '#FF3D00', borderWidth: 3, tension: 0.4 } 
        ]},
        options: { responsive: true, maintainAspectRatio: false, plugins: { tooltip: { mode: 'index', intersect: false } }, interaction: { mode: 'nearest', axis: 'x', intersect: false } }
    });

    if (mijnBalansGrafiek) mijnBalansGrafiek.destroy();
    let cumulatief = 0;
    const maandNetto = gesorteerdeMaanden.map(m => mndData[m].in + mndData[m].uit); 
    const cumulatiefData = maandNetto.map(netto => { cumulatief += netto; return cumulatief; });
    const barColors = maandNetto.map(val => val >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)');
    
    mijnBalansGrafiek = new Chart(document.getElementById('balansGrafiek').getContext('2d'), {
        type: 'bar',
        data: {
            labels: maandLabels,
            datasets: [
                { type: 'line', label: 'Spaar Evolutie', data: cumulatiefData, borderColor: '#1e3a8a', backgroundColor: 'rgba(30, 58, 138, 0.1)', borderWidth: 3, fill: true, tension: 0.3 },
                { type: 'bar', label: 'Maand Resultaat', data: maandNetto, backgroundColor: barColors, borderRadius: 4 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false } }
    });

    if (mijnCatGrafiek) mijnCatGrafiek.destroy();
    const frisseKleuren = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A733FF', '#FF3366', '#00E5FF', '#999999', '#4CAF50'];
    const gesorteerdeGroepen = Object.keys(grpData).sort((a, b) => grpData[b] - grpData[a]);
    mijnCatGrafiek = new Chart(document.getElementById('categorieGrafiek').getContext('2d'), {
        type: 'doughnut', data: { labels: gesorteerdeGroepen, datasets: [{ data: gesorteerdeGroepen.map(hg => grpData[hg]), backgroundColor: frisseKleuren, borderWidth: 2, borderColor: '#ffffff' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
}

function bouwTrendGrafieken() {
    let huidigeMaandIndex = new Date().getMonth(); 
    const maandLabels = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'].slice(0, huidigeMaandIndex + 1);
    const trendData = { 'Supermarkt': {}, 'Online': {}, 'Frietjes': {} };
    const jarenSet = new Set();
    const gekozenJaar = document.getElementById('jaarSelect').value;

    alleData.forEach(rij => {
        let b = parseBedragNumber(haalWaarde(rij, KOLOM_BEDRAG));
        if (isNaN(b) || b >= 0) return; 
        const cat = bepaalCategorie(rij);
        if (['Supermarkt', 'Online', 'Frietjes'].includes(cat)) {
            let jaar = haalJaar(haalWaarde(rij, KOLOM_DATUM)), maand = haalRuweMaand(haalWaarde(rij, KOLOM_DATUM));
            if (jaar !== "Onbekend" && maand !== null) { jarenSet.add(jaar); if (!trendData[cat][jaar]) trendData[cat][jaar] = Array(12).fill(0); trendData[cat][jaar][maand] += Math.abs(b); }
        }
    });
    
    const jarenArray = Array.from(jarenSet).sort().reverse(); 
    const baseColors = { 'Supermarkt': [5, 150, 105], 'Online': [59, 130, 246], 'Frietjes': [234, 179, 8] };
    const buildDatasets = (cat) => jarenArray.map((jaar, index) => ({ label: jaar, data: (trendData[cat][jaar] || Array(12).fill(0)).slice(0, huidigeMaandIndex + 1), borderColor: `rgba(${baseColors[cat].join(',')}, ${index === 0 ? 1 : 0.5})`, borderWidth: index === 0 ? 3 : 2, fill: false, tension: 0.4 }));
    const baseOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } };
    
    ['Sup', 'Fri', 'Onl'].forEach((s, i) => {
        const cat = ['Supermarkt', 'Frietjes', 'Online'][i];
        
        let dataGeknipt = (trendData[cat][gekozenJaar] || Array(12).fill(0)).slice(0, huidigeMaandIndex + 1);
        let somYTD = dataGeknipt.reduce((a, b) => a + b, 0);
        if(document.getElementById('ytd-' + cat)) {
            document.getElementById('ytd-' + cat).innerText = formatBedrag(somYTD);
        }

        if (window['chart'+s]) window['chart'+s].destroy();
        window['chart'+s] = new Chart(document.getElementById('trend'+cat).getContext('2d'), { type: 'line', data: { labels: maandLabels, datasets: buildDatasets(cat) }, options: baseOptions });
    });
}

function bouwTransactieTabel(data) {
    if(data.length === 0) { document.getElementById('tableHead').innerHTML = ''; document.getElementById('tableBody').innerHTML = '<tr><td style="padding: 20px; text-align: center;">Geen transacties.</td></tr>'; return; }
    document.getElementById('tableHead').innerHTML = `<tr><th>Datum</th><th>Omschrijving</th><th>Bedrag</th><th>Groep</th><th>Cat</th></tr>`;
    document.getElementById('tableBody').innerHTML = data.slice(0, 150).map(rij => {
        let b = parseBedragNumber(haalWaarde(rij, KOLOM_BEDRAG));
        return `<tr><td>${haalWaarde(rij, KOLOM_DATUM)}</td><td><div class="omschrijving-cel" title="${schoonNaamOp(rij)}">${schoonNaamOp(rij)}</div></td><td><span class="${b>0?'tekst-positief':'tekst-negatief'}"><strong>${formatBedrag(b)}</strong></span></td><td>${bepaalHoofdgroep(bepaalCategorie(rij))}</td><td>${bepaalCategorie(rij)}</td></tr>`
    }).join('');
}
