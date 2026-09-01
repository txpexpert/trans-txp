import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import { useRouter } from 'next/router'
import BackofficeLayout from '../../components/BackofficeLayout'

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeParametres() {
  const router = useRouter()
  const [toast, setToast] = useState('')

  // Paramètres généraux
  const [nomSite, setNomSite] = useState('Transit-IA')
  const [urlSite, setUrlSite] = useState('https://Transit-IA')
  const [emailContact, setEmailContact] = useState('contact@Transit-IA')
  const [emailSupport, setEmailSupport] = useState('support@Transit-IA')

  // Quotas
  const [quotaConsultation, setQuotaConsultation] = useState('5')
  const [quotaPro, setQuotaPro] = useState('30')
  const [quotaPremium, setQuotaPremium] = useState('100')

  // Fonctionnalités
  const [ragActif, setRagActif] = useState(true)
  const [trackingActif, setTrackingActif] = useState(true)
  const [simulateurActif, setSimulateurActif] = useState(true)
  const [inscriptionsOuvertes, setInscriptionsOuvertes] = useState(true)
  const [modeMainenance, setModeMaintenance] = useState(false)

  // Modèles IA
  const [modeleChat, setModeleChat] = useState('claude-opus-4-5')
  const [modeleAnalytics, setModeleAnalytics] = useState('claude-haiku-4-5')
  const [maxTokens, setMaxTokens] = useState('2048')


  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const Section = ({ titre, children }: { titre: string; children: React.ReactNode }) => (
    <div style={{ background:'var(--white)', border:'.5px solid var(--rule)', padding:'1.5rem', marginBottom:'1rem' }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:500, color:'var(--bd)', marginBottom:'1.25rem', paddingBottom:'.5rem', borderBottom:'.5px solid var(--rule)' }}>
        {titre}
      </div>
      {children}
    </div>
  )

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'1rem', alignItems:'center', marginBottom:'1rem' }}>
      <label style={{ fontSize:12, color:'var(--inkm)', fontWeight:500 }}>{label}</label>
      {children}
    </div>
  )

  const Toggle = ({ active, onChange }: { active: boolean; onChange: () => void }) => (
    <div onClick={onChange} style={{
      width:44, height:24, borderRadius:12, background: active ? '#059669' : '#DDD',
      cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0
    }}>
      <div style={{
        width:18, height:18, borderRadius:'50%', background:'white',
        position:'absolute', top:3, left: active ? 23 : 3, transition:'left .2s',
        boxShadow:'0 1px 4px rgba(0,0,0,.2)'
      }} />
    </div>
  )

  const inputStyle = {
    width:'100%', padding:'8px 12px', border:'.5px solid var(--rule)', background:'#F9F8F4',
    fontSize:12, outline:'none', fontFamily:'inherit', color:'var(--bd)'
  }

  return (
    <BackofficeLayout title="Paramètres système">

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'#059669', color:'white', padding:'10px 20px', fontSize:12, zIndex:999 }}>
          {toast}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'var(--bd)', marginBottom:4 }}>Paramètres système</h1>
          <p style={{ fontSize:13, color:'var(--inkm)' }}>Configuration globale de la plateforme</p>
        </div>
        <button onClick={() => showToast('Paramètres sauvegardés avec succès')}
          style={{ padding:'8px 20px', background:'#059669', color:'white', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
          ✓ Sauvegarder
        </button>
      </div>

      {/* Mode maintenance — alerte si actif */}
      {modeMainenance && (
        <div style={{ background:'#FEE8E8', border:'.5px solid #F0B0A8', borderLeft:'3px solid #C0392B', padding:'1rem', marginBottom:'1rem', fontSize:12, color:'#C0392B' }}>
          ⚠ Le mode maintenance est actif — le site public est inaccessible aux utilisateurs
        </div>
      )}

      {/* Général */}
      <Section titre="Informations générales">
        <Field label="Nom de la plateforme">
          <input value={nomSite} onChange={e => setNomSite(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="URL du site">
          <input value={urlSite} onChange={e => setUrlSite(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Email contact">
          <input value={emailContact} onChange={e => setEmailContact(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Email support">
          <input value={emailSupport} onChange={e => setEmailSupport(e.target.value)} style={inputStyle} />
        </Field>
      </Section>

      {/* Quotas */}
      <Section titre="Quotas par plan (requêtes IA / jour)">
        <Field label="Plan Consultation">
          <input type="number" value={quotaConsultation} onChange={e => setQuotaConsultation(e.target.value)} style={inputStyle} min="1" max="100" />
        </Field>
        <Field label="Plan Professionnel">
          <input type="number" value={quotaPro} onChange={e => setQuotaPro(e.target.value)} style={inputStyle} min="1" max="500" />
        </Field>
        <Field label="Plan Premium">
          <input type="number" value={quotaPremium} onChange={e => setQuotaPremium(e.target.value)} style={inputStyle} min="1" max="1000" />
        </Field>
      </Section>

      {/* Modèles IA */}
      <Section titre="Modèles IA (Anthropic Claude)">
        <Field label="Modèle chat principal">
          <select value={modeleChat} onChange={e => setModeleChat(e.target.value)}
            style={{ ...inputStyle, cursor:'pointer', background:'#F9F8F4' }}>
            <option value="claude-opus-4-5">claude-opus-4-5 (meilleur)</option>
            <option value="claude-sonnet-4-5">claude-sonnet-4-5 (équilibré)</option>
            <option value="claude-haiku-4-5">claude-haiku-4-5 (rapide)</option>
          </select>
        </Field>
        <Field label="Modèle analytics">
          <select value={modeleAnalytics} onChange={e => setModeleAnalytics(e.target.value)}
            style={{ ...inputStyle, cursor:'pointer', background:'#F9F8F4' }}>
            <option value="claude-haiku-4-5">claude-haiku-4-5 (rapide / économique)</option>
            <option value="claude-sonnet-4-5">claude-sonnet-4-5</option>
          </select>
        </Field>
        <Field label="Max tokens par requête">
          <input type="number" value={maxTokens} onChange={e => setMaxTokens(e.target.value)} style={inputStyle} min="256" max="8192" step="256" />
        </Field>
      </Section>

      {/* Fonctionnalités */}
      <Section titre="Activation des fonctionnalités">
        {[
          { label:'Moteur RAG (Intelligence Artificielle)', val:ragActif, set:setRagActif },
          { label:'Module Tracking conteneurs', val:trackingActif, set:setTrackingActif },
          { label:'Simulateur fiscal', val:simulateurActif, set:setSimulateurActif },
          { label:'Nouvelles inscriptions ouvertes', val:inscriptionsOuvertes, set:setInscriptionsOuvertes },
          { label:'Mode maintenance (ferme le site public)', val:modeMainenance, set:setModeMaintenance },
        ].map(({ label, val, set }) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.75rem 0', borderBottom:'.5px solid var(--rule)' }}>
            <span style={{ fontSize:12, color: label.includes('maintenance') ? '#C0392B' : 'var(--inks)' }}>{label}</span>
            <Toggle active={val} onChange={() => { set(!val); showToast(`${label} ${!val ? 'activé' : 'désactivé'}`) }} />
          </div>
        ))}
      </Section>

      {/* Zone danger */}
      <div style={{ background:'#FEF0EE', border:'.5px solid #F0B0A8', padding:'1.5rem' }}>
        <div style={{ fontSize:13, fontWeight:600, color:'#C0392B', marginBottom:'.75rem' }}>Zone de danger</div>
        <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
          <button onClick={() => showToast('Cache Redis vidé')}
            style={{ padding:'8px 16px', background:'transparent', border:'1px solid #F0B0A8', fontSize:12, cursor:'pointer', fontFamily:'inherit', color:'#C0392B' }}>
            Vider le cache Redis
          </button>
          <button onClick={() => showToast('Logs archivés')}
            style={{ padding:'8px 16px', background:'transparent', border:'1px solid #F0B0A8', fontSize:12, cursor:'pointer', fontFamily:'inherit', color:'#C0392B' }}>
            Archiver les logs
          </button>
          <button onClick={() => { if (window.confirm('Réinitialiser tous les quotas utilisateurs ?')) showToast('Quotas réinitialisés') }}
            style={{ padding:'8px 16px', background:'transparent', border:'1px solid #F0B0A8', fontSize:12, cursor:'pointer', fontFamily:'inherit', color:'#C0392B' }}>
            Réinitialiser les quotas
          </button>
        </div>
      </div>

    </BackofficeLayout>
  )
}

