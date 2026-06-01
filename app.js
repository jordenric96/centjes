// app.js - Financieel Dashboard - Volledig en Compleet met Supermarkt Bezoek-Teller

const bankSheetUrls = [
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTN9bFzUXNhhevW3Whon9dffKP9aNuHOAwtvUcQzo1W9hwMt97yPEu1x7u5kNhTo0Koh4FN56gLWZT/pub?gid=1291841456&single=true&output=csv",
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTN9bFzUXNhhevW3Whon9dffKP9aNuHOAwtvUcQzo1W9hwMt97yPEu1x7u5kNhTo0Koh4FN56gLWZT/pub?gid=1758541093&single=true&output=csv"
];

const supermarktSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTN9bFzUXNhhevW3Whon9dffKP9aNuHOAwtvUcQzo1W9hwMt97yPEu1x7u5kNhTo0Koh4FN56gLWZT/pub?gid=1934138929&single=true&output=csv"; 

const KOLOM_DATUM = "Uitvoeringsdatum"; 
const KOLOM_BEDRAG = "Bedrag"; 
const KOLOM_TEGENPARTIJ = "Naam van de tegenpartij";
const KOLOM_MEDEDELING = "Mededeling";
const KOLOM_DETAILS = "Details";
const KOLOM_TYPE = "Type verrichting";

const CATEGORIE_RULES = {
    "Supermarkt": ["huwaert", "schelck", "Dierendo", "ESN", "FLAVOR SHOP", "AVA", "Kruidvat", "okay", "colruyt", "carrefour", "aldi", "CO&GO", "BON'AP", "ALBERT HEIJN", "delhaize", "Alvo", "FOOD FACTORY", "HELLOFRESH", "WIBRA"],
    "Creche": ["creche"], 
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
    "Terugbetaling": ["terugbetaling", "mutualiteit", "cm", "solidaris", "helAN"],
    "Sparen & Intern": ["ricour-de bruyn", "ricour noe", "spaarrekening"],
    "Disneyland Kinderopvang": ["disneyland", "kinderopvang"]
};

const HOOFD_GROEPEN = {
    "Eten en drinken": ["Supermarkt", "Frietjes", "Restaurant", "Ijsjes", "Broodjes", "Bakker", "Sushi"],
    "Huis": ["Bouwmarkt", "Meubelwinkel", "Lening", "Water, Gas & Elektriciteit", "Internet & Telecom", "Haviland", "Ketel onderhoud", "Bloemen", "Belastingen (Huis)"],
    "Verzorging": ["Apotheek", "Kapper", "Kine", "Bril"],
    "Verzekeringen": ["AG insurance"],
    "Werk": ["Automaat werk", "Pluspas"],
    "Hobby's": ["Hobby's"],
    "Lou & Noé": ["Creche", "Dreamland", "Disneyland Kinderopvang"],
    "Auto": ["Tanken", "Auto (Kosten & Taks)"],
    "Shoppen & Kleding": ["Kleren", "Online"],
    "Bank & Geldzaken": ["Visa", "Geldafhaling", "Sparen & Intern"], 
    "Inkomsten": ["Loon", "Kinderbijslag", "Terugbetaling"]
};

const VASTE_CATEGORIEEN = ["AG insurance", "Lening", "Water, Gas & Elektriciteit", "Internet & Telecom", "Haviland", "Belastingen (Huis)", "Auto (Kosten & Taks)"];

let alleData = []; 
let budgetData = []; 
let mijnMaandGrafiek = null, mijnCatGrafiek = null, mijnBalansGrafiek = null, mijnYoYGrafiek = null, mijnSupPercGrafiek = null;

let huidigDatum = new Date();
let toonJaar = huidigDatum.getFullYear();
let toonWeek = getISOWeek(huidigDatum);

function switchView(viewName) {
    document.getElementById('view-dashboard').style.display = viewName === 'dashboard' ? 'block' : 'none';
    document.getElementById('view-weekbudget').style.display = viewName === 'weekbudget' ? 'block' : 'none';
    document.getElementById('view-supermarkt').style.display = viewName === 'supermarkt' ? 'block' : 'none';
    
    document.getElementById('btn-tab-dash').className = viewName === 'dashboard' ? 'tab-btn active' : 'tab-btn';
    document.getElementById('btn-tab-week').className = viewName === 'weekbudget' ? 'tab-btn active' : 'tab-btn';
    document.getElementById('btn-tab-sup').className = viewName === 'supermarkt' ? 'tab-btn active' : 'tab-btn';
    
    if(viewName === 'weekbudget') { updateWeekbudgetUI(); }
    if(viewName === 'supermarkt') { updateSupermarktDash(); }
}

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
    let statusEl = document.getElementById('status');
    statusEl.innerText = "Gegevens ophalen...";
    statusEl.classList.remove('succes');

    let bankPromises = bankSheetUrls.map(url => fetchCSV(url));
    let bankResults = await Promise.all(bankPromises);
    
    alleData = [];
    bankResults.forEach(data => {
        alleData = alleData.concat(data);
    });

    budgetData = await fetchCSV(supermarktSheetUrl);

    if (alleData.length > 0) {
        statusEl.innerText = `Bank verbonden (${alleData.length} transacties)`;
        statusEl.classList.add('succes');
    } else {
        statusEl.innerText = `Geen data gevonden (check je links)`;
        statusEl.style.backgroundColor = "#ef4444";
    }
    
    initialiseerDropdowns();
}

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
        let part0 = parts[0].split(' ')[0]; 
        let y = part0.length === 4 ? part0 : parts[2].split(' ')[0];
        let d = part0.length === 4 ? parts[2].split(' ')[0] : part0;
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
        let part0 = parts[0].split(' ')[0];
        let j = part0.length === 4 ? part0 : parts[2].split(' ')[0];
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
        for (const w of words) {
            if (tekst.includes(w.toLowerCase())) return cat;
        }
    }
    return "Overig";
}

function bepaalHoofdgroep(sub) {
    for (const [hg, subs] of Object.entries(HOOFD_GROEPEN)) {
        if (subs.includes(sub)) return hg;
    }
    return "Overig";
}

function formatBedrag(g) { 
    if (isNaN(g) || g === null) return "€ 0,00";
    return "€ " + Math.abs(g).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); 
}

function schoonNaamOp(naamInput, rij = null) {
    let t = "";
    if (rij !== null) {
        let tp = haalWaarde(rij, KOLOM_TEGENPARTIJ) || '';
        let md = haalWaarde(rij, KOLOM_MEDEDELING) || '';
        let dt = haalWaarde(rij, KOLOM_DETAILS) || '';
        let parts = [];
        if (tp) parts.push(String(tp).trim());
        if (md) parts.push(String(md).trim());
        if (dt) parts.push(String(dt).trim());
        t = parts.join(" ");
    } else if (typeof naamInput === 'string') {
        t = naamInput.trim();
    }

    let tl = t.toLowerCase();
    
    if (tl.includes("ricour-de bruyn") || tl.includes("ricour noe")) return "Sparen (Intern)";
    if (tl.includes("disneyland") || tl.includes("kinderopvang")) return "Disneyland Kinderopvang";
    if (tl.includes("schelck") || tl.includes("huwaert") || tl.includes("delhaize")) return "Delhaize";
    if (tl.includes("okay")) return "Okay";
    if (tl.includes("kruidvat")) return "Kruidvat";
    if (tl.includes("albert heijn")) return "Albert Heijn";
    if (tl.includes("freshville") || tl.includes("alvo")) return "Alvo";
    if (tl.includes("bon'ap") || tl.includes("bonap")) return "Bon'Ap";
    if (tl.includes("hellofresh")) return "HelloFresh";
    if (tl.includes("aldi")) return "Aldi";
    if (tl.includes("wibra")) return "Wibra";
    if (tl.includes("ava ")) return "AVA";
    if (tl.includes("dierendo")) return "Atelier Dierendo";
    if (tl.includes("esn.com") || tl.includes("esn ")) return "ESN";
    if (tl.includes("colruyt")) return "Colruyt";
    if (tl.includes("carrefour")) return "Carrefour";
    if (tl.includes("mcdonald")) return "McDonald's";
    
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
    return t.charAt(0).toUpperCase() + t.slice(1);
}

function initialiseerDropdowns() {
    const jarenSet = new Set();
    alleData.forEach(rij => { 
        const jaar = haalJaar(haalWaarde(rij, KOLOM_DATUM)); 
        if (jaar !== "Onbekend") jarenSet.add(jaar); 
    });
    jarenSet.add(String(new Date().getFullYear()));
    
    const jaarSelect = document.getElementById('jaarSelect');
    jaarSelect.innerHTML = ''; 
    Array.from(jarenSet).sort().reverse().forEach(j => { 
        jaarSelect.innerHTML += `<option value="${j}">${j}</option>`; 
    });
    
    const maandenNaam = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
    
    const mndSelect = document.getElementById('filterMaand');
    mndSelect.innerHTML = '<option value="alle">Alle Maanden</option>';
    maandenNaam.forEach((m, i) => { 
        mndSelect.innerHTML += `<option value="${i}">${m}</option>`; 
    });
    
    const supMndSelect = document.getElementById('supFilterMaand');
    supMndSelect.innerHTML = '<option value="alle">Alle Maanden</option>';
    maandenNaam.forEach((m, i) => { 
        supMndSelect.innerHTML += `<option value="${i}">${m}</option>`; 
    });

    const hgSelect = document.getElementById('filterHoofdgroep');
    hgSelect.innerHTML = '<option value="alle">Alle Hoofdgroepen</option>';
    Object.keys(HOOFD_GROEPEN).sort().forEach(hg => { 
        hgSelect.innerHTML += `<option value="${hg}">${hg}</option>`; 
    });
    hgSelect.innerHTML += '<option value="Overig">Overig</option>';
    
    const catSelect = document.getElementById('filterCategorie');
    catSelect.innerHTML = '<option value="alle">Alle Categorieën</option>';
    Object.keys(CATEGORIE_RULES).sort().forEach(cat => { 
        catSelect.innerHTML += `<option value="${cat}">${cat}</option>`; 
    });
    catSelect.innerHTML += '<option value="Overig">Overig</option>';
    
    ['jaarSelect', 'filterMaand', 'filterHoofdgroep', 'filterCategorie', 'sorteerSelect', 'toonEnkelOverig'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateDashboard);
    });
    
    document.getElementById('supFilterMaand').addEventListener('change', updateSupermarktDash);
    document.getElementById('jaarSelect').addEventListener('change', updateSupermarktDash);

    updateDashboard();
    updateSupermarktDash();
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
    let endOfWeek = new Date(refDate); 
    endOfWeek.setDate(refDate.getDate() + 6);
    let formatOpt = { day: 'numeric', month: 'short' };
    let datumBereik = `${refDate.toLocaleDateString('nl-BE', formatOpt)} - ${endOfWeek.toLocaleDateString('nl-BE', formatOpt)}`;
    let toonMaandNaam = refDate.toLocaleString('nl-BE', { month: 'long' });
    toonMaandNaam = toonMaandNaam.charAt(0).toUpperCase() + toonMaandNaam.slice(1);
    
    document.getElementById('week-titel').innerHTML = `Week ${toonWeek}, ${toonJaar}<br><span style="font-size:0.85rem; color:#64748b; font-weight:600;">${datumBereik}</span>`;
    document.getElementById('maandTitel').innerText = `Totaal ${toonMaandNaam}`;
    
    let totaalUitgegeven = 0, totaalMaandUitgegeven = 0, gecombineerdeLijst = [];
    
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
            gecombineerdeLijst.push({ 
                datumObj: d, 
                datumStr: haalWaarde(rij, KOLOM_DATUM).split(' ')[0], 
                naam: schoonNaamOp(null, rij), 
                bedrag: absoluteBedrag 
            });
        }
    });

    if (budgetData.length > 0) {
        budgetData.forEach(rij => {
            let dStr = haalWaarde(rij, 'datum') || haalWaarde(rij, 'tijdstempel'); 
            let bStr = haalWaarde(rij, 'bedrag'); 
            let winkel = schoonNaamOp(haalWaarde(rij, 'winkel') || 'Handmatige bon');
            
            if (!dStr || bStr == null) return;
            let bedrag = parseBedragNumber(bStr);
            if (isNaN(bedrag)) return;
            let absoluteBedrag = Math.abs(bedrag);
            let d = parseDatumToDate(String(dStr));
            
            if (d && d.getFullYear() === doelJaar && d.getMonth() === doelMaand) totaalMaandUitgegeven += absoluteBedrag;
            if (d && getISOWeek(d) === toonWeek && getISOYear(d) === toonJaar) {
                totaalUitgegeven += absoluteBedrag;
                gecombineerdeLijst.push({ 
                    datumObj: d, 
                    datumStr: String(dStr).split(' ')[0], 
                    naam: winkel, 
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
    if (gecombineerdeLijst.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">Geen transacties.</td></tr>';
    } else {
        let html = '';
        gecombineerdeLijst.forEach(item => {
            html += `<tr>
                <td><strong>${item.datumStr}</strong></td>
                <td><div class="omschrijving-cel" title="${item.naam}">${item.naam}</div></td>
                <td class="tekst-negatief"><strong>${formatBedrag(item.bedrag)}</strong></td>
            </tr>`;
        });
        tbody.innerHTML = html;
    }
}

function tekenSupPercGrafiek(gekozenJaar, supData) {
    let mndUniekeDagen = Array(12).fill().map(() => new Set());
    
    supData.forEach(item => { 
        if (item.ruweMaand !== null) mndUniekeDagen[item.ruweMaand].add(item.datumStr); 
    });
    
    let percData = Array(12).fill(null);
    let today = new Date();
    let y = parseInt(gekozenJaar);
    
    for (let i = 0; i < 12; i++) {
        if (y < today.getFullYear() || (y === today.getFullYear() && i <= today.getMonth())) {
            let days = new Date(y, i + 1, 0).getDate();
            if (y === today.getFullYear() && i === today.getMonth()) {
                days = today.getDate();
            }
            percData[i] = Math.min((mndUniekeDagen[i].size / days) * 100, 100);
        }
    }
    
    if (window.mijnSupPercGrafiek) window.mijnSupPercGrafiek.destroy();
    
    window.mijnSupPercGrafiek = new Chart(document.getElementById('supPercGrafiek').getContext('2d'), {
        type: 'bar', 
        data: { 
            labels: ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'], 
            datasets: [{ 
                label: '% Dagen gewinkeld', 
                data: percData, 
                backgroundColor: '#d97706',
                borderRadius: 4
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { 
                y: { 
                    max: 100, 
                    beginAtZero: true,
                    ticks: { callback: function(value) { return value + '%'; } }
                } 
            },
            plugins: {
                tooltip: { callbacks: { label: function(ctx) { return ctx.parsed.y.toFixed(1) + '%'; } } }
            }
        }
    });
}

function updateSupermarktDash() {
    const gekozenJaar = document.getElementById('jaarSelect').value;
    const fMaand = document.getElementById('supFilterMaand').value; 
    let supDataGeheelJaar = [];
    
    alleData.forEach(rij => {
        if(haalJaar(haalWaarde(rij, KOLOM_DATUM)) === gekozenJaar && bepaalCategorie(rij) === 'Supermarkt') {
            let b = parseBedragNumber(haalWaarde(rij, KOLOM_BEDRAG));
            if(b < 0) { 
                supDataGeheelJaar.push({
                    datumObj: parseDatumToDate(haalWaarde(rij, KOLOM_DATUM)),
                    datumStr: haalWaarde(rij, KOLOM_DATUM).split(' ')[0],
                    bedrag: Math.abs(b),
                    winkel: schoonNaamOp(null, rij),
                    ruweMaand: haalRuweMaand(haalWaarde(rij, KOLOM_DATUM))
                });
            }
        }
    });
    
    budgetData.forEach(rij => {
        let dStr = haalWaarde(rij, 'datum') || haalWaarde(rij, 'tijdstempel');
        let bStr = haalWaarde(rij, 'bedrag');
        if(!dStr || !bStr) return;
        let bedrag = parseBedragNumber(bStr);
        if(isNaN(bedrag)) return;
        let d = parseDatumToDate(String(dStr));
        let winkel = schoonNaamOp(haalWaarde(rij, 'winkel') || 'Handmatige bon');
        if(d && String(d.getFullYear()) === gekozenJaar) {
            supDataGeheelJaar.push({ 
                datumObj: d, 
                datumStr: String(dStr).split(' ')[0], 
                bedrag: Math.abs(bedrag), 
                winkel: winkel, 
                ruweMaand: d.getMonth() 
            });
        }
    });
    
    tekenSupPercGrafiek(gekozenJaar, supDataGeheelJaar);
    
    let supDataFiltered = (fMaand !== "alle") ? supDataGeheelJaar.filter(item => item.ruweMaand === parseInt(fMaand)) : supDataGeheelJaar;
    
    let uniekeDagen = new Set();
    let totaalBedrag = 0;
    let perWinkel = {};
    let bezoekenPerDag = {}; // NIEUW: Houdt aantal bezoeken per datum bij
    
    supDataFiltered.forEach(item => {
        if(item.datumStr) {
            uniekeDagen.add(item.datumStr);
            if (!bezoekenPerDag[item.datumStr]) bezoekenPerDag[item.datumStr] = 0;
            bezoekenPerDag[item.datumStr]++;
        }
        
        totaalBedrag += item.bedrag;
        
        if(!perWinkel[item.winkel]) perWinkel[item.winkel] = 0;
        perWinkel[item.winkel] += item.bedrag;
    });
    
    // BEREKEN BEZOEKEN PER DAG
    let count1 = 0, count2 = 0, count3plus = 0;
    Object.values(bezoekenPerDag).forEach(aantal => {
        if (aantal === 1) count1++;
        else if (aantal === 2) count2++;
        else if (aantal >= 3) count3plus++;
    });
    document.getElementById('sup1Keer').innerText = count1 + "x";
    document.getElementById('sup2Keer').innerText = count2 + "x";
    document.getElementById('sup3Keer').innerText = count3plus + "x";
    
    let y = parseInt(gekozenJaar), m = (fMaand !== "alle") ? parseInt(fMaand) : -1, today = new Date();
    let daysInPeriod = 1;
    if (m !== -1) {
        daysInPeriod = (y === today.getFullYear() && m === today.getMonth() ? today.getDate() : new Date(y, m+1, 0).getDate());
    } else {
        daysInPeriod = (y === today.getFullYear() ? Math.max(1, Math.ceil((today - new Date(y,0,1))/(1000*60*60*24))) : ((y%4===0)?366:365));
    }
    
    let perc = Math.min((uniekeDagen.size / daysInPeriod) * 100, 100);
    document.getElementById('supAantalDagen').innerText = uniekeDagen.size;
    document.getElementById('supPercentage').innerText = perc.toFixed(1) + '%';
    document.getElementById('supTotaal').innerText = formatBedrag(totaalBedrag);
    
    let winkelArr = Object.keys(perWinkel).map(k => ({ naam: k, totaal: perWinkel[k] })).sort((a, b) => b.totaal - a.totaal);
    if (winkelArr.length === 0) {
        document.getElementById('supWinkelBody').innerHTML = '<tr><td colspan="2" style="text-align:center; padding:15px;">Geen transacties</td></tr>';
    } else {
        let wh = '';
        winkelArr.forEach(w => {
            wh += `<tr><td><strong>${w.naam}</strong></td><td style="text-align:right;" class="tekst-negatief"><strong>${formatBedrag(w.totaal)}</strong></td></tr>`;
        });
        document.getElementById('supWinkelBody').innerHTML = wh;
    }
    
    supDataFiltered.sort((a, b) => b.datumObj - a.datumObj);
    if (supDataFiltered.length === 0) {
        document.getElementById('supTransactiesBody').innerHTML = '<tr><td colspan="3" style="text-align:center; padding:15px;">Geen transacties</td></tr>';
    } else {
        let th = '';
        supDataFiltered.forEach(t => {
            th += `<tr><td>${t.datumStr}</td><td><div class="omschrijving-cel" title="${t.winkel}">${t.winkel}</div></td><td class="tekst-negatief"><strong>${formatBedrag(t.bedrag)}</strong></td></tr>`;
        });
        document.getElementById('supTransactiesBody').innerHTML = th;
    }
}

function updateDashboard() {
    const gekozenJaar = document.getElementById('jaarSelect').value;
    const jaardata = alleData.filter(rij => haalJaar(haalWaarde(rij, KOLOM_DATUM)) === gekozenJaar);
    
    verwerkData(jaardata, gekozenJaar);
    bouwTrendGrafieken(); 
    bouwYoYGrafiek(gekozenJaar);
    bouwSlimmeInzichten();
    
    let tabelData = [...jaardata];
    const fMaand = document.getElementById('filterMaand').value;
    const fHoofd = document.getElementById('filterHoofdgroep').value;
    const fCat = document.getElementById('filterCategorie').value;
    
    if (document.getElementById('toonEnkelOverig').checked) {
        tabelData = tabelData.filter(rij => bepaalCategorie(rij) === "Overig");
    } else {
        if (fMaand !== "alle") tabelData = tabelData.filter(rij => haalRuweMaand(haalWaarde(rij, KOLOM_DATUM)) === parseInt(fMaand));
        if (fHoofd !== "alle") tabelData = tabelData.filter(rij => bepaalHoofdgroep(bepaalCategorie(rij)) === fHoofd);
        if (fCat !== "alle") tabelData = tabelData.filter(rij => bepaalCategorie(rij) === fCat);
    }
    
    tabelData.sort((a, b) => parseDatumToDate(haalWaarde(b, KOLOM_DATUM)) - parseDatumToDate(haalWaarde(a, KOLOM_DATUM)));
    bouwTransactieTabel(tabelData);
}

function bouwYoYGrafiek(gekozenJaar) {
    if (window.mijnYoYGrafiek) window.mijnYoYGrafiek.destroy();
    let jaarNu = parseInt(gekozenJaar), jaarVorige = jaarNu - 1, dataNu = Array(12).fill(0), dataVorige = Array(12).fill(0);
    
    alleData.forEach(r => {
        if (bepaalCategorie(r) === "Sparen & Intern") return; 
        let b = parseBedragNumber(haalWaarde(r, KOLOM_BEDRAG));
        if (isNaN(b) || b >= 0) return; 
        let j = parseInt(haalJaar(haalWaarde(r, KOLOM_DATUM))), m = haalRuweMaand(haalWaarde(r, KOLOM_DATUM));
        if (j === jaarNu && m !== null) dataNu[m] += Math.abs(b);
        if (j === jaarVorige && m !== null) dataVorige[m] += Math.abs(b);
    });
    
    let huidigeDatum = new Date();
    if (jaarNu === huidigeDatum.getFullYear()) { 
        for (let i = huidigeDatum.getMonth() + 1; i < 12; i++) dataNu[i] = null; 
    }
    
    window.mijnYoYGrafiek = new Chart(document.getElementById('yoyGrafiek').getContext('2d'), {
        type: 'line',
        data: { 
            labels: ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'], 
            datasets: [
                { label: `${jaarNu}`, data: dataNu, borderColor: '#1e3a8a', backgroundColor: '#1e3a8a', borderWidth: 3, tension: 0.4 },
                { label: `${jaarVorige}`, data: dataVorige, borderColor: '#94a3b8', borderDash: [5, 5], borderWidth: 2, tension: 0.4, fill: false }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, spanGaps: false }
    });
}

function bouwSlimmeInzichten() {
    let huidigeDatum = new Date();
    let dNu = new Date(huidigeDatum.getFullYear(), huidigeDatum.getMonth(), 1);
    let dOud = new Date(huidigeDatum.getFullYear(), huidigeDatum.getMonth() - 1, 1);
    
    let uitgavenNu = {}, uitgavenVorigeMaand = {}, uitgavenGem6mnd = {};
    
    alleData.forEach(r => {
        let cat = bepaalCategorie(r);
        if (cat === "Sparen & Intern" || VASTE_CATEGORIEEN.includes(cat)) return; 
        let b = parseBedragNumber(haalWaarde(r, KOLOM_BEDRAG));
        if (isNaN(b) || b >= 0) return; 
        let d = parseDatumToDate(haalWaarde(r, KOLOM_DATUM));
        if (!d) return;
        
        let m = d.getMonth(), y = d.getFullYear();
        if (m === dNu.getMonth() && y === dNu.getFullYear()) uitgavenNu[cat] = (uitgavenNu[cat] || 0) + Math.abs(b);
        if (m === dOud.getMonth() && y === dOud.getFullYear()) uitgavenVorigeMaand[cat] = (uitgavenVorigeMaand[cat] || 0) + Math.abs(b);
        
        let monthsDiff = (dNu.getFullYear() - y) * 12 + (dNu.getMonth() - m);
        if (monthsDiff > 0 && monthsDiff <= 6) {
            uitgavenGem6mnd[cat] = (uitgavenGem6mnd[cat] || 0) + Math.abs(b) / 6;
        }
    });
    
    let dagenGepasseerd = huidigeDatum.getDate();
    let pacingFactor = dagenGepasseerd / new Date(huidigeDatum.getFullYear(), huidigeDatum.getMonth() + 1, 0).getDate();
    let inzichten = [];
    
    let alleGevondenCats = new Set([...Object.keys(uitgavenNu), ...Object.keys(uitgavenVorigeMaand)]);
    alleGevondenCats.forEach(cat => {
        let nu = uitgavenNu[cat] || 0;
        let vorig = uitgavenVorigeMaand[cat] || 0;
        let gem = uitgavenGem6mnd[cat] || 0;
        let verwacht = gem * pacingFactor;
        
        if (nu > 20 || vorig > 20) {
            if (nu - verwacht > 20) {
                inzichten.push({ type: 'waarschuwing', cat: cat, nu: nu, verwacht: verwacht });
            } else if (dagenGepasseerd > 7 && (vorig - nu) > 20) {
                inzichten.push({ type: 'tip', cat: cat, nu: nu, vorig: vorig });
            }
        }
    });
    
    let html = '';
    if (inzichten.length > 0) {
        inzichten.forEach(i => {
            if (i.type === 'waarschuwing') {
                html += `<div style="padding: 10px; background: #fee2e2; border-left: 4px solid #ef4444; border-radius: 6px; margin-bottom: 5px;"><strong>${i.cat}</strong>: al ${formatBedrag(i.nu)} uit, verwacht was ${formatBedrag(i.verwacht)}.</div>`;
            } else {
                html += `<div style="padding: 10px; background: #d1fae5; border-left: 4px solid #10b981; border-radius: 6px; margin-bottom: 5px;"><strong>${i.cat}</strong>: momenteel op ${formatBedrag(i.nu)}, vorige maand was dit ${formatBedrag(i.vorig)}.</div>`;
            }
        });
    } else {
        html = '<p style="color: #64748b; font-style: italic;">Geen grote uitschieters deze maand.</p>';
    }
    document.getElementById('inzichtenBody').innerHTML = html;
}

function verwerkData(data, huidigJaar) {
    let inkomsten = 0, uitgaven = 0, vast = 0, spaarBalansVanafJuni = 0;
    let startDatumSpaardoel = new Date(parseInt(huidigJaar), 5, 1);
    const maanden = {}, cats = {}, groepen = {}, hgBreakdown = {}, maandTop5Data = {}; 
    
    data.forEach(r => {
        let b = parseBedragNumber(haalWaarde(r, KOLOM_BEDRAG));
        if (isNaN(b)) return;
        const d = parseDatumToDate(haalWaarde(r, KOLOM_DATUM));
        if (d && d.getTime() >= startDatumSpaardoel.getTime()) spaarBalansVanafJuni += b;
        
        const cat = bepaalCategorie(r);
        const hg = bepaalHoofdgroep(cat);
        const datumVal = haalWaarde(r, KOLOM_DATUM);
        let isSparen = (cat === "Sparen & Intern");
        
        let jaar = haalJaar(datumVal);
        let maandNum = haalRuweMaand(datumVal);
        let m = (jaar !== "Onbekend" && maandNum !== null) ? `${jaar}-${String(maandNum + 1).padStart(2, '0')}` : "Onbekend";
        
        if (!maanden[m]) maanden[m] = { in: 0, uit: 0 };
        
        if (b > 0) { 
            if (!isSparen) { 
                inkomsten += b; 
                maanden[m].in += b; 
            } 
        } else {
            if (!isSparen) {
                uitgaven += Math.abs(b); 
                maanden[m].uit += b;
                
                if (VASTE_CATEGORIEEN.includes(cat)) {
                    vast += Math.abs(b);
                } else {
                    let winkelNaam = schoonNaamOp(null, r);
                    if (winkelNaam !== "Transactie (Geen details)") {
                        if (!maandTop5Data[m]) maandTop5Data[m] = {};
                        if (!maandTop5Data[m][winkelNaam]) maandTop5Data[m][winkelNaam] = 0;
                        maandTop5Data[m][winkelNaam] += Math.abs(b);
                    }
                }
                
                if (!cats[cat]) cats[cat] = 0; 
                cats[cat] += Math.abs(b);
                
                if (!groepen[hg]) groepen[hg] = 0; 
                groepen[hg] += Math.abs(b);
                
                if (!hgBreakdown[hg]) hgBreakdown[hg] = {};
                if (!hgBreakdown[hg][cat]) hgBreakdown[hg][cat] = 0;
                hgBreakdown[hg][cat] += Math.abs(b);
            }
        }
    });
    
    document.getElementById('jaarInkomsten').innerText = formatBedrag(inkomsten);
    document.getElementById('jaarUitgaven').innerText = formatBedrag(uitgaven);
    
    const balans = inkomsten - uitgaven;
    const balansEl = document.getElementById('jaarBalans');
    balansEl.innerText = formatBedrag(balans);
    balansEl.className = balans >= 0 ? "bedrag positief" : "bedrag negatief";
    
    document.getElementById('vastTotaal').innerText = formatBedrag(vast);
    
    const spaarDoel = 2000;
    let percentage = Math.min((spaarBalansVanafJuni / spaarDoel) * 100, 100);
    const bar = document.getElementById('spaardoelBar'), tekst = document.getElementById('spaardoelTekst');
    if (bar && tekst) { 
        bar.style.width = percentage + '%'; 
        tekst.innerText = formatBedrag(spaarBalansVanafJuni); 
        bar.style.backgroundColor = spaarBalansVanafJuni >= spaarDoel ? '#059669' : '#10b981'; 
    }
    
    const maandContainer = document.getElementById('maandBody');
    maandContainer.innerHTML = '';
    
    Object.keys(maanden).sort().reverse().forEach(mnd => {
        if(mnd === "Onbekend") return;
        const md = maanden[mnd], mBalans = md.in + md.uit;
        let tmpD = mnd.split('-');
        let mNaam = new Date(tmpD[0], parseInt(tmpD[1])-1, 1).toLocaleString('nl-BE', { month: 'short' });
        mNaam = mNaam.charAt(0).toUpperCase() + mNaam.slice(1) + ' ' + tmpD[0];
        
        let mBalansKleur = mBalans >= 0 ? "tekst-positief" : "tekst-negatief";

        const trHoofd = document.createElement('tr');
        trHoofd.className = 'mnd-row';
        trHoofd.style.cursor = 'pointer';
        trHoofd.innerHTML = `
            <td><span class="pijl-mnd">▶</span> <strong>${mNaam}</strong></td>
            <td class="tekst-positief">${formatBedrag(md.in)}</td>
            <td class="tekst-negatief">${formatBedrag(md.uit)}</td>
            <td class="${mBalansKleur}"><strong>${formatBedrag(mBalans)}</strong></td>`;
        
        const trSub = document.createElement('tr');
        trSub.style.display = 'none';
        trSub.className = 'mnd-sub-row';
        
        let top5Html = '<div style="padding:10px; font-size:0.8rem; color:#64748b;">Geen uitgaven</div>';
        if (maandTop5Data[mnd]) {
            let items = Object.keys(maandTop5Data[mnd]).map(k => ({n: k, b: maandTop5Data[mnd][k]})).sort((a,b)=>b.b-a.b).slice(0,5);
            if (items.length > 0) {
                top5Html = `<div style="padding:10px;">${items.map((i, index)=>`<strong>${index+1}.</strong> ${i.n}: <span class="tekst-negatief">${formatBedrag(i.b)}</span>`).join('<br>')}</div>`;
            }
        }
        
        trSub.innerHTML = `<td colspan="4" style="background-color:#f8fafc; border-bottom:1px solid #e5e7eb;">${top5Html}</td>`;
        maandContainer.appendChild(trHoofd); 
        maandContainer.appendChild(trSub);
        
        trHoofd.onclick = () => { 
            let wasOpen = trSub.style.display === 'table-row';
            document.querySelectorAll('.mnd-sub-row').forEach(r => r.style.display = 'none');
            document.querySelectorAll('.mnd-row .pijl-mnd').forEach(p => p.style.transform = 'rotate(0deg)');
            
            if (!wasOpen) {
                trSub.style.display = 'table-row';
                trHoofd.querySelector('.pijl-mnd').style.transform = 'rotate(90deg)';
            }
        };
    });
    
    bouwDrillDownTabel(hgBreakdown, groepen);
    
    let top5JaarTotaal = {};
    Object.keys(cats).forEach(catName => {
        if (!VASTE_CATEGORIEEN.includes(catName) && catName !== "Sparen & Intern") {
            top5JaarTotaal[catName] = cats[catName];
        }
    });
    bouwTop5Tabel(top5JaarTotaal);
    
    tekenBasisGrafieken(maanden, groepen, Object.keys(maanden).sort());
}

function bouwTop5Tabel(top5Data) {
    let top5Array = Object.keys(top5Data).map(naam => ({ naam: naam, totaal: top5Data[naam] })).sort((a, b) => b.totaal - a.totaal);
    
    let top5Html = top5Array.slice(0, 5).map((item, index) => {
        let medaille = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '▪️';
        return `<tr><td style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">${medaille} <strong>${item.naam}</strong></td><td style="text-align:right; color:#ef4444; font-weight:700;">${formatBedrag(item.totaal)}</td></tr>`;
    }).join('');
    
    document.getElementById('top5Body').innerHTML = top5Html || '<tr><td colspan="2" style="text-align:center;">Geen gegevens</td></tr>';
}

function bouwDrillDownTabel(breakdown, totalen) {
    const container = document.getElementById('hoofdgroepBody');
    container.innerHTML = '';
    
    Object.keys(totalen).sort((a,b) => totalen[b] - totalen[a]).forEach(hg => {
        const hgRow = document.createElement('tr');
        hgRow.className = 'hg-row'; 
        hgRow.style.cursor = 'pointer';
        hgRow.innerHTML = `<td><span class="pijl" style="display:inline-block; transition: transform 0.2s;">▶</span> <strong>${hg}</strong></td><td style="text-align: right;" class="tekst-negatief"><strong>${formatBedrag(totalen[hg])}</strong></td>`;
        container.appendChild(hgRow);
        
        const subRows = [];
        Object.keys(breakdown[hg]).sort((a,b) => breakdown[hg][b] - breakdown[hg][a]).forEach(sub => {
            const subRow = document.createElement('tr'); 
            subRow.className = 'sub-row'; 
            subRow.style.display = 'none';
            subRow.innerHTML = `<td style="padding-left:30px; color:#64748b;">${sub}</td><td style="text-align:right;" class="tekst-negatief">${formatBedrag(breakdown[hg][sub])}</td>`;
            container.appendChild(subRow); 
            subRows.push(subRow);
        });
        
        hgRow.onclick = () => {
            let isExpanded = hgRow.classList.contains('expanded');
            
            document.querySelectorAll('.hg-row').forEach(r => {
                r.classList.remove('expanded');
                r.querySelector('.pijl').style.transform = 'rotate(0deg)';
            });
            document.querySelectorAll('.sub-row').forEach(r => r.style.display = 'none');
            
            if(!isExpanded) {
                hgRow.classList.add('expanded');
                hgRow.querySelector('.pijl').style.transform = 'rotate(90deg)';
                subRows.forEach(r => r.style.display = 'table-row');
            }
        };
    });
}

function tekenBasisGrafieken(mndData, grpData, gesorteerdeMaanden) {
    if (mijnMaandGrafiek) mijnMaandGrafiek.destroy();
    
    const mndLabels = gesorteerdeMaanden.map(m => m.split('-')[1] + '/' + m.split('-')[0].slice(-2));
    
    mijnMaandGrafiek = new Chart(document.getElementById('maandGrafiek').getContext('2d'), {
        type: 'line',
        data: { 
            labels: mndLabels, 
            datasets: [
                { label: 'Inkomsten', data: gesorteerdeMaanden.map(m => mndData[m].in), borderColor: '#00E676', backgroundColor: '#00E676', borderWidth: 3 }, 
                { label: 'Uitgaven', data: gesorteerdeMaanden.map(m => Math.abs(mndData[m].uit)), borderColor: '#FF3D00', backgroundColor: '#FF3D00', borderWidth: 3 } 
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
    
    if (mijnBalansGrafiek) mijnBalansGrafiek.destroy();
    let cum = 0;
    let cumData = gesorteerdeMaanden.map(m => { cum += (mndData[m].in + mndData[m].uit); return cum; });
    
    mijnBalansGrafiek = new Chart(document.getElementById('balansGrafiek').getContext('2d'), {
        type: 'bar',
        data: { 
            labels: mndLabels, 
            datasets: [
                { type: 'line', label: 'Spaar Evolutie', data: cumData, borderColor: '#1e3a8a', borderWidth: 3, fill: true },
                { type: 'bar', label: 'Maand Resultaat', data: gesorteerdeMaanden.map(m => mndData[m].in + mndData[m].uit), backgroundColor: gesorteerdeMaanden.map(m => (mndData[m].in + mndData[m].uit) >= 0 ? '#10b981' : '#ef4444') }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
    
    if (mijnCatGrafiek) mijnCatGrafiek.destroy();
    const labels = Object.keys(grpData).sort((a,b) => grpData[b]-grpData[a]);
    mijnCatGrafiek = new Chart(document.getElementById('categorieGrafiek').getContext('2d'), {
        type: 'doughnut', 
        data: { 
            labels: labels, 
            datasets: [{ 
                data: labels.map(l => grpData[l]), 
                backgroundColor: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A733FF', '#FF3366', '#00E5FF'] 
            }] 
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function bouwTrendGrafieken() {
    let huidigeDatum = new Date(); 
    let huidigJaarNummer = huidigeDatum.getFullYear(); 
    let huidigeMaandIndex = huidigeDatum.getMonth(); 
    
    const trendData = { 'Supermarkt': {}, 'Online': {}, 'Frietjes': {} };
    const jarenSet = new Set();
    const gekozenJaar = document.getElementById('jaarSelect').value;
    
    alleData.forEach(rij => {
        let b = parseBedragNumber(haalWaarde(rij, KOLOM_BEDRAG));
        if (isNaN(b) || b >= 0) return; 
        
        const cat = bepaalCategorie(rij);
        if (['Supermarkt', 'Online', 'Frietjes'].includes(cat)) {
            let jaar = haalJaar(haalWaarde(rij, KOLOM_DATUM));
            let maand = haalRuweMaand(haalWaarde(rij, KOLOM_DATUM));
            if (jaar !== "Onbekend" && maand !== null) { 
                jarenSet.add(jaar); 
                if (!trendData[cat][jaar]) trendData[cat][jaar] = Array(12).fill(0); 
                trendData[cat][jaar][maand] += Math.abs(b); 
            }
        }
    });
    
    const jarenArray = Array.from(jarenSet).sort().reverse(); 
    const baseColors = { 'Supermarkt': [5, 150, 105], 'Online': [59, 130, 246], 'Frietjes': [234, 179, 8] };
    
    ['Sup', 'Fri', 'Onl'].forEach((s, i) => {
        const cat = ['Supermarkt', 'Frietjes', 'Online'][i];
        let datasets = jarenArray.map((jaar, index) => {
            let isHuidigJaar = (parseInt(jaar) === huidigJaarNummer);
            let ruwe = trendData[cat][jaar] || Array(12).fill(0);
            let data = ruwe.map((v, idx) => (isHuidigJaar && idx > huidigeMaandIndex) ? null : v);
            return { 
                label: jaar, 
                data: data, 
                borderColor: `rgba(${baseColors[cat].join(',')}, ${index === 0 ? 1 : 0.5})`, 
                borderWidth: index === 0 ? 3 : 2, 
                fill: false, 
                tension: 0.4 
            };
        });
        
        if(document.getElementById('ytd-' + cat)) {
            document.getElementById('ytd-' + cat).innerText = formatBedrag((trendData[cat][gekozenJaar] || Array(12).fill(0)).reduce((a, b) => a + b, 0));
        }
        
        if (window['chart'+s]) window['chart'+s].destroy();
        window['chart'+s] = new Chart(document.getElementById('trend'+cat).getContext('2d'), { 
            type: 'line', 
            data: { labels: ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'], datasets: datasets }, 
            options: { responsive: true, maintainAspectRatio: false, spanGaps: false } 
        });
    });
}

function bouwTransactieTabel(data) {
    let thead = document.getElementById('tableHead');
    let tbody = document.getElementById('tableBody');
    
    if(data.length === 0) { 
        thead.innerHTML = ''; 
        tbody.innerHTML = '<tr><td style="padding: 20px; text-align: center;">Geen transacties.</td></tr>'; 
        return; 
    }
    
    thead.innerHTML = `<tr><th>Datum</th><th>Omschrijving</th><th>Bedrag</th><th>Groep</th><th>Cat</th></tr>`;
    
    let html = '';
    data.slice(0, 150).forEach(rij => {
        let b = parseBedragNumber(haalWaarde(rij, KOLOM_BEDRAG));
        let omschrijving = schoonNaamOp(null, rij);
        let groep = bepaalHoofdgroep(bepaalCategorie(rij));
        let cat = bepaalCategorie(rij);
        let datumStr = haalWaarde(rij, KOLOM_DATUM);
        
        let kleurClass = b > 0 ? 'tekst-positief' : 'tekst-negatief';
        
        html += `<tr>
            <td>${datumStr}</td>
            <td><div class="omschrijving-cel" title="${omschrijving}">${omschrijving}</div></td>
            <td><span class="${kleurClass}"><strong>${formatBedrag(b)}</strong></span></td>
            <td>${groep}</td>
            <td>${cat}</td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
}
