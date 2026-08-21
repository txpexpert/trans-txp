import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import ForexWidget from "../../components/ForexWidget";

const fmt = (n: number) => Math.round(n).toLocaleString("fr-MA");

interface Regime {
  label: string; long: string; color: string;
  constraint: string; constraint_type: string; caution_type: string;
  suspension: boolean; delai: string; delai_jours: number | null; art: string;
  desc: string; docs: string[]; avantages: string[]; points: string[];
}

const R: Record<string, Regime> = {
  mac:    { label:"MAC",      long:"Mise à la consommation",                  color:"#E85D5D", constraint:"Paiement intégral DI + TVA + TIC à la déclaration",       constraint_type:"Paiement immédiat",                                      caution_type:"Aucune",                         suspension:false, delai:"Aucun (définitif)",       delai_jours:null, art:"Art. 84–101 CDII",         desc:"Régime de droit commun. Droits et taxes payés intégralement. Marchandise en libre circulation sur le marché marocain.",                                                                  docs:["DUM (D10)","Facture commerciale","BL / LTA","CO si préférence tarifaire"], avantages:["Simplicité maximale","Aucun suivi ultérieur","Libre circulation immédiate"], points:["Paiement intégral immédiat","Non récupérable si réexportation","Trésorerie impactée"] },
  atpa:   { label:"ATPA",     long:"Adm. temp. perfectionnement actif",        color:"#7F77DD", constraint:"Caution bancaire = 100% DI+TVA (–40% si OEA)",              constraint_type:"Caution bancaire de garantie — CDII Art. 188",           caution_type:"Bancaire 100% droits suspendus",  suspension:true,  delai:"12 à 36 mois",            delai_jours:null, art:"Art. 184–200 CDII",         desc:"Importation de matières premières pour transformation industrielle. Droits suspendus contre caution bancaire. Réexportation des produits finis obligatoire.",                            docs:["Autorisation ATPA (ADII)","Caution bancaire","Nomenclature matières/produits","Comptabilité-matières","DUM (D13)"], avantages:["Suspension totale DI + TVA + TIC","Caution libérée à l'apurement","Trésorerie préservée"], points:["Caution bancaire à mobiliser (~1.5–2%/an)","Comptabilité-matières obligatoire","Contrôles ADII réguliers"] },
  at:     { label:"AT",       long:"Admission temporaire",                     color:"#534AB7", constraint:"1/10 des droits et taxes payé tous les 3 mois",             constraint_type:"Paiement fractionné 1/10 droits / trimestre — Art. 175", caution_type:"1/10 DI+TVA / trimestre",         suspension:true,  delai:"6 à 24 mois max",         delai_jours:null, art:"Art. 163–183 CDII",         desc:"Importation temporaire pour usage déterminé. Paiement échelonné : 1/10 des droits dus tous les 3 mois. Réexportation en l'état obligatoire.",                                           docs:["Demande autorisation ADII","DUM AT (D13)","Engagement réexportation","Justificatif usage","Cautions périodiques"], avantages:["Paiement échelonné — trésorerie lissée","Droits non définitifs si réexport","Idéal matériel pro, expositions"], points:["1/10 droits dû tous les 3 mois","Total 40% droits sur 12 mois","Réexportation en l'état obligatoire"] },
  ed:     { label:"Entrepôt", long:"Entrepôt douanier de stockage",            color:"#BA7517", constraint:"Frais de stockage mensuels + caution entrepositaire",       constraint_type:"Frais stockage + caution ~50% droits — Art. 113",        caution_type:"Caution entrepositaire ~50% droits", suspension:true, delai:"Indéfini (suivi annuel)", delai_jours:null, art:"Art. 113–145 CDII",         desc:"Stockage sous contrôle douanier en suspension de droits. Destination flexible — mise à la consommation ou réexportation au retrait.",                                                    docs:["Autorisation entrepôt (ADII)","DUM (D15)","Plan stockage agréé","Registre entrées/sorties"], avantages:["Flexibilité totale destination","Droits payés seulement au retrait","Stock tournant optimisé"], points:["Frais stockage mensuels","Entrepôt agréé ADII requis","Comptabilité-matières","Caution entrepositaire"] },
  mead:   { label:"MEAD",     long:"Magasins et aires de dédouanement",        color:"#D85A30", constraint:"Frais de magasinage + délai 45 jours maximum",             constraint_type:"Délai MAX 45 jours · Frais magasinage quotidiens — Art. 60", caution_type:"Garantie MEAD agréé",           suspension:true,  delai:"45 jours maximum",        delai_jours:45,   art:"Art. 57–63 CDII",          desc:"Stockage de courte durée en attente d'affectation à un régime définitif. Délai strict 45 jours — vente aux enchères ADII au-delà.",                                                      docs:["Déclaration sommaire (DS)","Bordereau réception MEAD","Engagement affectation 45j"], avantages:["Solution d'attente avant choix régime","Pas de décision immédiate","Courte durée logistique"], points:["45 jours MAX — enchères ADII si dépassement","Frais magasinage quotidiens","Régime provisoire uniquement"] },
  zfe:    { label:"ZFE/ZAI",  long:"Zone franche export / ZAI",               color:"#185FA5", constraint:"Implantation physique en ZAI obligatoire",                  constraint_type:"Exonération totale — Loi 19-94 + ZAI",                   caution_type:"Aucune caution",                  suspension:true,  delai:"Illimité en zone",        delai_jours:null, art:"Loi 19-94 · Art. 4 CDII",  desc:"Traitement dans zone exclue du territoire douanier. Exonération totale droits et taxes sur flux export sans cautionnement.",                                                             docs:["Convention ZAI (CRI)","Autorisation exploitation","DUM zone franche","Reporting ADII trimestriel"], avantages:["Exonération totale sans caution","Aucun délai d'apurement","Infrastructure permanente"], points:["Implantation physique en ZAI obligatoire","Vente locale = importation ordinaire","Investissement initial important"] },
  et:     { label:"ET",       long:"Exportation temporaire",                   color:"#639922", constraint:"Retour en franchise totale — marchandise marocaine",        constraint_type:"Exonération droits à la réimportation — Art. 201",       caution_type:"Aucune",                          suspension:true,  delai:"6 à 12 mois",             delai_jours:null, art:"Art. 201–215 CDII",         desc:"Exportation temporaire de marchandises marocaines pour usage à l'étranger. Réimportation en franchise totale si retour en l'état.",                                                      docs:["DUM export temporaire (D42)","Facture proforma","Justification usage étranger","Engagement de retour"], avantages:["Aucune taxation à la réimportation","Procédure simple","Idéal matériel professionnel"], points:["Marchandise d'origine marocaine","Retour obligatoire en l'état","Délai 6–12 mois"] },
  etpp:   { label:"ETPP",     long:"Export. temp. perfectionnement passif",    color:"#3B6D11", constraint:"Droits calculés sur valeur ajoutée à l'étranger uniquement", constraint_type:"Droits sur VA étrangère uniquement — Art. 216",          caution_type:"Aucune à l'export",               suspension:true,  delai:"12 à 24 mois",            delai_jours:null, art:"Art. 216–230 CDII",         desc:"Exportation temporaire pour transformation à l'étranger. Réimportation avec droits calculés uniquement sur la valeur ajoutée à l'étranger.",                                            docs:["Autorisation ETPP (ADII)","DUM export (D42)","Descriptif transformation","DUM réimport + décompte VA"], avantages:["Droits sur VA étrangère seulement","Aucune caution requise","Optimise coûts transformation"], points:["Double déclaration export + réimport","Justification VA obligatoire","Complexité administrative élevée"] },
  transit:{ label:"TRANSIT",  long:"Transit douanier",                         color:"#888780", constraint:"Carnet TIR ou acquit-à-caution + délai de route",           constraint_type:"Caution TIR + délai de route — CDII Art. 57",            caution_type:"Carnet TIR ou acquit-à-caution",  suspension:true,  delai:"Délai de route fixé",     delai_jours:null, art:"Art. 57–83 CDII",           desc:"Acheminement de marchandises à travers le Maroc en suspension totale de droits. Caution ou carnet TIR requis.",                                                                         docs:["Acquit-à-caution ou carnet TIR","CMR / lettre de voiture","Manifeste transport"], avantages:["Suspension totale en transit","Procédure standardisée TIR","Aucune implantation requise"], points:["Carnet TIR obligatoire","Délai route impératif","Contrôles bureaux entrée/sortie"] },
};

const ALL_IDS = Object.keys(R);

const REGIME_OPTIONS = [
  { value:"mac",     label:"MAC — Mise à la consommation",                          note:"Paiement immédiat" },
  { value:"atpa",    label:"ATPA — Perfectionnement actif",                         note:"⚠ Caution bancaire 100%" },
  { value:"at",      label:"AT — Admission temporaire",                             note:"⚠ 1/10 droits / trimestre" },
  { value:"ed",      label:"Entrepôt de stockage",                                  note:"⚠ Frais stockage mensuels" },
  { value:"mead",    label:"MEAD — Magasins et aires de dédouanement",              note:"⚠ 45 jours max" },
  { value:"zfe",     label:"ZFE / ZAI — Zone franche export",                       note:"Exonération totale" },
  { value:"et",      label:"ET — Exportation temporaire",                           note:"Retour en franchise" },
  { value:"etpp",    label:"ETPP — Perfectionnement passif",                        note:"Droits sur VA uniquement" },
  { value:"transit", label:"Transit douanier",                                      note:"⚠ Carnet TIR" },
];

const MATRIX_ROWS = [
  { label:"Suspension DI + TVA",       k:"suspension" as const },
  { label:"Type de caution",           vals:{mac:"ok",atpa:"ko",at:"md",ed:"md",mead:"md",zfe:"ok",et:"ok",etpp:"ok",transit:"ko"} },
  { label:"Délai strict d'apurement",  vals:{mac:"ok",atpa:"md",at:"ko",ed:"ok",mead:"ko",zfe:"ok",et:"md",etpp:"md",transit:"ko"} },
  { label:"Frais de stockage",         vals:{mac:"ok",atpa:"ok",at:"ok",ed:"ko",mead:"ko",zfe:"ok",et:"ok",etpp:"ok",transit:"ok"} },
  { label:"Transformation autorisée",  vals:{mac:"ko",atpa:"ok",at:"ko",ed:"md",mead:"ko",zfe:"ok",et:"ko",etpp:"ok",transit:"ko"} },
  { label:"Destination locale OK",     vals:{mac:"ok",atpa:"ko",at:"ko",ed:"ok",mead:"ok",zfe:"ko",et:"ko",etpp:"ko",transit:"ko"} },
  { label:"Réexportation OK",          vals:{mac:"ko",atpa:"ok",at:"ok",ed:"ok",mead:"ok",zfe:"ok",et:"ok",etpp:"ok",transit:"ok"} },
  { label:"Durée indéfinie possible",  vals:{mac:"ok",atpa:"ko",at:"ko",ed:"ok",mead:"ko",zfe:"ok",et:"ko",etpp:"ko",transit:"ko"} },
  { label:"Comptabilité-matières",     vals:{mac:"ok",atpa:"ko",at:"ok",ed:"ko",mead:"ok",zfe:"md",et:"ok",etpp:"ko",transit:"ok"} },
  { label:"Complexité administrative", vals:{mac:"ok",atpa:"ko",at:"md",ed:"md",mead:"ok",zfe:"ko",et:"ok",etpp:"ko",transit:"ok"} },
];

const FLAG: Record<string,{bg:string;color:string;txt:string}> = {
  ok:{bg:"#E1F5EE",color:"#085041",txt:"✓"},
  md:{bg:"#FBF5E6",color:"#854F0B",txt:"~"},
  ko:{bg:"#FCEBEB",color:"#A32D2D",txt:"✗"},
  na:{bg:"#F1EFE8",color:"#5F5E5A",txt:"—"},
};

type Params = { caf:number; di:number; tva:number; tic:number; duree:string; statut:string; rx:number; va:number; surf:number };

function computeCost(id: string, p: Params): number {
  const di = p.caf * p.di / 100;
  const tva = (p.caf + di) * (p.tva / 100);
  const tic = p.caf * p.tic / 100;
  const total = di + tva + tic;
  const rx = p.rx / 100;
  const moisMap: Record<string,number> = { court:2, moyen:8, long:24, indef:18 };
  const m = moisMap[p.duree] ?? 8;
  const oea = p.statut === "oea" ? 0.6 : 1;
  switch (id) {
    case "mac":     return total;
    case "atpa":    return Math.round(total * oea * 0.02 * (m/12) + (1-rx)*total + p.caf*0.003);
    case "at":      return Math.round((total/10)*Math.min(Math.ceil(m/3),8) + (1-rx)*total + p.caf*0.002);
    case "ed":      return Math.round(total*0.5*oea*0.015*(m/12) + p.surf*50*m + (1-rx)*total*0.8);
    case "mead":    return Math.round(p.caf*0.00005*Math.min(m*30,45) + (m*30>45?total*0.15:0) + p.caf*0.002);
    case "zfe":     return Math.round((p.statut==="zai"?p.caf*0.01:p.caf*0.02) + (1-rx)*total);
    case "et":      return Math.round(p.caf*0.004 + (p.caf*(p.va/100))*(p.di/100)*(p.tva/100));
    case "etpp":    return Math.round(p.caf*(p.va/100)*(p.di/100+p.tva/100) + p.caf*0.006);
    case "transit": return Math.round(total*0.15*oea*0.01 + p.caf*0.003);
    default: return total;
  }
}

// ── Composant liste déroulante custom ──────────────────────────────────────
function RegimeDropdown({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (v: string) => {
    const next = selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v];
    onChange(next);
  };

  const label = selected.length === 0
    ? "Aucun régime sélectionné"
    : selected.length === ALL_IDS.length
    ? "Tous les régimes (9)"
    : `${selected.length} régime${selected.length > 1 ? "s" : ""} sélectionné${selected.length > 1 ? "s" : ""}`;

  return (
    <div ref={ref} style={{ position:"relative", width:"100%" }}>
      {/* Bouton trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          border:"1px solid #D4C8A8", padding:"8px 12px", background:"#fdfcf8",
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between",
          fontSize:12, color:"#3A3530", userSelect:"none"
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize:10, color:"#8A8078", marginLeft:8 }}>{open ? "▲" : "▼"}</span>
      </div>

      {/* Menu déroulant */}
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 2px)", left:0, right:0,
          background:"#fff", border:"1px solid #D4C8A8", zIndex:100,
          boxShadow:"0 4px 12px rgba(0,0,0,.12)"
        }}>
          {/* Tout sélectionner / désélectionner */}
          <div
            onClick={() => onChange(selected.length === ALL_IDS.length ? [] : [...ALL_IDS])}
            style={{
              padding:"7px 12px", fontSize:11, color:"#C9A84C", cursor:"pointer",
              borderBottom:"1px solid #E8DFC8", background:"#0A0A0A",
              display:"flex", alignItems:"center", gap:8
            }}
          >
            <span style={{
              width:14, height:14, border:"1px solid #C9A84C", display:"inline-flex",
              alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:10, color:"#C9A84C"
            }}>
              {selected.length === ALL_IDS.length ? "✓" : ""}
            </span>
            {selected.length === ALL_IDS.length ? "Tout désélectionner" : "Tout sélectionner"}
          </div>

          {/* Options */}
          {REGIME_OPTIONS.map(opt => {
            const checked = selected.includes(opt.value);
            const r = R[opt.value];
            return (
              <div
                key={opt.value}
                onClick={() => toggle(opt.value)}
                style={{
                  padding:"8px 12px", fontSize:12, cursor:"pointer",
                  background: checked ? "#FBF5E6" : "#fff",
                  borderBottom:"1px solid #F5E4B0",
                  display:"flex", alignItems:"center", gap:10,
                  transition:"background .1s"
                }}
              >
                {/* Checkbox custom */}
                <span style={{
                  width:14, height:14, border:`2px solid ${r.color}`,
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0, fontSize:10, color:"#fff",
                  background: checked ? r.color : "transparent"
                }}>
                  {checked ? "✓" : ""}
                </span>
                {/* Point couleur */}
                <span style={{ width:8, height:8, borderRadius:"50%", background:r.color, flexShrink:0 }} />
                {/* Libellé */}
                <span style={{ flex:1, color:"#3A3530" }}>{opt.label}</span>
                {/* Note contrainte */}
                <span style={{ fontSize:10, color: opt.note.startsWith("⚠") ? "#E85D5D" : "#8A8078", flexShrink:0 }}>{opt.note}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// ──────────────────────────────────────────────────────────────────────────

type Tab = "params"|"compare"|"matrix"|"detail"|"reco";

export default function Comparateur() {
  const [tab, setTab]         = useState<Tab>("params");
  const [selected, setSelected] = useState<string[]>([...ALL_IDS]);
  const [caf,  setCaf]        = useState(1000000);
  const [di,   setDi]         = useState(30);
  const [tva,  setTva]        = useState(20);
  const [tic,  setTic]        = useState(0);
  const [duree, setDuree]     = useState("moyen");
  const [statut,setStatut]    = useState("standard");
  const [rx,   setRx]         = useState(80);
  const [va,   setVa]         = useState(40);
  const [surf, setSurf]       = useState(200);
  const [detailId, setDetailId] = useState<string|null>(null);

  const p: Params = { caf, di, tva, tic, duree, statut, rx, va, surf };
  const diVal  = caf * di / 100;
  const tvaVal = (caf + diVal) * tva / 100;
  const ticVal = caf * tic / 100;
  const macRef = diVal + tvaVal + ticVal;

  const costs: Record<string,number> = {};
  ALL_IDS.forEach(id => { costs[id] = computeCost(id, p); });

  const sorted = selected.slice().sort((a,b) => costs[a] - costs[b]);
  const minC   = costs[sorted[0]] ?? 0;
  const maxC   = costs[sorted[sorted.length-1]] ?? 1;

  const tabStyle = (t: Tab) => ({
    padding:".5rem .875rem", fontSize:10, letterSpacing:".09em", cursor:"pointer" as const,
    borderBottom: tab===t ? "2px solid #C9A84C" : "2px solid transparent",
    color: tab===t ? "#C9A84C" : "#8A8078",
    background: tab===t ? "#FBF5E6" : "transparent",
    whiteSpace:"nowrap" as const, borderRight:"1px solid #E8DFC8",
    fontWeight: tab===t ? 500 : 400,
  });

  const inp: React.CSSProperties = {
    border:"1px solid #D4C8A8", padding:"6px 9px", fontSize:12,
    fontFamily:"inherit", outline:"none", background:"#fdfcf8",
    color:"#0A0A0A", width:"100%"
  };

  const lbl = (txt: string) => (
    <div style={{ fontSize:9, letterSpacing:".1em", color:"#8A8078", marginBottom:4 }}>{txt}</div>
  );

  return (
    <>
      <Head>
        <title>Comparateur de régimes douaniers — Transit-IA</title>
      </Head>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
        :root{--gold:#C9A84C;--g2:#E8C97A;--g3:#F5E4B0;--g4:#FBF5E6;--ink:#0A0A0A;--ink2:#3A3530;--ink3:#8A8078;--bd:#E8DFC8;--bd2:#D4C8A8;--up:#4CAF7C;--dn:#E85D5D}
        *{box-sizing:border-box;margin:0;padding:0;font-family:'DM Sans',sans-serif}
        body{background:var(--g4);color:var(--ink)}
        select{border:1px solid var(--bd2);padding:6px 9px;font-size:12px;font-family:inherit;outline:none;background:#fdfcf8;color:var(--ink);width:100%}
        select:focus{border-color:var(--gold)}
        input[type=range]{width:100%;accent-color:var(--gold)}
      `}} />

      <div style={{ maxWidth:800, margin:"0 auto", border:"1px solid #E8DFC8", background:"#fdfcf8" }}>

        {/* Header */}
        <div style={{ background:"#0A0A0A", borderBottom:"2px solid #C9A84C", padding:".75rem 1.25rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:".14em", color:"#C9A84C", marginBottom:2 }}>Transit-IA — OUTIL D'AIDE À LA DÉCISION · CDII MAROC 2026</div>
            <div style={{ fontSize:15, fontWeight:500, color:"#E8C97A" }}>Comparateur des régimes douaniers — 9 régimes · Contraintes réelles</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
  <div style={{ fontSize:9, color:"#8A8078" }}>
    Base CDII · Art. 57 à 230<br/>Cautions · Délais · Frais réels
  </div>
  <a
    href="/"
    style={{
      padding:"5px 12px", fontSize:9, letterSpacing:".08em",
      color:"#8A8078", border:"1px solid #D4C8A8",
      textDecoration:"none", fontFamily:"'DM Sans', sans-serif",
      transition:"all .15s"
    }}
    onMouseOver={e => {
      (e.currentTarget as HTMLAnchorElement).style.borderColor="#C9A84C";
      (e.currentTarget as HTMLAnchorElement).style.color="#C9A84C";
    }}
    onMouseOut={e => {
      (e.currentTarget as HTMLAnchorElement).style.borderColor="#D4C8A8";
      (e.currentTarget as HTMLAnchorElement).style.color="#8A8078";
    }}
  >
    ← ACCUEIL
  </a>
</div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid #E8DFC8", overflowX:"auto", background:"#FBF5E6" }}>
          {(["params","compare","matrix","detail","reco"] as Tab[]).map((t,i) => (
            <div key={t} style={tabStyle(t)} onClick={() => setTab(t)}>
              {i+1} · {["Paramètres","Comparaison coûts","Matrice critères","Détail régime","Recommandation"][i]}
            </div>
          ))}
        </div>

        {/* ── PARAMS ── */}
        {tab === "params" && (
          <div style={{ padding:"1rem 1.25rem" }}>
            {/* Widget forex live */}
            <div style={{ marginBottom:".875rem" }}>
              <ForexWidget compact pairs={['EUR','USD','GBP','CNY','SAR','AED']} />
            </div>
            <div style={{ fontSize:9, letterSpacing:".14em", color:"#C9A84C", marginBottom:".75rem" }}>01 — VALEURS FINANCIÈRES</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:".75rem", marginBottom:".875rem" }}>
              <div>{lbl("VALEUR CAF (MAD)")}<input style={inp} type="number" value={caf} min={10000} step={10000} onChange={e=>setCaf(+e.target.value)}/><div style={{fontSize:10,color:"#8A8078",marginTop:2}}>Coût + Assurance + Fret</div></div>
              <div>{lbl("TAUX DI (%)")}<input style={inp} type="number" value={di} min={0} max={100} step={2.5} onChange={e=>setDi(+e.target.value)}/></div>
              <div>{lbl("TVA (%)")}<input style={inp} type="number" value={tva} min={0} max={20} step={7} onChange={e=>setTva(+e.target.value)}/></div>
              <div>{lbl("TAUX TIC (%)")}<input style={inp} type="number" value={tic} min={0} max={100} step={5} onChange={e=>setTic(+e.target.value)}/></div>
            </div>

            <div style={{ fontSize:9, letterSpacing:".14em", color:"#C9A84C", marginBottom:".75rem" }}>02 — DESTINATION ET RÉGIMES</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".875rem", marginBottom:".875rem" }}>
              {/* Dropdown custom */}
              <div>
                {lbl("RÉGIMES À COMPARER")}
                <RegimeDropdown selected={selected} onChange={setSelected} />
                <div style={{ fontSize:10, color:"#8A8078", marginTop:4 }}>Cliquez pour ouvrir · cochez les régimes souhaités</div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
                <div>{lbl("DURÉE PRÉVUE")}<select value={duree} onChange={e=>setDuree(e.target.value)}><option value="court">Court ≤ 3 mois</option><option value="moyen">Moyen 3–12 mois</option><option value="long">Long 12–36 mois</option><option value="indef">Indéfini / permanent</option></select></div>
                <div>{lbl("STATUT OPÉRATEUR")}<select value={statut} onChange={e=>setStatut(e.target.value)}><option value="standard">Standard</option><option value="oea">OEA agréé (–40% caution)</option><option value="zai">Installé en ZAI/ZFE</option></select></div>
                <div>{lbl("PART RÉEXPORTÉE (%)")}<input style={inp} type="number" value={rx} min={0} max={100} step={10} onChange={e=>setRx(+e.target.value)}/></div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".75rem", marginBottom:".875rem" }}>
              <div>{lbl(`VA TRANSFORMATION — ${va}%`)}<input type="range" min={0} max={100} value={va} step={5} onChange={e=>setVa(+e.target.value)}/></div>
              <div>{lbl("SUPERFICIE STOCKAGE (m²)")}<input style={inp} type="number" value={surf} min={10} step={50} onChange={e=>setSurf(+e.target.value)}/></div>
            </div>

            <div style={{ background:"#FBF5E6", border:"1px solid #F5E4B0", padding:".75rem 1rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontSize:12, color:"#3A3530" }}>
                {sorted[0]
                  ? <><strong>Optimal :</strong> <span style={{color:"#C9A84C"}}>{R[sorted[0]].long}</span> — <span style={{color:"#E85D5D",fontSize:10}}>{R[sorted[0]].constraint}</span> — <strong>{fmt(minC)} MAD</strong></>
                  : "Sélectionnez des régimes..."}
              </div>
              <button onClick={()=>setTab("compare")} style={{ padding:"7px 16px", background:"#0A0A0A", color:"#E8C97A", border:"none", cursor:"pointer", fontSize:10, letterSpacing:".08em" }}>COMPARER →</button>
            </div>
          </div>
        )}

        {/* ── COMPARE ── */}
        {tab === "compare" && (
          <div style={{ padding:"1rem 1.25rem" }}>
            <div style={{ fontSize:9, letterSpacing:".14em", color:"#C9A84C", marginBottom:".875rem" }}>COÛT TOTAL RÉEL PAR RÉGIME — toutes charges incluses</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".75rem", marginBottom:"1rem" }}>
              <div style={{ background:"#FBF5E6", border:"1px solid #F5E4B0", padding:".75rem" }}>
                <div style={{ fontSize:9, letterSpacing:".1em", color:"#8A8078", marginBottom:2 }}>DROITS & TAXES (MAC référence)</div>
                <div style={{ fontSize:20, fontWeight:500, color:"#E85D5D" }}>{fmt(macRef)} MAD</div>
                <div style={{ fontSize:10, color:"#8A8078" }}>DI + TVA + TIC si paiement immédiat</div>
              </div>
              <div style={{ background:"#FBF5E6", border:"1px solid #F5E4B0", padding:".75rem" }}>
                <div style={{ fontSize:9, letterSpacing:".1em", color:"#8A8078", marginBottom:2 }}>ÉCONOMIE MAXIMALE POSSIBLE</div>
                <div style={{ fontSize:20, fontWeight:500, color:"#4CAF7C" }}>{fmt(Math.max(0,macRef-minC))} MAD</div>
                <div style={{ fontSize:10, color:"#8A8078" }}>{sorted[0] ? `Régime optimal : ${R[sorted[0]].long}` : ""}</div>
              </div>
            </div>

            {sorted.map(id => {
              const r=R[id]; const pct=maxC>0?Math.round(costs[id]/maxC*100):0; const isMin=id===sorted[0];
              return (
                <div key={id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                  <div style={{ minWidth:72, textAlign:"right", fontSize:10, color:"#8A8078" }}>{r.label}</div>
                  <div style={{ flex:1, background:"#E8DFC8", height:20, borderRadius:2, overflow:"hidden" }}>
                    <div style={{ width:`${Math.max(pct,2)}%`, height:"100%", background:r.color, display:"flex", alignItems:"center", paddingLeft:6, fontSize:9, fontWeight:500, color:"#fff", whiteSpace:"nowrap", overflow:"hidden" }}>{fmt(costs[id])} MAD</div>
                  </div>
                  <div style={{ minWidth:64, fontSize:9, color:"#4CAF7C", fontWeight:500 }}>{isMin?"▲ OPTIMAL":""}</div>
                </div>
              );
            })}

            <div style={{ marginTop:".875rem", border:"1px solid #E8DFC8", padding:".75rem" }}>
              <div style={{ fontSize:9, letterSpacing:".12em", color:"#8A8078", marginBottom:".5rem" }}>DÉTAIL DES CONTRAINTES FINANCIÈRES</div>
              {sorted.map(id => {
                const r=R[id];
                return (
                  <div key={id} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"5px 0", borderBottom:"1px solid #F5E4B0" }}>
                    <div style={{ width:8, height:8, background:r.color, borderRadius:"50%", marginTop:3, flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, fontWeight:500, color:"#3A3530" }}>{r.long}</div>
                      <div style={{ fontSize:10, color:"#E85D5D", marginTop:1 }}>{r.constraint_type}</div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:"#0A0A0A" }}>{fmt(costs[id])} MAD</div>
                      <div style={{ fontSize:9, color:"#8A8078" }}>{r.delai}{r.delai_jours?" ⚠ MAX":""}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MATRIX ── */}
        {tab === "matrix" && (
          <div style={{ padding:"1rem 1.25rem" }}>
            <div style={{ fontSize:9, letterSpacing:".14em", color:"#C9A84C", marginBottom:".875rem" }}>MATRICE DE CRITÈRES — régimes sélectionnés</div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead>
                  <tr style={{ background:"#0A0A0A" }}>
                    <th style={{ padding:"6px 10px", textAlign:"left", fontSize:9, letterSpacing:".1em", color:"#E8C97A", fontWeight:500, minWidth:160 }}>CRITÈRE</th>
                    {selected.map(id => <th key={id} style={{ padding:"6px 5px", fontSize:9, color:"#E8C97A", fontWeight:500, textAlign:"center", minWidth:65, borderLeft:"1px solid #333" }}>{R[id].label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {MATRIX_ROWS.map((row,ri) => (
                    <tr key={ri} style={{ background:ri%2===0?"#fdfcf8":"#FBF5E6" }}>
                      <td style={{ padding:"5px 10px", fontSize:11, color:"#3A3530" }}>{row.label}</td>
                      {selected.map(id => {
                        let cls:string;
                        if ("k" in row) { cls=R[id].suspension?"ok":"ko"; }
                        else { cls=(row.vals as Record<string,string>)[id]??"na"; }
                        const f=FLAG[cls];
                        return <td key={id} style={{ padding:"4px 6px", fontSize:10, textAlign:"center", border:"1px solid #E8DFC8", background:f?.bg??"#F1EFE8", color:f?.color??"#5F5E5A", minWidth:65 }}>{f?.txt??"—"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop:".75rem", display:"flex", gap:"1rem", fontSize:10 }}>
              <span><span style={{ display:"inline-block", width:10, height:10, background:"#E1F5EE", border:"1px solid #9FE1CB", marginRight:4 }}/>Favorable</span>
              <span><span style={{ display:"inline-block", width:10, height:10, background:"#FBF5E6", border:"1px solid #F5E4B0", marginRight:4 }}/>Partiel</span>
              <span><span style={{ display:"inline-block", width:10, height:10, background:"#FCEBEB", border:"1px solid #F7C1C1", marginRight:4 }}/>Contraignant</span>
            </div>
          </div>
        )}

        {/* ── DETAIL ── */}
        {tab === "detail" && (
          <div style={{ padding:"1rem 1.25rem" }}>
            <div style={{ fontSize:9, letterSpacing:".14em", color:"#C9A84C", marginBottom:".75rem" }}>FICHE DÉTAILLÉE PAR RÉGIME</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:"1rem" }}>
              {selected.map(id => (
                <button key={id} onClick={()=>setDetailId(id)} style={{ padding:"5px 10px", fontSize:10, border:"1px solid #D4C8A8", borderLeft:`3px solid ${R[id].color}`, background:detailId===id?"#FBF5E6":"#fdfcf8", color:"#3A3530", cursor:"pointer" }}>{R[id].label} — {R[id].long}</button>
              ))}
            </div>
            {detailId && R[detailId] && (() => {
              const r=R[detailId]; const c=costs[detailId];
              return (
                <div style={{ borderLeft:`3px solid ${r.color}`, paddingLeft:"1rem" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:".75rem" }}>
                    <div style={{ padding:"3px 10px", background:r.color, color:"#fff", fontSize:10, fontWeight:500 }}>{r.label}</div>
                    <div style={{ fontSize:13, fontWeight:500, color:"#3A3530" }}>{r.long}</div>
                    <div style={{ fontSize:9, color:"#8A8078", marginLeft:"auto" }}>{r.art}</div>
                  </div>
                  <div style={{ fontSize:11, color:"#3A3530", lineHeight:1.65, marginBottom:".875rem", padding:".6rem .875rem", background:"#fdfcf8", border:"1px solid #E8DFC8" }}>{r.desc}</div>
                  <div style={{ background:`${r.color}1A`, border:`1px solid ${r.color}44`, padding:".65rem .875rem", marginBottom:".875rem" }}>
                    <div style={{ fontSize:9, letterSpacing:".1em", color:"#8A8078", marginBottom:3 }}>CONTRAINTE FINANCIÈRE SPÉCIFIQUE</div>
                    <div style={{ fontSize:12, fontWeight:500, color:"#3A3530" }}>{r.constraint_type}</div>
                    {!["Aucune","Aucune caution","Aucune à l'export"].includes(r.caution_type) && <div style={{ fontSize:11, color:"#8A8078", marginTop:2 }}>Caution : {r.caution_type}</div>}
                    {r.delai_jours && <div style={{ fontSize:11, color:"#E85D5D", fontWeight:500, marginTop:2 }}>DÉLAI MAXIMUM : {r.delai_jours} JOURS — vente aux enchères ADII au-delà</div>}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:".6rem", marginBottom:".875rem" }}>
                    {[["COÛT ESTIMÉ",`${fmt(c)} MAD`,r.color],["ÉCONOMIE / MAC",`${fmt(Math.max(0,macRef-c))} MAD`,"#4CAF7C"],["DÉLAI",r.delai,"#0A0A0A"]].map(([lbl2,val,col],i) => (
                      <div key={i} style={{ background:"#FBF5E6", border:"1px solid #F5E4B0", padding:".6rem" }}>
                        <div style={{ fontSize:9, letterSpacing:".1em", color:"#8A8078", marginBottom:2 }}>{lbl2}</div>
                        <div style={{ fontSize:i===2?12:18, fontWeight:500, color:col as string }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".75rem", marginBottom:".875rem" }}>
                    <div>
                      <div style={{ fontSize:9, letterSpacing:".12em", color:"#8A8078", marginBottom:4 }}>AVANTAGES</div>
                      {r.avantages.map((a,i) => <div key={i} style={{ display:"flex", gap:5, fontSize:11, color:"#3A3530", padding:"2px 0" }}><span style={{ color:"#4CAF7C", flexShrink:0 }}>✓</span>{a}</div>)}
                    </div>
                    <div>
                      <div style={{ fontSize:9, letterSpacing:".12em", color:"#8A8078", marginBottom:4 }}>POINTS D'ATTENTION</div>
                      {r.points.map((a,i) => <div key={i} style={{ display:"flex", gap:5, fontSize:11, color:"#3A3530", padding:"2px 0" }}><span style={{ color:"#E85D5D", flexShrink:0 }}>▲</span>{a}</div>)}
                    </div>
                  </div>
                  <div style={{ fontSize:9, letterSpacing:".12em", color:"#8A8078", marginBottom:4 }}>DOCUMENTS REQUIS</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {r.docs.map((d,i) => <span key={i} style={{ padding:"2px 8px", fontSize:10, background:"#FBF5E6", border:"1px solid #F5E4B0", color:"#854F0B" }}>{d}</span>)}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── RECO ── */}
        {tab === "reco" && (
          <div style={{ padding:"1rem 1.25rem" }}>
            {sorted.length === 0
              ? <div style={{ color:"#8A8078" }}>Sélectionnez des régimes dans la liste déroulante.</div>
              : (() => {
                  const best=R[sorted[0]]; const c=costs[sorted[0]];
                  return (
                    <>
                      <div style={{ background:"#0A0A0A", padding:"1rem", borderBottom:"2px solid #C9A84C", marginBottom:"1rem" }}>
                        <div style={{ fontSize:9, letterSpacing:".14em", color:"#C9A84C", marginBottom:3 }}>RECOMMANDATION Transit-IA</div>
                        <div style={{ fontSize:15, fontWeight:500, color:"#E8C97A", marginBottom:2 }}>{best.long}</div>
                        <div style={{ fontSize:11, color:"#8A8078" }}>Contrainte : {best.constraint_type}</div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:".75rem", marginBottom:"1rem" }}>
                        {[["COÛT OPTIMAL",`${fmt(c)} MAD`,"#C9A84C"],["ÉCONOMIE / MAC",`${fmt(Math.max(0,macRef-c))} MAD`,"#4CAF7C"],["RÉFÉRENCE",best.art,"#0A0A0A"]].map(([l,v,co],i) => (
                          <div key={i} style={{ background:"#FBF5E6", border:"1px solid #F5E4B0", padding:".75rem" }}>
                            <div style={{ fontSize:9, letterSpacing:".1em", color:"#8A8078", marginBottom:2 }}>{l}</div>
                            <div style={{ fontSize:i===2?13:20, fontWeight:500, color:co as string }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize:9, letterSpacing:".12em", color:"#C9A84C", marginBottom:".5rem" }}>CLASSEMENT — du moins au plus coûteux</div>
                      {sorted.map((id,i) => {
                        const pct=macRef>0?Math.round(costs[id]/macRef*100):0;
                        return (
                          <div key={id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                            <div style={{ minWidth:18, fontSize:10, fontWeight:500, color:"#8A8078" }}>{i+1}.</div>
                            <div style={{ minWidth:65, fontSize:10, color:"#3A3530" }}>{R[id].label}</div>
                            <div style={{ flex:1, background:"#E8DFC8", height:14, borderRadius:2, overflow:"hidden" }}>
                              <div style={{ width:`${Math.max(pct,1)}%`, height:"100%", background:R[id].color }}/>
                            </div>
                            <div style={{ minWidth:90, fontSize:10, fontWeight:500, color:"#0A0A0A", textAlign:"right" }}>{fmt(costs[id])} MAD</div>
                          </div>
                        );
                      })}
                      <div style={{ marginTop:"1rem", padding:".75rem", background:"#fdfcf8", border:"1px solid #E8DFC8" }}>
                        <div style={{ fontSize:9, letterSpacing:".1em", color:"#8A8078", marginBottom:4 }}>DOCUMENTS REQUIS — {best.long}</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                          {best.docs.map((d,i) => <span key={i} style={{ padding:"2px 8px", fontSize:10, background:"#FBF5E6", border:"1px solid #F5E4B0", color:"#854F0B" }}>{d}</span>)}
                        </div>
                      </div>
                    </>
                  );
                })()
            }
          </div>
        )}

        {/* Footer */}
        <div style={{ background:"#FBF5E6", borderTop:"1px solid #F5E4B0", padding:".55rem 1.25rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:10, color:"#8A8078" }}>Estimation indicative · CDII 2026 · Consultez votre transitaire agréé</div>
          <a href="/" style={{ padding:"5px 12px", background:"#0A0A0A", color:"#E8C97A", border:"none", fontSize:9, letterSpacing:".08em", textDecoration:"none" }}>← RETOUR ACCUEIL</a>
        </div>
      </div>
    </>
  );
}

