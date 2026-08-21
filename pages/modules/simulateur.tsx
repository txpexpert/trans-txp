import { useState, useCallback, useEffect } from "react";
import ForexWidget from "../../components/ForexWidget";

const DEVISES_DEFAULT = [
  { code: "EUR", label: "Euro",             rate: 10.85 },
  { code: "USD", label: "Dollar US",        rate: 9.97  },
  { code: "GBP", label: "Livre Sterling",   rate: 13.40 },
  { code: "CNY", label: "Yuan Chinois",     rate: 1.38  },
  { code: "SAR", label: "Riyal Saoudien",   rate: 2.65  },
  { code: "AED", label: "Dirham EAU",       rate: 2.71  },
  { code: "CAD", label: "Dollar Canadien",  rate: 7.20  },
  { code: "JPY", label: "Yen Japonais",     rate: 0.067 },
  { code: "CHF", label: "Franc Suisse",     rate: 11.20 },
  { code: "MAD", label: "Dirham (MAD)",     rate: 1.00  },
];

const fmt = (n) => isNaN(n) ? "—" : n.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const FRAIS_PRESETS = [
  { label: "Transit & honoraires", key: "transit", default: 1500 },
  { label: "Frais portuaires", key: "port", default: 2000 },
  { label: "Scanner / visite ADII", key: "scanner", default: 400 },
  { label: "Transport port → entrepôt", key: "transport", default: 1800 },
];


const SIM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap');
  :root { --gold:#C9A84C;--gold2:#E8C97A;--gold3:#F5E4B0;--gold4:#FBF5E6;--ink:#0A0A0A;--ink2:#3A3530;--ink3:#8A8078;--white:#FDFCF8;--border:#E8DFC8;--border2:#D4C8A8;--up:#4CAF7C;--dn:#E85D5D; }
  .sim-input { width:100%;padding:9px 12px;border:1px solid var(--border2);background:var(--white);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink);outline:none;transition:border-color .15s; }
  .sim-input:focus { border-color:var(--gold); }
  .sim-select { width:100%;padding:9px 12px;border:1px solid var(--border2);background:var(--white);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink);outline:none;cursor:pointer; }
  .sim-btn { padding:10px 24px;font-size:12px;letter-spacing:.08em;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;transition:all .15s; }
  .sim-btn-gold { background:var(--ink);color:var(--gold2); }
  .sim-btn-gold:hover { background:var(--gold);color:var(--ink); }
  .sim-btn-outline { background:transparent;border:1px solid var(--border2);color:var(--ink3); }
  .sim-btn-outline:hover { border-color:var(--gold);color:var(--gold);background:var(--gold4); }
  .result-row { display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--gold4); }
  .result-row:last-child { border:none; }
  .result-label { font-size:12px;color:var(--ink3); }
  .result-val { font-size:13px;font-weight:500;color:var(--ink);font-variant-numeric:tabular-nums; }
  .result-val.gold { color:var(--gold);font-size:15px; }
  .result-val.big { font-size:18px;color:var(--ink); }
  .section-title { font-size:9px;letter-spacing:.16em;color:var(--ink3);padding-bottom:6px;border-bottom:1px solid var(--border);margin-bottom:12px; }
  .tag { display:inline-block;padding:2px 8px;font-size:10px;letter-spacing:.08em;background:var(--gold4);border:1px solid var(--gold3);color:var(--ink2); }
  .cascade-line { display:flex;align-items:center;gap:8px;padding:5px 0;font-size:12px; }
  .cascade-op { color:var(--ink3);font-size:11px;min-width:18px;text-align:center; }
  .cascade-label { color:var(--ink2);flex:1; }
  .cascade-val { color:var(--ink);font-weight:500;font-variant-numeric:tabular-nums;min-width:100px;text-align:right;font-size:12px; }
  .cascade-val.accent { color:var(--gold); }
  .cascade-divider { border:none;border-top:1px solid var(--border);margin:4px 0; }
`

export default function Simulateur() {
  const [devises, setDevises] = useState(DEVISES_DEFAULT);

  // Sync taux live depuis /api/forex
  useEffect(() => {
    fetch('/api/forex')
      .then(r => r.json())
      .then(data => {
        if (!data?.rates) return;
        setDevises(prev => prev.map(d => {
          const live = data.rates.find((r: any) => r.pair === d.code);
          return live ? { ...d, rate: live.rate } : d;
        }));
      })
      .catch(() => {}); // garde les valeurs par défaut silencieusement
  }, []);

  const [shCode, setShCode] = useState("");
  const [shInfo, setShInfo] = useState(null);
  const [shLoading, setShLoading] = useState(false);
  const [shError, setShError] = useState("");
  const [shValidated, setShValidated] = useState(false); // SH confirmé → calcul autorisé

  const [fob, setFob] = useState("");
  const [devise, setDevise] = useState("EUR");
  const [assurance, setAssurance] = useState("");
  const [fret, setFret] = useState("");
  const [diTaux, setDiTaux] = useState("");
  const [ticTaux, setTicTaux] = useState("0");
  const [frais, setFrais] = useState({ transit: 1500, port: 2000, scanner: 400, transport: 1800 });
  const [tvaAssujetti, setTvaAssujetti] = useState(true);
  const [tvaRate, setTvaRate] = useState(20); // Art.99 CGI 2026 — 20% ou 10% uniquement
  const [computed, setComputed] = useState(null);

  const deviseObj = devises.find(d => d.code === devise) || devises[0];

  const lookupSH = useCallback(async () => {
    if (!shCode.trim()) return;
    setShLoading(true);
    setShError("");
    setShInfo(null);
    setShValidated(false);
    try {
      const res = await fetch(`/api/tariff?sh=${encodeURIComponent(shCode.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.results?.length) {
        setShError("Position non trouvée dans la nomenclature tarifaire. Vérifiez le code ou saisissez le taux manuellement.");
        return;
      }

      // Si plusieurs résultats (préfixe), afficher la liste pour que l'utilisateur choisisse
      if (data.results.length > 1) {
        setShInfo({ multiple: data.results });
      } else {
        const row = data.results[0];
        setShInfo({ designation: row.designation_clean, taux_droit: row.taux_droit, taux_raw: row.taux_raw, unite: row.unite_norm });
        setDiTaux(row.taux_droit != null ? String(row.taux_droit) : "");
        setTicTaux("0");
      }
    } catch {
      setShError("Erreur de connexion. Vérifiez que le serveur est démarré.");
    } finally {
      setShLoading(false);
    }
  }, [shCode]);

  const compute = () => {
    if (!shValidated) {
      alert("Veuillez d'abord saisir et confirmer le code SH et son taux avant de calculer.");
      return;
    }
    const fobVal = parseFloat(fob) || 0;
    const assuranceVal = parseFloat(assurance) || 0;
    const fretVal = parseFloat(fret) || 0;
    const diRate = parseFloat(diTaux) / 100 || 0;
    const ticRate = parseFloat(ticTaux) / 100 || 0;
    const rate = deviseObj.rate;

    const fob_mad = fobVal * rate;
    const assurance_mad = assuranceVal * rate;
    const fret_mad = fretVal * rate;
    const caf = fob_mad + assurance_mad + fret_mad;

    const di = caf * diRate;
    const tic = caf * ticRate;
    const pfi = caf * 0.0025; // PFI réel — Prélèvement Fiscal à l'Importation, 0,25% fixe du CAF (LF2023)
    const base_tva = caf + di + tic + pfi; // Art. 121 CGI 2026
    const tva = base_tva * (tvaRate / 100);

    const total_droits = di + tic + pfi + tva;
    const valeur_dedouanee = caf + di + tic + pfi + tva;

    const total_frais = Object.values(frais).reduce((a, b) => a + (Number(b) || 0), 0);
    // Coût de revient total à l'importation (frais locaux inclus) — distinct du PFI fiscal ci-dessus,
    // qui portait par erreur le même acronyme dans la version précédente de ce fichier.
    const prixRevientBrut = valeur_dedouanee + total_frais;
    const prixRevientNet = tvaAssujetti ? (caf + di + tic + pfi + total_frais) : prixRevientBrut;

    setComputed({ fob_mad, assurance_mad, fret_mad, caf, di, tic, pfi, base_tva, tva, total_droits, valeur_dedouanee, total_frais, prixRevientBrut, prixRevientNet, diRate, ticRate, tvaRate });
  };

  const reset = () => {
    setShCode(""); setShInfo(null); setShError(""); setShValidated(false);
    setFob(""); setAssurance(""); setFret("");
    setDiTaux(""); setTicTaux("0"); setComputed(null);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#FDFCF8", minHeight: "100vh", padding: "0 0 3rem" }}>
      <style dangerouslySetInnerHTML={{__html: SIM_CSS}} />

      {/* Header */}
      <div style={{ background: "var(--ink)", borderBottom: "2px solid var(--gold)", padding: "1.25rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#E8C97A", letterSpacing: "-.02em" }}>
            Douane<span style={{ color: "#C9A84C" }}>.</span>ia
          </div>
          <div style={{ fontSize: 11, letterSpacing: ".12em", color: "#8A8078", marginTop: 2 }}>SIMULATEUR DE DROITS & TAXES</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
  <a href="/" style={{ padding: "6px 14px", fontSize: 11, letterSpacing: ".08em", color: "#8A8078", border: "1px solid #D4C8A8", display: "flex", alignItems: "center", textDecoration: "none", fontFamily: "'DM Sans', sans-serif", transition: "all .15s" }}
    onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="#C9A84C"; (e.currentTarget as HTMLAnchorElement).style.color="#C9A84C" }}
    onMouseOut={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="#D4C8A8"; (e.currentTarget as HTMLAnchorElement).style.color="#8A8078" }}>
    ← ACCUEIL
  </a>
  <button className="sim-btn sim-btn-outline" style={{ fontSize: 11, padding: "6px 14px" }} onClick={reset}>RÉINITIALISER</button>
</div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 380px", gap: "2rem", alignItems: "start" }}>

        {/* COLONNE GAUCHE — Formulaire */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Bloc 1 — Code SH OBLIGATOIRE */}
          <div style={{ border: `2px solid ${shValidated ? "var(--up)" : "var(--gold)"}`, background: "var(--white)", padding: "1.25rem", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div className="section-title" style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}>
                01 — CODE SH / NOMENCLATURE TARIFAIRE
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {shValidated
                  ? <span style={{ fontSize: 11, color: "var(--up)", fontWeight: 500, letterSpacing: ".06em" }}>✓ CONFIRMÉ</span>
                  : <span style={{ fontSize: 10, color: "var(--gold)", letterSpacing: ".08em", background: "var(--gold4)", border: "1px solid var(--gold3)", padding: "2px 8px" }}>ÉTAPE OBLIGATOIRE</span>
                }
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="sim-input"
                placeholder="Ex : 8703.10 — Saisir le code de nomenclature tarifaire"
                value={shCode}
                onChange={e => { setShCode(e.target.value); setShValidated(false); setShInfo(null); setShError(""); }}
                onKeyDown={e => e.key === "Enter" && lookupSH()}
                style={{ flex: 1, borderColor: shValidated ? "var(--up)" : undefined }}
              />
              <button className="sim-btn sim-btn-gold" onClick={lookupSH} disabled={shLoading || !shCode.trim()} style={{ flexShrink: 0 }}>
                {shLoading ? "..." : "RECHERCHER →"}
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--ink3)", fontStyle: "italic" }}>
              Le code SH détermine le taux du droit d'importation applicable — il est obligatoire pour lancer le calcul.
            </div>

            {shInfo && !shInfo.multiple && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--gold4)", border: "1px solid var(--gold3)" }}>
                <div style={{ fontWeight: 500, color: "var(--ink2)", fontSize: 13 }}>{shInfo.designation}</div>
                {shInfo.taux_raw && <div style={{ color: "var(--ink3)", fontSize: 11, marginTop: 3 }}>Taux brut : {shInfo.taux_raw}{shInfo.unite ? ` — ${shInfo.unite}` : ""}</div>}
                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--ink3)", marginBottom: 4, letterSpacing: ".06em" }}>TAUX DI (%)</div>
                    <input className="sim-input" type="number" value={diTaux} onChange={e => { setDiTaux(e.target.value); setShValidated(false); }} style={{ fontSize: 13, fontWeight: 500 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--ink3)", marginBottom: 4, letterSpacing: ".06em" }}>TIC (%) — si applicable</div>
                    <input className="sim-input" type="number" value={ticTaux} onChange={e => { setTicTaux(e.target.value); setShValidated(false); }} />
                  </div>
                </div>
                {!shValidated && (
                  <button className="sim-btn sim-btn-gold" style={{ width: "100%", marginTop: 10, background: "var(--up)", letterSpacing: ".08em" }} onClick={() => setShValidated(true)}>
                    ✓ CONFIRMER CES TAUX ET CONTINUER LE CALCUL
                  </button>
                )}
                {shValidated && (
                  <div style={{ marginTop: 8, padding: "6px 10px", background: "#f0fdf4", border: "1px solid #86efac", fontSize: 11, color: "#16a34a", fontWeight: 500 }}>
                    ✓ Taux confirmés — DI : {diTaux}% · TIC : {ticTaux}% · TVA : {tvaRate}%
                  </div>
                )}
              </div>
            )}

            {shInfo?.multiple && (
              <div style={{ marginTop: 10, border: "1px solid var(--border2)", background: "var(--white)" }}>
                <div style={{ padding: "8px 12px", background: "var(--gold4)", borderBottom: "1px solid var(--gold3)", fontSize: 11, color: "var(--ink2)" }}>
                  Plusieurs positions trouvées — sélectionnez la ligne applicable :
                </div>
                {shInfo.multiple.map((row: any, i: number) => (
                  <div key={i} onClick={() => { setShInfo({ designation: row.designation_clean, taux_droit: row.taux_droit, taux_raw: row.taux_raw, unite: row.unite_norm }); setDiTaux(row.taux_droit != null ? String(row.taux_droit) : ""); setTicTaux("0"); }}
                    style={{ padding: "8px 12px", borderBottom: "1px solid var(--gold4)", cursor: "pointer", fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    onMouseOver={e => (e.currentTarget.style.background = "var(--gold4)")}
                    onMouseOut={e => (e.currentTarget.style.background = "")}>
                    <span><strong style={{ color: "var(--gold)" }}>{row.code_sh}</strong> — {row.designation_clean?.slice(0, 60)}</span>
                    <span style={{ fontWeight: 500, color: "var(--ink)", marginLeft: 12, flexShrink: 0 }}>{row.taux_droit ?? "—"}%</span>
                  </div>
                ))}
              </div>
            )}

            {shError && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#fff1f2", border: "1px solid #fecaca" }}>
                <div style={{ fontSize: 11, color: "var(--dn)", marginBottom: 6 }}>{shError}</div>
                <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 8 }}>
                  Saisissez manuellement les taux applicables, puis confirmez pour continuer.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--ink3)", marginBottom: 4 }}>TAUX DI (%)</div>
                    <input className="sim-input" type="number" placeholder="Ex: 25" value={diTaux} onChange={e => { setDiTaux(e.target.value); setShValidated(false); }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--ink3)", marginBottom: 4 }}>TIC (%) — si applicable</div>
                    <input className="sim-input" type="number" placeholder="0" value={ticTaux} onChange={e => { setTicTaux(e.target.value); setShValidated(false); }} />
                  </div>
                </div>
                {!shValidated && (
                  <button
                    className="sim-btn sim-btn-gold"
                    style={{ width: "100%", marginTop: 10, background: "var(--up)" }}
                    onClick={() => setShValidated(true)}
                    disabled={!diTaux}
                  >
                    ✓ CONFIRMER CES TAUX ET CONTINUER LE CALCUL
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Widget forex live — taux BAM en temps réel */}
          <ForexWidget compact pairs={['EUR','USD','GBP','CNY','SAR','AED']} />

          {/* Bloc 2 — Valeur FOB */}
          <div style={{ border: "1px solid var(--border)", background: "var(--white)", padding: "1.25rem" }}>
            <div className="section-title">02 — VALEUR FOB EN DEVISE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 8 }}>
              <input className="sim-input" type="number" placeholder="Montant FOB" value={fob} onChange={e => setFob(e.target.value)} />
              <select className="sim-select" value={devise} onChange={e => setDevise(e.target.value)}>
                {devises.map(d => <option key={d.code} value={d.code}>{d.code} — {d.label}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--ink3)" }}>
              Cours BAM : 1 {devise} = {deviseObj.rate.toFixed(4)} MAD
              {fob && <span style={{ marginLeft: 12, color: "var(--gold)", fontWeight: 500 }}>→ {fmt(parseFloat(fob) * deviseObj.rate)} MAD</span>}
            </div>
          </div>

          {/* Bloc 3 — Assurance & Fret */}
          <div style={{ border: "1px solid var(--border)", background: "var(--white)", padding: "1.25rem" }}>
            <div className="section-title">03 — ASSURANCE & FRET (en {devise})</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 5 }}>Assurance</div>
                <input className="sim-input" type="number" placeholder="Montant assurance" value={assurance} onChange={e => setAssurance(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 5 }}>Fret (transport international)</div>
                <input className="sim-input" type="number" placeholder="Coût fret" value={fret} onChange={e => setFret(e.target.value)} />
              </div>
            </div>
            {(fob || assurance || fret) && (
              <div style={{ marginTop: 10, padding: "8px 12px", background: "var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#8A8078", letterSpacing: ".06em" }}>VALEUR CAF EN MAD</span>
                <span style={{ fontSize: 18, fontWeight: 500, color: "var(--gold2)", fontVariantNumeric: "tabular-nums" }}>
                  {fmt(((parseFloat(fob)||0) + (parseFloat(assurance)||0) + (parseFloat(fret)||0)) * deviseObj.rate)} MAD
                </span>
              </div>
            )}
          </div>

          {/* Bloc 4 — Taux fiscaux */}
          <div style={{ border: "1px solid var(--border)", background: "var(--white)", padding: "1.25rem" }}>
            <div className="section-title">04 — TAUX FISCAUX APPLICABLES</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 5 }}>DI — Droit d'importation (%)</div>
                <input className="sim-input" type="number" placeholder="Ex: 25" value={diTaux} onChange={e => setDiTaux(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 5 }}>TIC — si applicable (%)</div>
                <input className="sim-input" type="number" placeholder="0" value={ticTaux} onChange={e => setTicTaux(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 5 }}>TVA — Art.99 CGI 2026</div>
                <select className="sim-select" value={tvaRate} onChange={e => setTvaRate(Number(e.target.value))}>
                  <option value={20}>20% — Taux normal</option>
                  <option value={10}>10% — Taux réduit (liste fermée Art.99-B)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bloc 4 — Frais accessoires */}
          <div style={{ border: "1px solid var(--border)", background: "var(--white)", padding: "1.25rem" }}>
            <div className="section-title">04 — FRAIS ACCESSOIRES (MAD)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {FRAIS_PRESETS.map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 5 }}>{f.label}</div>
                  <input className="sim-input" type="number" value={frais[f.key]} onChange={e => setFrais(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer", color: "var(--ink2)" }}>
                <input type="checkbox" checked={tvaAssujetti} onChange={e => setTvaAssujetti(e.target.checked)} />
                Entreprise assujettie à la TVA (TVA récupérable — non incluse dans le coût de revient net)
              </label>
            </div>
          </div>

          {!shValidated && (
            <div style={{ padding: "12px 16px", background: "#fff7ed", border: "1px solid #fdba74", fontSize: 12, color: "#c2410c", textAlign: "center" }}>
              Complétez et confirmez le code SH (étape 01) pour activer le calcul.
            </div>
          )}
          <button
            className="sim-btn sim-btn-gold"
            onClick={compute}
            disabled={!shValidated}
            style={{ width: "100%", padding: "14px", fontSize: 13, letterSpacing: ".1em", opacity: shValidated ? 1 : 0.45, cursor: shValidated ? "pointer" : "not-allowed" }}
          >
            {shValidated ? "CALCULER LES DROITS & TAXES →" : "⚠ CODE SH OBLIGATOIRE AVANT LE CALCUL"}
          </button>
        </div>

        {/* COLONNE DROITE — Résultats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "1rem" }}>

          {!computed && (
            <div style={{ border: "1px dashed var(--border2)", padding: "2rem 1.5rem", textAlign: "center" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--gold)", fontWeight: 300, marginBottom: 8 }}>Droits & Taxes</div>
              <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.6 }}>Remplissez les champs et cliquez sur Calculer pour obtenir la simulation complète.</div>
            </div>
          )}

          {computed && (
            <>
              {/* Cascade de calcul */}
              <div style={{ border: "1px solid var(--border)", background: "var(--white)", padding: "1.25rem" }}>
                <div className="section-title">CASCADE DE CALCUL</div>

                <div className="cascade-line"><span className="cascade-op">—</span><span className="cascade-label">Valeur FOB (MAD)</span><span className="cascade-val">{fmt(computed.fob_mad)}</span></div>
                <div className="cascade-line"><span className="cascade-op">+</span><span className="cascade-label">Assurance (MAD)</span><span className="cascade-val">{fmt(computed.assurance_mad)}</span></div>
                <div className="cascade-line"><span className="cascade-op">+</span><span className="cascade-label">Fret (MAD)</span><span className="cascade-val">{fmt(computed.fret_mad)}</span></div>
                <hr className="cascade-divider"/>
                <div className="cascade-line"><span className="cascade-op">=</span><span className="cascade-label" style={{fontWeight:500}}>Valeur CAF</span><span className="cascade-val accent">{fmt(computed.caf)}</span></div>

                <hr className="cascade-divider" style={{margin:"8px 0"}}/>

                <div className="cascade-line"><span className="cascade-op">×</span><span className="cascade-label">DI ({(computed.diRate*100).toFixed(0)}%)</span><span className="cascade-val">{fmt(computed.di)}</span></div>
                {computed.tic > 0 && <div className="cascade-line"><span className="cascade-op">×</span><span className="cascade-label">TIC ({(computed.ticRate*100).toFixed(0)}%)</span><span className="cascade-val">{fmt(computed.tic)}</span></div>}
                <div className="cascade-line"><span className="cascade-op">+</span><span className="cascade-label">PFI (0,25% fixe)</span><span className="cascade-val">{fmt(computed.pfi)}</span></div>
                <hr className="cascade-divider"/>
                <div className="cascade-line"><span className="cascade-op">=</span><span className="cascade-label">Base TVA</span><span className="cascade-val accent">{fmt(computed.base_tva)}</span></div>
                <div className="cascade-line"><span className="cascade-op">×</span><span className="cascade-label">TVA ({computed.tvaRate}%)</span><span className="cascade-val">{fmt(computed.tva)}</span></div>
              </div>

              {/* Synthèse droits */}
              <div style={{ border: "1px solid var(--border)", background: "var(--white)", padding: "1.25rem" }}>
                <div className="section-title">SYNTHÈSE DES DROITS</div>
                <div className="result-row"><span className="result-label">Droit d'importation (DI)</span><span className="result-val">{fmt(computed.di)} MAD</span></div>
                {computed.tic > 0 && <div className="result-row"><span className="result-label">TIC</span><span className="result-val">{fmt(computed.tic)} MAD</span></div>}
                <div className="result-row"><span className="result-label">PFI (Prélèvement Fiscal à l'Importation)</span><span className="result-val">{fmt(computed.pfi)} MAD</span></div>
                <div className="result-row"><span className="result-label">TVA à l'importation</span><span className="result-val">{fmt(computed.tva)} MAD</span></div>
                <div className="result-row" style={{paddingTop:10}}>
                  <span className="result-label" style={{fontWeight:500, color:"var(--ink2)"}}>Total droits & taxes</span>
                  <span className="result-val gold">{fmt(computed.total_droits)} MAD</span>
                </div>
              </div>

              {/* Valeur dédouanée */}
              <div style={{ background: "var(--ink)", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: ".12em", color: "#8A8078" }}>VALEUR DÉDOUANÉE</div>
                  <div style={{ fontSize: 11, color: "#5F5E5A", marginTop: 2 }}>CAF + DI + TIC + PFI + TVA</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 500, color: "#E8C97A", fontVariantNumeric: "tabular-nums" }}>{fmt(computed.valeur_dedouanee)} <span style={{fontSize:12}}>MAD</span></div>
              </div>

              {/* Coût de revient — anciennement "PFI" par erreur, renommé : ne pas confondre avec le PFI fiscal ci-dessus */}
              <div style={{ border: "1px solid var(--border)", background: "var(--white)", padding: "1.25rem" }}>
                <div className="section-title">PRIX DE REVIENT À L'IMPORTATION</div>
                <div className="result-row"><span className="result-label">Valeur dédouanée</span><span className="result-val">{fmt(computed.valeur_dedouanee)} MAD</span></div>
                <div className="result-row"><span className="result-label">Frais accessoires</span><span className="result-val">{fmt(computed.total_frais)} MAD</span></div>
                <div className="result-row" style={{paddingTop:10}}>
                  <span className="result-label" style={{fontWeight:500, color:"var(--ink2)"}}>Coût de revient brut (non-assujetti)</span>
                  <span className="result-val">{fmt(computed.prixRevientBrut)} MAD</span>
                </div>
                {tvaAssujetti && (
                  <div className="result-row">
                    <span className="result-label" style={{color:"var(--up)"}}>Coût de revient net (TVA récupérable)</span>
                    <span className="result-val" style={{color:"var(--up)"}}>{fmt(computed.prixRevientNet)} MAD</span>
                  </div>
                )}
              </div>

              {/* Ratio charges */}
              <div style={{ border: "1px solid var(--gold3)", background: "var(--gold4)", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: 10, letterSpacing: ".12em", color: "var(--ink3)", marginBottom: 8 }}>RATIOS DE CHARGE</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 500, color: "var(--ink)" }}>{computed.caf > 0 ? ((computed.total_droits / computed.caf) * 100).toFixed(1) : "—"}%</div>
                    <div style={{ fontSize: 10, color: "var(--ink3)" }}>Charges / CAF</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 500, color: "var(--ink)" }}>{computed.caf > 0 ? (computed.prixRevientBrut / computed.caf).toFixed(3) : "—"}</div>
                    <div style={{ fontSize: 10, color: "var(--ink3)" }}>Coeff. multiplicateur</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    {/* Note légale */}
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem 2rem" }}>
      <div style={{ borderTop: "1px solid #fecaca", paddingTop: "1rem", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ color: "#dc2626", fontWeight: 500, fontSize: 13, flexShrink: 0 }}>N.B :</span>
        <p style={{ fontSize: 12, color: "#dc2626", lineHeight: 1.65, margin: 0 }}>
          Cet outil de simulation fournit des valeurs à titre indicatif pour comparaison et prévision.
          Il est rappelé que les droits et taxes à acquitter correspondront exclusivement à ceux liquidés
          par les services douaniers au moment de la mise à la consommation.
        </p>
      </div>
    </div>

  </div>
  );
}
