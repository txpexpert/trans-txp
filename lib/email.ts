// lib/email.ts
// ─────────────────────────────────────────────────────────────────────────────
// Premier service d'envoi d'email du projet — aucun n'existait avant
// (pages/api/contact.ts stockait juste en base, voir son commentaire).
// Utilise Resend (resend.com), standard pour les projets Next.js/Vercel.
//
// ── VARIABLES D'ENVIRONNEMENT REQUISES ──────────────────────────────────────
//   RESEND_API_KEY   — clé API Resend
//   RESEND_FROM      — adresse d'expédition, ex: "Import-IA <no-reply@import-ia.com>"
//                      Doit être un domaine vérifié dans Resend (pas gmail.com etc.)
//   NEXT_PUBLIC_SITE_URL — URL de base du site, ex: "https://import-ia.com"
//                      (utilisée pour construire le lien de vérification)
// ─────────────────────────────────────────────────────────────────────────────

const RESEND_API = 'https://api.resend.com/emails'

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[email] RESEND_API_KEY manquante — email non envoyé (to:', to, ')')
    return { ok: false, error: 'Service email non configuré' }
  }

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'Import-IA <no-reply@import-ia.com>',
      to,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[email] Échec envoi Resend:', err)
    return { ok: false, error: err }
  }
  return { ok: true }
}

export async function sendVerificationEmail(to: string, prenom: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/verify-email?token=${token}`

  const html = `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0A0A0A;">
      <div style="background: #0A0A0A; padding: 20px; text-align: center;">
        <span style="color: #E8C97A; font-family: Georgia, serif; font-size: 20px; letter-spacing: -0.5px;">IMPORT-EXPERT</span>
      </div>
      <div style="padding: 32px 24px;">
        <h1 style="font-size: 20px; font-weight: 500; margin: 0 0 16px;">Bienvenue${prenom ? ', ' + prenom : ''} 👋</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #3A3530;">
          Merci de vous être inscrit sur Import-IA. Pour activer votre essai gratuit de 14 jours,
          confirmez votre adresse email en cliquant sur le bouton ci-dessous.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background: #0A0A0A; color: #E8C97A; padding: 14px 28px; text-decoration: none; font-size: 13px; letter-spacing: 0.08em;">
            CONFIRMER MON EMAIL
          </a>
        </div>
        <p style="font-size: 12px; color: #8A8078; line-height: 1.6;">
          Ce lien est valable 48 heures. Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.
        </p>
        <p style="font-size: 12px; color: #8A8078; word-break: break-all;">
          Ou copiez ce lien dans votre navigateur : ${verifyUrl}
        </p>
      </div>
      <div style="border-top: 1px solid #E8DFC8; padding: 16px 24px; font-size: 11px; color: #8A8078;">
        © 2026 Import-IA
      </div>
    </div>
  `

  return sendEmail({ to, subject: 'Confirmez votre email — Import-IA', html })
}
