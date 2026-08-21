import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

const PROFILS = [
  { value: 'transitaire',         label: 'Transitaire / Agent en douane' },
  { value: 'importateur',         label: 'Importateur / Exportateur PME' },
  { value: 'directeur_logistique',label: 'Directeur logistique' },
  { value: 'consultant',          label: 'Cabinet conseil douanier' },
  { value: 'autre',               label: 'Autre' },
]

export default function Register() {
  const router = useRouter()

  const [form, setForm] = useState({
    email: '', password: '', confirm: '',
    nom: '', prenom: '', societe: '', profil: 'transitaire',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    setError('')
    if (!form.email || !form.password) { setError('Email et mot de passe requis'); return }
    if (form.password.length < 8) { setError('Mot de passe trop court (8 caractères minimum)'); return }
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas'); return }

    setLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:   form.email,
          password: form.password,
          nom:     form.nom,
          prenom:  form.prenom,
          societe: form.societe,
          profil:  form.profil,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur lors de l\'inscription'); setLoading(false); return }
      router.push('/mon-compte?welcome=1')
    } catch {
      setError('Erreur réseau — réessayez')
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Inscription — Transit-IA</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: `
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--gold:#C9A84C;--gold2:#E8C97A;--gold3:#F5E4B0;--gold4:#FBF5E6;
          --ink:#0A0A0A;--ink2:#3A3530;--ink3:#8A8078;--white:#FDFCF8;
          --border:#E8DFC8;--border2:#D4C8A8;--red:#C0392B;--green:#1E7A46}
        body{font-family:'DM Sans',sans-serif;background:var(--white);color:var(--ink);min-height:100vh}
        a{text-decoration:none;color:inherit}
        input,select{font-family:'DM Sans',sans-serif}
        .field{margin-bottom:.875rem}
        .label{display:block;font-size:11px;letter-spacing:.08em;color:var(--ink3);margin-bottom:.35rem}
        .inp{width:100%;padding:.7rem 1rem;border:1px solid var(--border2);background:var(--white);font-size:13px;color:var(--ink);outline:none;transition:border-color .15s}
        .inp:focus{border-color:var(--gold)}
      ` }} />

      {/* Header */}
      <header style={{ background: 'var(--ink)', borderBottom: '2px solid var(--gold)', padding: '0 2rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, color: 'var(--gold2)', letterSpacing: '-.02em' }}>
          Douane<span style={{ color: 'var(--gold)' }}>.</span>ia
        </Link>
        <span style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--ink3)' }}>INSCRIPTION GRATUITE</span>
      </header>

      <main style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Badge essai */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: 'var(--gold4)', border: '1px solid var(--gold3)', padding: '.6rem 1rem', marginBottom: '1.5rem', fontSize: 13 }}>
            <span style={{ color: 'var(--gold)', fontSize: 16 }}>✦</span>
            <span><strong style={{ color: 'var(--gold)' }}>7 jours d'accès complet offerts</strong> — sans carte bancaire</span>
          </div>

          <div style={{ border: '1px solid var(--border)', background: 'var(--white)' }}>

            <div style={{ padding: '1.5rem 2rem 1rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 400, color: 'var(--ink)', marginBottom: '.2rem' }}>
                Rejoindre <span style={{ color: 'var(--gold)' }}>Transit-IA</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Plateforme d'intelligence douanière marocaine</div>
            </div>

            <div style={{ padding: '1.5rem 2rem' }}>
              {error && (
                <div style={{ padding: '.75rem 1rem', background: '#FEE2E2', border: '1px solid #FECACA', color: 'var(--red)', fontSize: 13, marginBottom: '1rem' }}>
                  ⚠ {error}
                </div>
              )}

              {/* Ligne prénom / nom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div className="field">
                  <label className="label">PRÉNOM</label>
                  <input className="inp" type="text" placeholder="Mohamed" value={form.prenom} onChange={set('prenom')} />
                </div>
                <div className="field">
                  <label className="label">NOM</label>
                  <input className="inp" type="text" placeholder="Alami" value={form.nom} onChange={set('nom')} />
                </div>
              </div>

              <div className="field">
                <label className="label">EMAIL PROFESSIONNEL *</label>
                <input className="inp" type="email" placeholder="m.alami@entreprise.ma" value={form.email} onChange={set('email')} autoComplete="email" />
              </div>

              <div className="field">
                <label className="label">SOCIÉTÉ / CABINET</label>
                <input className="inp" type="text" placeholder="ATLAS TRANSIT SARL" value={form.societe} onChange={set('societe')} />
              </div>

              <div className="field">
                <label className="label">PROFIL MÉTIER</label>
                <select className="inp" value={form.profil} onChange={set('profil')} style={{ cursor: 'pointer' }}>
                  {PROFILS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div className="field">
                  <label className="label">MOT DE PASSE *</label>
                  <input className="inp" type="password" placeholder="8 caractères min." value={form.password} onChange={set('password')} autoComplete="new-password" />
                </div>
                <div className="field">
                  <label className="label">CONFIRMER</label>
                  <input className="inp" type="password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
                </div>
              </div>

              {/* Indicateur force mot de passe */}
              {form.password.length > 0 && (
                <div style={{ marginBottom: '.875rem' }}>
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2, transition: 'width .3s',
                      width: form.password.length >= 12 ? '100%' : form.password.length >= 8 ? '60%' : '30%',
                      background: form.password.length >= 12 ? 'var(--green)' : form.password.length >= 8 ? 'var(--gold)' : 'var(--red)',
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 3 }}>
                    {form.password.length < 8 ? 'Trop court' : form.password.length < 12 ? 'Correct' : 'Fort'}
                  </div>
                </div>
              )}

              <button
                onClick={submit} disabled={loading}
                style={{ width: '100%', padding: '13px', background: loading ? 'var(--ink3)' : 'var(--ink)', color: 'var(--gold2)', border: 'none', fontSize: 12, letterSpacing: '.1em', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'CRÉATION DU COMPTE...' : 'DÉMARRER MON ESSAI GRATUIT →'}
              </button>

              <div style={{ marginTop: '.875rem', textAlign: 'center', fontSize: 12, color: 'var(--ink3)' }}>
                Déjà inscrit ?{' '}
                <Link href="/auth/login" style={{ color: 'var(--gold)', fontWeight: 500 }}>Se connecter</Link>
              </div>
            </div>
          </div>

          {/* Ce qui est inclus */}
          <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', border: '1px solid var(--border)', background: 'var(--gold4)', fontSize: 12, color: 'var(--ink2)' }}>
            <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '.5rem', fontSize: 13 }}>Inclus dans l'essai gratuit 7 jours :</div>
            {['Accès complet à tous les modules (30+)', 'Simulateur droits & taxes MAD', 'Comparateur 9 régimes douaniers', 'Chat IA sur circulaires ADII', 'Intelligence à l\'Export — DDP 12 pays', 'Screening sanctions & OEA'].map(item => (
              <div key={item} style={{ display: 'flex', gap: '.5rem', marginBottom: '.3rem' }}>
                <span style={{ color: 'var(--gold)' }}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink3)' }}>
        <span>© 2026 Transit-IA</span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="#">Mentions légales</Link>
          <Link href="#">Confidentialité</Link>
        </div>
      </footer>
    </>
  )
}
