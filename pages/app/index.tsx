// pages/app/index.tsx
// Écran d'accueil de l'espace mobile, en 3 temps :
//  1) Splash — logo animé façon radar (ouverture 1.5s + maintien 1.5s)
//  2) Hero — MondoScope (outil marketing) intégré, avec la tuile
//     "Accès aux modules" en haut
//  3) Modules — la liste des 8 outils, affichée seulement après clic sur
//     la tuile "Accès aux modules"
//
// ✅ Affichage de session : bandeau "Connecté en tant que : xxx", visible
// sur les écrans hero et modules (pas pendant le splash).

import { useState, useEffect } from 'react'
import Link from 'next/link'

const modules = [
  { label: 'Copilote IA',                href: '/app/copilote', icon: '🎙️', highlight: true },
  { label: 'Classement tarifaire',       href: '/app/classement' },
  { label: 'Décisions de classement',    href: '/app/decisions-classement' },
  { label: 'FAQ — Espace Expert',        href: '/app/faq' },
  { label: 'Glossaire douanier',         href: '/api/app-content/glossaire' },
  { label: 'Substances dangereuses',     href: '/api/app-content/substances-dangereuses' },
  { label: 'Marquage & warnings',        href: '/api/app-content/marquage-warnings' },
  { label: 'Calculateur conteneurs',     href: '/api/app-content/calc-conteneurs' },
  { label: 'Calculateur colis SRE',      href: '/api/app-content/calc-colis-sre' },
]

interface SessionInfo {
  email: string
  plan: string
}

type Phase = 'splash' | 'hero' | 'modules'

export default function AppHome() {
  const [phase, setPhase] = useState<Phase>('splash')
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => (res.ok ? res.json() : null))
      .then(data => setSession(data ? { email: data.email, plan: data.plan } : null))
      .catch(() => setSession(null))
      .finally(() => setChecked(true))
  }, [])

  // Splash : ouverture du logo 1.5s + maintien 1.5s = 3s au total,
  // puis transition (fondu CSS) vers l'écran hero.
  useEffect(() => {
    const timer = setTimeout(() => setPhase('hero'), 3000)
    return () => clearTimeout(timer)
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.reload()
  }

  // ── Écran 1 : Splash radar ──────────────────────────────────────────────
  if (phase === 'splash') {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0B2455',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 24,
      }}>
        <div style={{ position: 'relative', width: 140, height: 140 }}>
          {/* Anneaux de pulsation façon radar */}
          <div className="radar-ring" style={{ animationDelay: '0s' }} />
          <div className="radar-ring" style={{ animationDelay: '0.5s' }} />
          <div className="radar-ring" style={{ animationDelay: '1s' }} />

          {/* Disque radar avec balayage rotatif */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(21,62,130,0.4) 0%, rgba(21,62,130,0.1) 70%)',
            border: '2px solid rgba(255,255,255,0.25)',
            animation: 'radarOpen 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            overflow: 'hidden',
          }}>
            <div className="radar-sweep" />
          </div>

          {/* Logo TXP au centre */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            animation: 'logoFadeIn 1.5s ease forwards',
            opacity: 0,
          }}>
            <span style={{
              fontFamily: 'sans-serif', fontWeight: 800, fontSize: 28,
              color: '#fff', letterSpacing: 1,
            }}>
              TXP
            </span>
          </div>
        </div>

        <div style={{
          color: '#fff', fontSize: 14, fontWeight: 600, letterSpacing: 2,
          animation: 'logoFadeIn 1.5s ease forwards', opacity: 0,
        }}>
          TRANSIT-EXPERT
        </div>

        <style>{`
          @keyframes radarOpen {
            0%   { transform: scale(0);   opacity: 0; }
            100% { transform: scale(1);   opacity: 1; }
          }
          @keyframes logoFadeIn {
            0%   { opacity: 0; transform: translateY(6px); }
            60%  { opacity: 0; }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes ringPulse {
            0%   { transform: scale(0.3); opacity: 0.8; }
            100% { transform: scale(1.8); opacity: 0; }
          }
          @keyframes sweepRotate {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          .radar-ring {
            position: absolute; inset: 0; border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.5);
            animation: ringPulse 1.5s ease-out infinite;
          }
          .radar-sweep {
            position: absolute; inset: 0;
            background: conic-gradient(from 0deg, rgba(255,255,255,0.35), transparent 40%);
            border-radius: 50%;
            animation: sweepRotate 1.5s linear infinite;
          }
        `}</style>
      </div>
    )
  }

  // ── Bandeau de session, partagé entre les écrans hero et modules ────────
  const sessionBanner = checked && (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: session ? '#EBF7EE' : '#F2F0EA',
      border: `1px solid ${session ? '#B0DDB8' : '#E4E2DA'}`,
      borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12.5,
    }}>
      <span style={{ color: session ? '#1E7A4A' : '#8A8078' }}>
        {session ? <>Connecté en tant que : <strong>{session.email}</strong></> : 'Non connecté'}
      </span>
      {session ? (
        <button onClick={logout} style={{
          background: 'none', border: 'none', color: '#1E7A4A', fontSize: 12.5,
          textDecoration: 'underline', cursor: 'pointer', padding: 0,
        }}>
          Se déconnecter
        </button>
      ) : (
        <Link href="/app/login" style={{ color: '#153E82', fontSize: 12.5, fontWeight: 600 }}>
          Se connecter
        </Link>
      )}
    </div>
  )

  // ── Écran 2 : Hero MondoScope + tuile d'accès aux modules ───────────────
  if (phase === 'hero') {
    return (
      <div style={{
        minHeight: '100vh', background: '#F5F7FA',
        animation: 'fadeIn 0.4s ease',
      }}>
        <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>

        <div style={{ padding: '16px 16px 0' }}>
          {sessionBanner}

          <button
            onClick={() => setPhase('modules')}
            style={{
              display: 'block', width: '100%', padding: 16, borderRadius: 10,
              background: '#153E82', color: '#fff', border: 'none',
              fontWeight: 700, fontSize: 15, marginBottom: 14, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(21,62,130,0.25)',
            }}
          >
            Accès aux modules →
          </button>
        </div>

        <iframe
          src="/tools/mondoscope-mobile.html"
          title="MondoScope — Veille stratégique"
          style={{
            width: '100%',
            height: 'calc(100vh - 130px)',
            border: 'none',
            display: 'block',
          }}
        />
      </div>
    )
  }

  // ── Écran 3 : liste des 8 modules (état actuel, inchangé) ───────────────
  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', minHeight: '100vh', background: '#E4EDFB' }}>

      {sessionBanner}

      <button
        onClick={() => setPhase('hero')}
        style={{
          background: 'none', border: 'none', color: '#153E82', fontSize: 12.5,
          fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        ← MondoScope
      </button>

      <h1 style={{ color: '#153E82', fontSize: 22, marginBottom: 4, fontWeight: 700 }}>
        Transit-eXPert
      </h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
        Outils douaniers — accès mobile
      </p>
      <div style={{ display: 'grid', gap: 12 }}>
        {modules.map(m => (
          <Link key={m.href} href={m.href} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: 16, borderRadius: 10,
            background: m.highlight ? '#F5EDE0' : '#fff',
            color: m.highlight ? '#6B4A1E' : '#1C1C1C',
            textDecoration: 'none',
            fontWeight: 600,
            border: m.highlight ? '1px solid #B8863A66' : '1px solid #153E8222',
            boxShadow: m.highlight ? '0 2px 8px rgba(139,94,24,.18)' : '0 2px 8px rgba(21,62,130,.12)',
          }}>
            {m.icon && <span style={{ fontSize: 20, lineHeight: 1 }}>{m.icon}</span>}
            {m.label}
          </Link>
        ))}
      </div>
    </div>
  )
}