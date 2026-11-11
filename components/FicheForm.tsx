// components/FicheForm.tsx
// Création guidée d'une fiche produit en trois écrans : produit, classement,
// origine-valeur-conformité. Chaque écran est enregistré : la fiche existe dès le
// premier écran, et chaque rubrique remplie valide un module de l'étape Qualifier.
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

type F = Record<string, any>
const DOCS_DEFAUT = [
  { nom: 'Facture commerciale', statut: 'obligatoire' },
  { nom: 'Titre de transport', statut: 'obligatoire' },
  { nom: 'Déclaration unique de marchandises (DUM)', statut: 'obligatoire' },
  { nom: 'Fiche technique du produit, à l’appui du classement', statut: 'recommande' },
]
const ACCORDS = ['aucun', 'Union européenne (accord d’association)', 'AELE', 'Royaume-Uni', 'Turquie', 'Accord d’Agadir', 'États-Unis', 'Émirats arabes unis', 'Zone arabe de libre-échange (GZALE)', 'Autre accord']
const INCOTERMS = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP']
const ETAPES = ['Le produit', 'Le classement', 'Origine, valeur et conformité']

export default function FicheForm({ initiale }: { initiale?: F }) {
  const router = useRouter()
  const [f, setF] = useState<F>(() => ({
    devise: 'MAD', prochaine_revue: 'Loi de finances 2027', documents: DOCS_DEFAUT,
    autres_taxes: [{ nom: 'Taxe parafiscale à l’importation (TPI)', taux: 0.25 }],
    ...(initiale || {}),
  }))
  const [ecran, setEcran] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [tarifs, setTarifs] = useState<any[]>([])
  const [decisions, setDecisions] = useState<any[] | null>(null)
  const [nouveauDoc, setNouveauDoc] = useState('')
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  const inp = (k: string, props: any = {}) => <input value={f[k] ?? ''} onChange={e => set(k, e.target.value)} {...props} />

  async function enregistrer(suite: 'suivant' | 'fin') {
    setErr('')
    if (!f.designation) { setErr('La désignation est obligatoire.'); setEcran(0); return }
    setBusy(true)
    try {
      const r = await fetch(f.id ? `/api/fiches/${f.id}` : '/api/fiches', {
        method: f.id ? 'PUT' : 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
      })
      const j = await r.json()
      if (!r.ok) { setErr(j.error || 'Enregistrement impossible'); return }
      setF(j.fiche)
      if (suite === 'fin') router.push(`/fiches/${j.fiche.id}`)
      else setEcran(e => Math.min(e + 1, 2))
    } catch { setErr('Erreur réseau, réessayez.') } finally { setBusy(false) }
  }

  async function chercherTarif() {
    const code = String(f.code_sh || '').replace(/[^0-9]/g, '')
    if (code.length < 4) { setErr('Saisissez au moins 4 chiffres du code SH.'); return }
    setErr(''); setTarifs([])
    const r = await fetch(`/api/tariff?sh=${code}`)
    const j = await r.json().catch(() => null)
    const rows: any[] = Array.isArray(j?.results) ? j.results.filter((t: any) => t.est_feuille !== false) : []
    if (!r.ok || !rows.length) { setErr('Aucune position trouvée pour ce code. Utilisez le module Classement pour le rechercher.'); return }
    setTarifs(rows)
  }
  function choisirTarif(t: any) {
    setF(p => ({ ...p, code_sh: t.code_sh, libelle_tarif: t.libelle_complet || t.designation_clean, taux_droit: t.taux_droit, unite_tarif: t.unite_norm || p.unite_tarif }))
    setTarifs([])
  }
  async function chercherDecisions() {
    const code = String(f.code_sh || '').replace(/[^0-9]/g, '')
    if (!code) { setErr('Retenez d’abord un code SH.'); return }
    const r = await fetch(`/api/decisions/search?q=${code.slice(0, 6)}`, { credentials: 'same-origin' })
    const j = await r.json().catch(() => null)
    setDecisions(r.ok ? j?.data || [] : [])
  }

  const docs: any[] = f.documents || []
  const setDoc = (i: number, k: string, v: string) => set('documents', docs.map((d, j) => (j === i ? { ...d, [k]: v } : d)))
  const taxes: any[] = f.autres_taxes || []
  const setTaxe = (i: number, k: string, v: any) => set('autres_taxes', taxes.map((t, j) => (j === i ? { ...t, [k]: v } : t)))

  return (
    <div className="x-ff">
      <ol className="x-ff-steps">
        {ETAPES.map((t, i) => <li key={t} className={i === ecran ? 'on' : i < ecran ? 'ok' : ''}><button type="button" onClick={() => (f.id || i === 0) && setEcran(i)}>{i + 1}. {t}</button></li>)}
      </ol>
      {err && <p className="x-ff-err">{err}</p>}

      {ecran === 0 && (
        <div className="x-ff-grid">
          <label className="wide">Désignation commerciale *{inp('designation', { placeholder: 'Ex. : Compteur d’énergie intelligent monophasé' })}</label>
          <label>Référence interne (votre code article){inp('ref_interne', { placeholder: 'Ex. : ART-10452' })}</label>
          <label>Lien vers une photo du produit{inp('photo_url', { placeholder: 'https://…' })}</label>
          <label className="wide">Description technique (matière, fonction, usage)
            <textarea rows={3} value={f.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Ce qui permet de classer le produit : composition, fonctionnement, usage." /></label>
          <label>Poids net unitaire (kg){inp('poids_net_kg', { inputMode: 'decimal' })}</label>
          <label>Poids brut unitaire (kg){inp('poids_brut_kg', { inputMode: 'decimal' })}</label>
          <label>Quantité type par commande{inp('quantite_type', { inputMode: 'decimal', placeholder: 'Ex. : 500' })}</label>
          <label>Unité{inp('unite_tarif', { placeholder: 'Ex. : u, kg, l' })}</label>
        </div>
      )}

      {ecran === 1 && (
        <div className="x-ff-grid">
          <label>Code SH (10 chiffres, ou début du code){inp('code_sh', { inputMode: 'numeric', placeholder: 'Ex. : 9028301090' })}</label>
          <div className="x-ff-act"><button type="button" className="x-btn x-btn-line x-btn-sm" onClick={chercherTarif}>Vérifier dans le tarif 2026</button>
            <Link href="/modules/classement" target="_blank" className="x-ff-link">Je ne connais pas le code : module Classement ↗</Link></div>
          {tarifs.length > 0 && (
            <ul className="x-ff-pick wide">{tarifs.map(t => (
              <li key={t.code_sh}><button type="button" onClick={() => choisirTarif(t)}><b>{t.code_sh}</b> {t.libelle_complet || t.designation_clean} · <b>{t.taux_raw ?? t.taux_droit} %</b>{t.unite_norm ? ` · ${t.unite_norm}` : ''}</button></li>))}</ul>
          )}
          {f.libelle_tarif && <p className="x-ff-ok wide">Position retenue : <b>{f.code_sh}</b> · {f.libelle_tarif} · droit de <b>{f.taux_droit} %</b></p>}
          <label className="wide">Décision de classement
            <div className="x-ff-row">
              <button type="button" className="x-btn x-btn-line x-btn-sm" onClick={chercherDecisions}>Chercher les décisions pour ce code</button>
              <label className="x-ff-chk"><input type="checkbox" checked={f.decision_ref === 'aucune'} onChange={e => set('decision_ref', e.target.checked ? 'aucune' : null)} /> Aucune décision applicable</label>
            </div>
          </label>
          {decisions && (decisions.length ? (
            <ul className="x-ff-pick wide">{decisions.map(d => (
              <li key={d.circulaire + d.designation}><button type="button" onClick={() => { set('decision_ref', d.circulaire); if (!f.justification && d.resume) set('justification', d.resume.slice(0, 400)) }}>
                <b>Circulaire n° {d.circulaire}</b> · {d.designation} · {d.code_sh}</button></li>))}</ul>
          ) : <p className="x-ff-note wide">Aucune décision publiée pour ce code. Cochez « Aucune décision applicable ».</p>)}
          {f.decision_ref && f.decision_ref !== 'aucune' && <p className="x-ff-ok wide">Décision rattachée : circulaire n° <b>{f.decision_ref}</b></p>}
          <label className="wide">Justification du classement
            <textarea rows={3} value={f.justification ?? ''} onChange={e => set('justification', e.target.value)} placeholder="Ex. : Règles générales interprétatives 1 et 6 ; produit présenté monté, avec boîtier." /></label>
        </div>
      )}

      {ecran === 2 && (
        <div className="x-ff-grid">
          <h4 className="wide">Origine</h4>
          <label>Fournisseur{inp('fournisseur')}</label>
          <label>Pays d’origine{inp('pays_origine', { placeholder: 'Ex. : Chine' })}</label>
          <label>Accord préférentiel
            <select value={f.accord ?? ''} onChange={e => set('accord', e.target.value || null)}>
              <option value="">Choisir…</option>{ACCORDS.map(a => <option key={a} value={a}>{a === 'aucun' ? 'Aucun : droit commun' : a}</option>)}</select></label>
          <label>Preuve d’origine
            <select value={f.preuve_origine ?? ''} onChange={e => set('preuve_origine', e.target.value || null)}>
              <option value="">Choisir…</option>
              {['Certificat EUR.1', 'Déclaration d’origine sur facture', 'Certificat d’origine non préférentiel', 'Aucune'].map(a => <option key={a}>{a}</option>)}</select></label>

          <h4 className="wide">Valeur</h4>
          <label>Valeur unitaire{inp('valeur_unitaire', { inputMode: 'decimal' })}</label>
          <label>Devise
            <select value={f.devise ?? 'MAD'} onChange={e => set('devise', e.target.value)}>{['MAD', 'EUR', 'USD', 'CNY', 'GBP', 'TRY', 'AED'].map(d => <option key={d}>{d}</option>)}</select></label>
          <label>Incoterm
            <select value={f.incoterm ?? ''} onChange={e => set('incoterm', e.target.value || null)}><option value="">Choisir…</option>{INCOTERMS.map(d => <option key={d}>{d}</option>)}</select></label>
          <label>Fret jusqu’à la frontière (par commande){inp('fret', { inputMode: 'decimal' })}</label>
          <label>Assurance (par commande){inp('assurance', { inputMode: 'decimal' })}</label>
          <label>Redevances ou commissions à ajouter{inp('redevances', { placeholder: 'Ex. : redevance de marque 5 %' })}</label>

          <h4 className="wide">Conformité</h4>
          <label>Produit soumis au contrôle MIC ?
            <select value={f.controle_mic ?? ''} onChange={e => set('controle_mic', e.target.value || null)}>
              <option value="">Choisir…</option><option value="oui">Oui</option><option value="non">Non</option><option value="a_verifier">À vérifier</option></select></label>
          <label>Marchandise dangereuse ?
            <select value={f.dangereuse ?? ''} onChange={e => set('dangereuse', e.target.value || null)}>
              <option value="">Choisir…</option><option value="oui">Oui</option><option value="non">Non</option></select></label>
          <label>Marquage et étiquetage
            <select value={f.marquage ?? ''} onChange={e => set('marquage', e.target.value || null)}>
              <option value="">Choisir…</option><option value="conforme">Vérifié, conforme</option><option value="a_faire">À faire</option></select></label>

          <div className="wide">
            <h4>Documents</h4>
            {docs.map((d, i) => (
              <div className="x-ff-doc" key={i}>
                <input value={d.nom} onChange={e => setDoc(i, 'nom', e.target.value)} />
                <select value={d.statut} onChange={e => setDoc(i, 'statut', e.target.value)}>
                  <option value="obligatoire">Obligatoire</option><option value="a_verifier">À vérifier</option><option value="recommande">Recommandé</option></select>
                <button type="button" onClick={() => set('documents', docs.filter((_, j) => j !== i))} aria-label="Retirer">✕</button>
              </div>
            ))}
            <div className="x-ff-doc">
              <input value={nouveauDoc} onChange={e => setNouveauDoc(e.target.value)} placeholder="Ajouter un document (licence, certificat…)" />
              <button type="button" className="x-btn x-btn-line x-btn-sm" onClick={() => { if (nouveauDoc.trim()) { set('documents', [...docs, { nom: nouveauDoc.trim(), statut: 'obligatoire' }]); setNouveauDoc('') } }}>Ajouter</button>
            </div>
          </div>

          <div className="wide">
            <h4>Autres taxes à l’importation</h4>
            {taxes.map((t, i) => (
              <div className="x-ff-doc" key={i}>
                <input value={t.nom} onChange={e => setTaxe(i, 'nom', e.target.value)} />
                <input value={t.taux ?? ''} onChange={e => setTaxe(i, 'taux', e.target.value)} inputMode="decimal" style={{ maxWidth: 110 }} placeholder="Taux %" />
                <button type="button" onClick={() => set('autres_taxes', taxes.filter((_, j) => j !== i))} aria-label="Retirer">✕</button>
              </div>
            ))}
            <button type="button" className="x-btn x-btn-line x-btn-sm" onClick={() => set('autres_taxes', [...taxes, { nom: 'Taxe intérieure de consommation (TIC)', taux: '' }])}>Ajouter une taxe (TIC, autre)</button>
            <p className="x-ff-note">La TVA à l’importation (20 %) est calculée automatiquement. TPI de 0,25 % : note n° D7106/16/ADII/100 ; retirez-la si le produit en est exonéré.</p>
          </div>

          <label className="wide">Notes{inp('notes')}</label>
          <label>Prochaine revue{inp('prochaine_revue')}</label>
        </div>
      )}

      <div className="x-ff-nav">
        {ecran > 0 && <button type="button" className="x-btn x-btn-line" onClick={() => setEcran(e => e - 1)}>← Retour</button>}
        {ecran < 2
          ? <button type="button" className="x-btn x-btn-dark" disabled={busy} onClick={() => enregistrer('suivant')}>{busy ? 'Enregistrement…' : 'Enregistrer et continuer →'}</button>
          : <button type="button" className="x-btn x-btn-dark" disabled={busy} onClick={() => enregistrer('fin')}>{busy ? 'Enregistrement…' : 'Enregistrer la fiche'}</button>}
        {f.id && ecran < 2 && <button type="button" className="x-btn x-btn-line" disabled={busy} onClick={() => enregistrer('fin')}>Enregistrer et voir la fiche</button>}
      </div>
    </div>
  )
}
