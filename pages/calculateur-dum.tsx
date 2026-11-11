// pages/calculateur-dum.tsx — « L'argent laissé sur la table » : à partir d'un export
// de DUM (CSV), estime les droits récupérables (accords préférentiels non utilisés,
// taux supérieurs au tarif) et repère les taux anormalement bas (risque de redressement).
// Page publique : les données restent dans le navigateur, seuls les codes SH sont envoyés.
import Link from 'next/link'
import { useState } from 'react'
import SiteShell from '../components/SiteShell'
import { analyser, codePays, Colonnes, devinerColonnes, EXEMPLE_CSV, Ligne, lireCsv, nombre } from '../lib/calculateurDum'

const dh = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' DH'
const fmtSh = (c: string) => (c.length === 10 ? `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6, 8)}.${c.slice(8)}` : c)
const CHAMPS: { k: keyof Colonnes; l: string; requis?: boolean }[] = [
  { k: 'code', l: 'Code SH', requis: true }, { k: 'pays', l: 'Pays d’origine', requis: true },
  { k: 'valeur', l: 'Valeur en douane (MAD)', requis: true }, { k: 'droits', l: 'Droit d’importation payé (MAD)', requis: true },
  { k: 'taux', l: 'Taux appliqué (%)' }, { k: 'dum', l: 'N° de DUM' }, { k: 'designation', l: 'Désignation' },
]
const CAT: Record<string, [string, string]> = {
  probable: ['Préférence non utilisée', 'p'], a_etudier: ['Préférence à étudier', 'e'],
  ecart_haut: ['Taux supérieur au tarif', 'h'], ecart_bas: ['Taux inférieur au tarif', 'b'],
}

export default function CalculateurDum() {
  const [etape, setEtape] = useState<1 | 2 | 3>(1)
  const [lignes, setLignes] = useState<string[][]>([])
  const [col, setCol] = useState<Colonnes | null>(null)
  const [res, setRes] = useState<Ligne[] | null>(null)
  const [ignorees, setIgnorees] = useState(0)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [nomFichier, setNomFichier] = useState('')

  function charger(texte: string, nom: string) {
    setErr(''); setRes(null)
    const l = lireCsv(texte)
    if (l.length < 2) return setErr('Le fichier ne contient pas de lignes exploitables. Enregistrez votre export Excel au format CSV.')
    setLignes(l); setCol(devinerColonnes(l[0])); setNomFichier(nom); setEtape(2)
  }
  function fichier(f: File | undefined) {
    if (!f) return
    if (/\.xlsx?$/i.test(f.name)) return setErr('Fichier Excel : ouvrez-le, puis « Enregistrer sous » au format CSV (séparateur point-virgule), et chargez le CSV.')
    if (f.size > 8e6) return setErr('Fichier trop volumineux (8 Mo maximum).')
    const r = new FileReader(); r.onload = () => charger(String(r.result || ''), f.name); r.readAsText(f, 'utf-8')
  }
  function modele() {
    const blob = new Blob(['﻿' + EXEMPLE_CSV.split('\n')[0] + '\n'], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'modele-export-dum.csv'; a.click()
  }

  async function calculer() {
    if (!col) return
    const manque = CHAMPS.filter(c => c.requis && col[c.k] < 0)
    if (manque.length) return setErr(`Indiquez la colonne : ${manque.map(m => m.l).join(', ')}.`)
    setErr(''); setBusy(true)
    try {
      const corps = lignes.slice(1)
      const brutes = corps.map((r, i) => ({
        n: i + 2, code: String(r[col.code] || '').replace(/[^0-9]/g, ''),
        iso: codePays(r[col.pays] || ''), valeur: nombre(r[col.valeur]) ?? 0, droits: nombre(r[col.droits]) ?? 0,
        tauxApplique: col.taux >= 0 ? nombre(r[col.taux]) : null,
        dum: col.dum >= 0 ? String(r[col.dum] || '') : '', designation: col.designation >= 0 ? String(r[col.designation] || '') : '',
      }))
      const valides = brutes.filter(b => b.code.length >= 6 && b.valeur > 0)
      setIgnorees(brutes.length - valides.length)
      if (!valides.length) { setErr('Aucune ligne exploitable : vérifiez les colonnes Code SH et Valeur.'); return }
      const r = await fetch('/api/calculateur/taux', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codes: valides.map(v => v.code) }) })
      const j = await r.json()
      if (!r.ok) { setErr(j.error || 'Analyse impossible'); return }
      setRes(valides.map(v => analyser({ ...v, tauxTarif: j.taux?.[v.code]?.taux ?? null })))
      setEtape(3)
    } catch { setErr('Erreur réseau, réessayez.') } finally { setBusy(false) }
  }

  const somme = (l: Ligne[], k: 'gain' | 'risque' | 'droits' | 'valeur') => l.reduce((s, x) => s + x[k], 0)
  const par = (c: string) => (res || []).filter(x => x.categorie === c)
  const probable = par('probable'), etudier = par('a_etudier'), haut = par('ecart_haut'), bas = par('ecart_bas')
  const signalees = (res || []).filter(x => x.categorie).sort((a, z) => (z.gain + z.risque) - (a.gain + a.risque))
  const sansPays = (res || []).filter(x => !x.iso).length

  return (
    <SiteShell title="Argent laissé sur la table : analyse de vos DUM | IXP-Import-eXPert" description="Chargez l’export de vos déclarations : estimez les droits récupérables grâce aux accords préférentiels et repérez les taux à risque.">
      <section className="x-hero" style={{ paddingBottom: 18 }}>
        <div className="x-wrap">
          <div className="x-eyebrow">Calculateur · Gratuit</div>
          <h1 className="x-h1 x-h1-sm">L’argent laissé <em>sur la table</em></h1>
          <p className="x-lead">Chargez l’export de vos déclarations (DUM) : en une minute, vous savez combien de droits d’importation vous avez payés alors qu’un accord préférentiel pouvait les supprimer, et quelles lignes présentent un taux à risque.</p>
          <p className="x-disclaimer">Vos fichiers restent dans votre navigateur : seuls les codes SH sont envoyés, pour lire leur taux dans le tarif 2026.</p>
        </div>
      </section>
      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap" style={{ display: 'grid', gap: 18 }}>
          <ol className="x-ff-steps">
            {['Charger l’export', 'Vérifier les colonnes', 'Résultat'].map((t, i) => <li key={t} className={etape === i + 1 ? 'on' : etape > i + 1 ? 'ok' : ''}><button type="button" onClick={() => (i + 1 < etape) && setEtape((i + 1) as any)}>{i + 1}. {t}</button></li>)}
          </ol>
          {err && <p className="x-ff-err">{err}</p>}

          {etape === 1 && (
            <div className="x-ff">
              <label className="x-cd-drop">
                <input type="file" accept=".csv,.txt,.xls,.xlsx" onChange={e => fichier(e.target.files?.[0])} />
                <b>Choisir un fichier CSV</b>
                <span>Export de vos DUM sur 12 à 48 mois : une ligne par article, avec code SH, pays d’origine, valeur en douane et droit d’importation payé.</span>
              </label>
              <div className="x-ff-nav">
                <button type="button" className="x-btn x-btn-dark" onClick={() => charger(EXEMPLE_CSV, 'exemple.csv')}>Essayer avec un exemple</button>
                <button type="button" className="x-btn x-btn-line" onClick={modele}>Télécharger le modèle de colonnes</button>
              </div>
              <p className="x-ff-note">Depuis Excel : Fichier › Enregistrer sous › CSV (séparateur point-virgule). Les nombres au format français (1 234,56) sont acceptés.</p>
            </div>
          )}

          {etape === 2 && col && (
            <div className="x-ff">
              <p style={{ marginTop: 0 }}><b>{nomFichier}</b> · {lignes.length - 1} ligne{lignes.length > 2 ? 's' : ''}. Vérifiez la colonne correspondant à chaque information :</p>
              <div className="x-ff-grid">
                {CHAMPS.map(c => (
                  <label key={c.k}>{c.l}{c.requis ? ' *' : ''}
                    <select value={col[c.k]} onChange={e => setCol({ ...col, [c.k]: Number(e.target.value) })}>
                      <option value={-1}>{c.requis ? 'Choisir…' : 'Absente'}</option>
                      {lignes[0].map((h, i) => <option key={i} value={i}>{h || `Colonne ${i + 1}`}</option>)}
                    </select></label>))}
              </div>
              <div className="x-cd-apercu"><table className="x-fl"><thead><tr>{lignes[0].map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
                <tbody>{lignes.slice(1, 4).map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody></table></div>
              <div className="x-ff-nav">
                <button type="button" className="x-btn x-btn-line" onClick={() => setEtape(1)}>← Autre fichier</button>
                <button type="button" className="x-btn x-btn-dark" disabled={busy} onClick={calculer}>{busy ? 'Analyse…' : 'Calculer'}</button>
              </div>
            </div>
          )}

          {etape === 3 && res && (
            <>
              <div className="x-cd-kpi">
                <div className="big"><span>Droits potentiellement récupérables</span><b>{dh(somme(probable, 'gain') + somme(haut, 'gain'))}</b>
                  <small>{probable.length} ligne{probable.length > 1 ? 's' : ''} avec une préférence non utilisée · {haut.length} taux supérieur{haut.length > 1 ? 's' : ''} au tarif</small></div>
                <div><span>À étudier</span><b>{dh(somme(etudier, 'gain'))}</b><small>produits agricoles, textiles : préférences partielles</small></div>
                <div className="risk"><span>Exposition à justifier</span><b>{dh(somme(bas, 'risque'))}</b><small>{bas.length} ligne{bas.length > 1 ? 's' : ''} sous le taux du tarif</small></div>
              </div>
              <p className="x-ff-note" style={{ margin: 0 }}>{res.length} lignes analysées · {dh(somme(res, 'valeur'))} de valeur en douane · {dh(somme(res, 'droits'))} de droits d’importation payés{ignorees ? ` · ${ignorees} ligne(s) ignorée(s) (code ou valeur manquants)` : ''}{sansPays ? ` · ${sansPays} pays non reconnu(s) : utilisez le code ISO à deux lettres` : ''}.</p>

              {signalees.length > 0 ? (
                <div className="x-cd-tab"><table className="x-fl"><thead><tr><th>Ligne</th><th>Produit</th><th>Code SH</th><th>Origine</th><th>Constat</th><th style={{ textAlign: 'right' }}>Montant</th></tr></thead><tbody>
                  {signalees.slice(0, 60).map(x => (
                    <tr key={x.n}>
                      <td>{x.dum || `L${x.n}`}</td><td>{x.designation || '—'}</td><td className="mono">{fmtSh(x.code)}</td>
                      <td>{x.iso || '?'}{x.accord ? <small className="x-cd-acc">{x.accord}</small> : null}</td>
                      <td><span className={`x-cd-cat c-${CAT[x.categorie!][1]}`}>{CAT[x.categorie!][0]}</span><small className="x-cd-note">{x.note}</small></td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{dh(x.gain || x.risque)}</td>
                    </tr>))}
                </tbody></table></div>
              ) : <div className="x-fl-empty">Aucune ligne ne ressort : préférences utilisées et taux conformes au tarif 2026 sur cet export.</div>}

              <div className="x-pc-cta">
                <p><b>Passer de l’estimation à la récupération.</b> L’essai Pro vérifie l’origine produit par produit et émet un dossier défendable ; un expert vous dit ce qui est récupérable et dans quels délais.</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Link href="/auth/register?plan=pro" className="x-btn x-btn-gold">Essai 14 jours</Link>
                  <Link href="/contact?sujet=calculateur-dum" className="x-btn x-btn-line" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}>Parler à un expert</Link>
                </div>
              </div>
              <p className="x-note">Estimation d’aide à la décision. La préférence suppose une origine prouvée (certificat ou déclaration d’origine) et le respect des règles de l’accord ; les droits déjà acquittés ne sont récupérables que dans les conditions et délais prévus par la réglementation. Les autres taxes (TVA, TPI) ne sont pas comptées. Les données finales sont celles édictées par les autorités compétentes.</p>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  )
}
