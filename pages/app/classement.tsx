// pages/app/classement.tsx
// Copie indépendante de pages/modules/classement.tsx pour l'espace mobile /app.
// ⚠️ Toute mise à jour de la page desktop (nouveaux chapitres, style, logique
// de recherche) doit être répercutée manuellement ici — c'est le compromis
// accepté pour une isolation complète (voir décision du 2026-08-28).

import type { GetServerSideProps } from 'next'
import { useState, useEffect, useCallback } from 'react'
import AppModuleLayout from '../../components/AppModuleLayout'
import { requireAppAccess } from '../../lib/appAccess'

// ── Types ───────────────────────────────────────────────────
interface Tarif {
  code_sh: string
  chapitre: string
  designation_clean: string
  taux_droit: number | null
  taux_raw: string | null
  unite_norm: string | null
  est_hierarchique: boolean
  est_feuille: boolean
  niveau: number
}

// ── Chapitres ───────────────────────────────────────────────
const CHAPITRES = [
  { code: '', label: 'Tous les chapitres' },
  { code: '01', label: "01 — Animaux vivants" },
  { code: '02', label: "02 — Viandes et abats comestibles" },
  { code: '03', label: "03 — Poissons et crustacés" },
  { code: '04', label: "04 — Lait, oeufs, miel" },
  { code: '05', label: "05 — Autres produits d'origine animale" },
  { code: '06', label: "06 — Plantes vivantes et fleurs" },
  { code: '07', label: "07 — Legumes" },
  { code: '08', label: "08 — Fruits comestibles" },
  { code: '09', label: "09 — Cafe, the, cacao, epices" },
  { code: '10', label: "10 — Cereales" },
  { code: '11', label: "11 — Produits de la minoterie" },
  { code: '12', label: "12 — Graines et fruits oleagineux" },
  { code: '13', label: "13 — Gommes, resines, extraits vegetaux" },
  { code: '14', label: "14 — Matieres a tresser" },
  { code: '15', label: "15 — Graisses et huiles animales/vegetales" },
  { code: '16', label: "16 — Viandes et poissons transformes" },
  { code: '17', label: "17 — Sucres et sucreries" },
  { code: '18', label: "18 — Cacao et preparations" },
  { code: '19', label: "19 — Produits de la boulangerie" },
  { code: '20', label: "20 — Legumes, fruits transformes" },
  { code: '21', label: "21 — Preparations alimentaires diverses" },
  { code: '22', label: "22 — Boissons, vinaigres" },
  { code: '23', label: "23 — Residus alimentaires" },
  { code: '24', label: "24 — Tabacs et substituts" },
  { code: '25', label: "25 — Sel, souffre, chaux, ciment" },
  { code: '26', label: "26 — Minerais, scories, cendres" },
  { code: '27', label: "27 — Combustibles mineraux, huiles" },
  { code: '28', label: "28 — Produits chimiques inorganiques" },
  { code: '29', label: "29 — Produits chimiques organiques" },
  { code: '30', label: "30 — Produits pharmaceutiques" },
  { code: '31', label: "31 — Engrais" },
  { code: '32', label: "32 — Extraits tannants, colorants" },
  { code: '33', label: "33 — Huiles essentielles, parfums" },
  { code: '34', label: "34 — Savons, detergents, cires" },
  { code: '35', label: "35 — Matieres proteiques, colles" },
  { code: '36', label: "36 — Poudres de projection, feux" },
  { code: '37', label: "37 — Produits photographiques" },
  { code: '38', label: "38 — Produits chimiques divers" },
  { code: '39', label: "39 — Matieres plastiques" },
  { code: '40', label: "40 — Caoutchouc et ouvrages" },
  { code: '41', label: "41 — Peaux et cuirs" },
  { code: '42', label: "42 — Ouvrages en cuir" },
  { code: '43', label: "43 — Fourrures et pelleteries" },
  { code: '44', label: "44 — Bois et ouvrages en bois" },
  { code: '45', label: "45 — Liege et ouvrages en liege" },
  { code: '46', label: "46 — Ouvrages en paille, alfa, jonc" },
  { code: '47', label: "47 — Pates de bois, papier" },
  { code: '48', label: "48 — Papier et carton" },
  { code: '49', label: "49 — Livres et imprimes" },
  { code: '50', label: "50 — Soie" },
  { code: '51', label: "51 — Laine et poils fins" },
  { code: '52', label: "52 — Coton" },
  { code: '53', label: "53 — Fibres textiles vegetales" },
  { code: '54', label: "54 — Files, fils, cordes synthetiques" },
  { code: '55', label: "55 — Files, fils de coton" },
  { code: '56', label: "56 — Fils, cordes de matieres textiles" },
  { code: '57', label: "57 — Tapis et couvertures" },
  { code: '58', label: "58 — Tissus speciaux, dentelle" },
  { code: '59', label: "59 — Tissus impregnes, enduits" },
  { code: '60', label: "60 — Tissus de velours, chaine" },
  { code: '61', label: "61 — Vetements et accessoires" },
  { code: '62', label: "62 — Vetements confectionnes" },
  { code: '63', label: "63 — Autres ouvrages textiles" },
  { code: '64', label: "64 — Chaussures" },
  { code: '65', label: "65 — Chapeaux et coiffures" },
  { code: '66', label: "66 — Parapluies et parasols" },
  { code: '67', label: "67 — Plumes, duvet, fleurs" },
  { code: '68', label: "68 — Pierre, platre, ciment" },
  { code: '69', label: "69 — Produits ceramiques" },
  { code: '70', label: "70 — Verre et ouvrages en verre" },
  { code: '71', label: "71 — Perles, metaux precieux" },
  { code: '72', label: "72 — Fer et acier" },
  { code: '73', label: "73 — Ouvrages en fer ou acier" },
  { code: '74', label: "74 — Cuivre et ouvrages" },
  { code: '75', label: "75 — Nickel et ouvrages" },
  { code: '76', label: "76 — Aluminium et ouvrages" },
  { code: '77', label: "77 — Metaux precieux non ferreux" },
  { code: '78', label: "78 — Plomb et ouvrages" },
  { code: '79', label: "79 — Zinc et ouvrages" },
  { code: '80', label: "80 — Etain et ouvrages" },
  { code: '81', label: "81 — Autres metaux communs" },
  { code: '82', label: "82 — Outils et articles en metaux" },
  { code: '83', label: "83 — Ouvrages divers en metaux" },
  { code: '84', label: "84 — Reacteurs nucleaires, machines" },
  { code: '85', label: "85 — Machines electriques et appareils" },
  { code: '86', label: "86 — Materiel de transport ferroviaire" },
  { code: '87', label: "87 — Vehicules automobiles" },
  { code: '88', label: "88 — Aeronefs et engins spatiaux" },
  { code: '89', label: "89 — Navires et structures flottantes" },
  { code: '90', label: "90 — Instruments optiques, medicaux" },
  { code: '91', label: "91 — Montres, horlogerie" },
  { code: '92', label: "92 — Instruments de musique" },
  { code: '93', label: "93 — Armes et munitions" },
  { code: '94', label: "94 — Meubles, literie" },
  { code: '95', label: "95 — Jouets, jeux, articles de sport" },
  { code: '96', label: "96 — Articles divers" },
  { code: '97', label: "97 — Objets d'art, antiquites" },
]

const PAGE_SIZE = 30

export default function Classement() {

  const [q, setQ] = useState('')
  const [chapitre, setChapitre] = useState('')
  const [results, setResults] = useState<Tarif[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, withTaux: 0 })

  useEffect(() => {
    fetch('/api/tarifs/stats')
      .then(r => r.json())
      .then(d => { if (!d.error) setStats({ total: d.total, withTaux: d.withTaux }) })
      .catch(console.error)
  }, [])

  const search = useCallback(async (newPage = 0) => {
    if (!q.trim() && !chapitre) return
    setLoading(true); setSearched(true); setError(null)
    const params = new URLSearchParams({
      q: q.trim(),
      ...(chapitre && { chapitre }),
      page: String(newPage),
    })
    try {
      const res = await fetch('/api/tarifs/search?' + params)
      const json = await res.json()
      if (json.error) { setError(json.error); setResults([]); setTotal(0) }
      else { setResults(json.data || []); setTotal(json.count || 0); setPage(newPage) }
    } catch { setError('Erreur de connexion') }
    finally { setLoading(false) }
  }, [q, chapitre])

  useEffect(() => {
    if (!q && !chapitre) return
    const t = setTimeout(() => search(0), 400)
    return () => clearTimeout(t)
  }, [q, chapitre, search])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const tauxBadge = (taux: number | null) => {
    if (taux === null) return <span style={{ color: 'var(--inkm)', fontSize: '11px' }}>-</span>
    const color = taux === 0 ? 'var(--ok)' : taux <= 10 ? 'var(--bd)' : taux <= 30 ? 'var(--warn)' : 'var(--danger)'
    return (
      <span style={{
        background: color + '18', color, border: '1px solid ' + color + '40',
        fontFamily: 'monospace', fontSize: '11px',
        padding: '2px 7px', borderRadius: '3px',
      }}>{taux}%</span>
    )
  }

  const fmtCode = (c: string) =>
    c.slice(0,4) + '.' + c.slice(4,6) + '.' + c.slice(6,8) + '.' + c.slice(8,10)

  return (
    <AppModuleLayout
      kicker="MODULE 05"
      title="Classement tarifaire et SH"
      sub="Faites vos recherches dans les 17 224 codes SH du tarif douanier marocain (dossier actualisé).">

      <div className="info-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="istat">
          <div className="istat-n">{stats.total.toLocaleString('fr-MA')}</div>
          <div className="istat-l">Codes SH indexes</div>
        </div>
        <div className="istat">
          <div className="istat-n">{stats.withTaux.toLocaleString('fr-MA')}</div>
          <div className="istat-l">Codes avec taux de droit</div>
        </div>
        <div className="istat">
          <div className="istat-n">97</div>
          <div className="istat-l">Chapitres couverts</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '.625rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          className="search-input"
          style={{ flex: 2, minWidth: '160px' }}
          placeholder="Code SH (ex: 8703) ou mot-cle (voiture, acier...)"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search(0)}
          autoComplete="off"
          spellCheck={false}
        />
        <select
          className="form-select"
          style={{ flex: 1, minWidth: '150px', maxWidth: '230px' }}
          value={chapitre}
          onChange={e => setChapitre(e.target.value)}>
          {CHAPITRES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
        <button
          className="btn btn-primary"
          onClick={() => search(0)}
          disabled={loading || (!q.trim() && !chapitre)}>
          {loading ? 'Recherche...' : 'Rechercher'}
        </button>
      </div>

      {!searched && (
        <div style={{
          color: 'var(--inkm)', fontSize: '13px', padding: '2.5rem',
          textAlign: 'center', border: '.5px solid var(--rule)', borderRadius: '6px',
        }}>
          Saisissez un code SH ou un mot-cle pour rechercher dans les 17 224 codes du tarif 2025.
        </div>
      )}

      {error && (
        <div style={{
          padding: '.75rem 1rem', marginBottom: '1rem',
          background: 'rgba(180,30,30,0.08)', border: '1px solid rgba(180,30,30,0.2)',
          borderLeft: '3px solid #B41E1E', borderRadius: '0 4px 4px 0',
          fontSize: '13px', color: '#B41E1E',
        }}>Erreur : {error}</div>
      )}

      {searched && !error && (
        <>
          <div style={{
            fontSize: '12px', color: 'var(--inkm)', marginBottom: '.75rem',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>{loading ? 'Recherche...' : total.toLocaleString('fr-MA') + ' resultat' + (total !== 1 ? 's' : '')}</span>
            {!loading && total > 0 && <span>Page {page + 1} / {totalPages || 1}</span>}
          </div>

          {results.length > 0 && (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '118px' }}>Code SH</th>
                    <th style={{ width: '42px' }}>Chap.</th>
                    <th>Designation</th>
                    <th style={{ width: '74px' }}>Taux</th>
                    <th style={{ width: '54px' }}>Unite</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.code_sh}
                      style={r.est_hierarchique && !r.est_feuille ? { background: 'var(--bl)', opacity: .85 } : {}}>
                      <td style={{ fontFamily: 'monospace', fontWeight: r.est_feuille ? 600 : 400, fontSize: '12px' }}>
                        {fmtCode(r.code_sh)}
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--inkm)', fontFamily: 'monospace' }}>
                        {r.chapitre}
                      </td>
                      <td style={{
                        fontSize: '12px',
                        fontWeight: r.est_hierarchique && !r.est_feuille ? 500 : 400,
                        maxWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }} title={r.designation_clean}>{r.designation_clean}</td>
                      <td style={{ textAlign: 'right' }}>{tauxBadge(r.taux_droit)}</td>
                      <td style={{ fontSize: '11px', color: 'var(--inkm)', fontFamily: 'monospace' }}>
                        {r.unite_norm != null ? r.unite_norm : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '.75rem', marginTop: '1rem', alignItems: 'center' }}>
                  <button className="btn btn-outline btn-sm"
                    disabled={page === 0 || loading}
                    onClick={() => search(page - 1)}>Precedent</button>
                  <span style={{ fontSize: '12px', color: 'var(--inkm)', flex: 1, textAlign: 'center' }}>
                    Page {page + 1} / {totalPages}
                  </span>
                  <button className="btn btn-outline btn-sm"
                    disabled={page >= totalPages - 1 || loading}
                    onClick={() => search(page + 1)}>Suivant</button>
                </div>
              )}
            </>
          )}

          {results.length === 0 && !loading && (
            <div style={{ color: 'var(--inkm)', padding: '2rem', textAlign: 'center', border: '.5px solid var(--rule)', borderRadius: '4px' }}>
              Aucun resultat. Essayez un code SH different ou un autre mot-cle.
            </div>
          )}
        </>
      )}

    </AppModuleLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const redirectTo = await requireAppAccess(context, 'classement')
  if (redirectTo) return { redirect: { destination: redirectTo, permanent: false } }
  return { props: {} }
}
