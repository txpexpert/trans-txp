// lib/email.ts
// ─────────────────────────────────────────────────────────────────────────────
// Premier service d'envoi d'email du projet — aucun n'existait avant
// (pages/api/contact.ts stockait juste en base, voir son commentaire).
// Utilise Resend (resend.com), standard pour les projets Next.js/Vercel.
//
// ── VARIABLES D'ENVIRONNEMENT REQUISES ──────────────────────────────────────
//   RESEND_API_KEY   — clé API Resend
//   RESEND_FROM      — adresse d'expédition, ex: "Import-eXPert <no-reply@import-ia.com>"
//                      Doit être un domaine vérifié dans Resend (pas gmail.com etc.)
//   NEXT_PUBLIC_SITE_URL — URL de base du site, ex: "https://import-ia.com"
//                      (utilisée pour construire le lien de vérification)
//   RESEND_FROM_BILLING — expéditeur des documents de facturation (facultatif),
//                      ex: "RIGORIS LEX — Abonnements <abonnement@rigorislex.ma>"
//                      (domaine rigorislex.ma à vérifier dans Resend). À défaut : RESEND_FROM.
//   BILLING_ADMIN_EMAIL — destinataire des alertes « justificatif déposé » (facultatif).
// ─────────────────────────────────────────────────────────────────────────────

const RESEND_API = 'https://api.resend.com/emails'

export async function sendEmail({ to, subject, html, from, replyTo, headers }: {
  to: string | string[]; subject: string; html: string; from?: string; replyTo?: string; headers?: Record<string, string>
}) {
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
      from: from || process.env.RESEND_FROM || 'Import-eXPert <no-reply@import-ia.com>',
      to,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(headers ? { headers } : {}),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[email] Échec envoi Resend:', err)
    return { ok: false, error: err }
  }
  return { ok: true }
}

export async function sendVerificationEmail(to: string, prenom: string, token: string, langue: 'fr' | 'ar' = 'fr') {
  if (langue === 'ar') return sendVerificationEmailAr(to, prenom, token)
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/verify-email?token=${token}`

  const html = `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0A0A0A;">
      <div style="background: #0A0A0A; padding: 20px; text-align: center;">
        <span style="color: #E8C97A; font-family: Georgia, serif; font-size: 20px; letter-spacing: -0.5px;">IMPORT-EXPERT</span>
      </div>
      <div style="padding: 32px 24px;">
        <h1 style="font-size: 20px; font-weight: 500; margin: 0 0 16px;">Bienvenue${prenom ? ', ' + prenom : ''} 👋</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #3A3530;">
          Merci de vous être inscrit sur Import-eXPert. Pour activer votre essai gratuit de 14 jours,
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
        © 2026 Import-eXPert
      </div>
    </div>
  `

  return sendEmail({ to, subject: 'Confirmez votre email — Import-eXPert', html })
}

// Version arabe : inscription faite depuis l'interface arabe (/ar/inscription) ou langue arabe choisie
async function sendVerificationEmailAr(to: string, prenom: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/verify-email?token=${token}&langue=ar`
  const esc = (v: string) => v.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
  const html = `
    <div dir="rtl" lang="ar" style="font-family: 'Noto Sans Arabic', Tahoma, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0A0A0A; text-align: right;">
      <div style="background: #0A0A0A; padding: 20px; text-align: center;">
        <span dir="ltr" style="color: #E8C97A; font-family: Georgia, serif; font-size: 20px; letter-spacing: -0.5px;">IMPORT-EXPERT</span>
      </div>
      <div style="padding: 32px 24px;">
        <h1 style="font-size: 21px; font-weight: 600; margin: 0 0 16px;">مرحبًا${prenom ? ' ' + esc(prenom) : ''}،</h1>
        <p style="font-size: 15px; line-height: 1.9; color: #3A3530;">
          شكرًا على تسجيلكم في Import-eXPert. لتفعيل حسابكم، أكّدوا عنوان بريدكم الإلكتروني بالضغط على الزر أسفله.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background: #0A0A0A; color: #E8C97A; padding: 14px 28px; text-decoration: none; font-size: 15px;">
            تأكيد بريدي الإلكتروني
          </a>
        </div>
        <p style="font-size: 13px; color: #8A8078; line-height: 1.8;">
          هذا الرابط صالح لمدة 48 ساعة. إذا لم تقوموا بهذا التسجيل، يمكنكم تجاهل هذه الرسالة.
        </p>
        <p style="font-size: 12px; color: #8A8078; line-height: 1.8;">
          أو انسخوا هذا الرابط في متصفحكم:<br><span dir="ltr" style="word-break: break-all;">${verifyUrl}</span>
        </p>
        <p style="font-size: 12px; color: #8A8078; line-height: 1.8;">
          تبقى واجهة الحساب حاليًا باللغة الفرنسية، ويجيبكم خبراؤنا بالعربية أو بالفرنسية حسب اختياركم.
        </p>
      </div>
      <div style="border-top: 1px solid #E8DFC8; padding: 16px 24px; font-size: 11px; color: #8A8078;">
        <span dir="ltr">© 2026 Import-eXPert</span>
      </div>
    </div>
  `
  return sendEmail({ to, subject: 'أكّدوا بريدكم الإلكتروني — Import-eXPert', html })
}

// ── Administrateurs (2026-11-01) ─────────────────────────────────────────────
function adminEmailLayout(title: string, body: string, url: string, cta: string) {
  return `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0A0A0A;">
      <div style="background: #0C2D5C; padding: 20px; text-align: center;">
        <span style="color: #E8C97A; font-family: Georgia, serif; font-size: 20px;">IMPORT-EXPERT</span>
      </div>
      <div style="padding: 32px 24px;">
        <h1 style="font-size: 20px; font-weight: 500; margin: 0 0 16px;">${title}</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #3A3530;">${body}</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${url}" style="display: inline-block; background: #0C2D5C; color: #E8C97A; padding: 14px 28px; text-decoration: none; font-size: 13px; letter-spacing: 0.08em;">${cta}</a>
        </div>
        <p style="font-size: 12px; color: #6E6A62; line-height: 1.6;">
          Ce lien est personnel et valable 48 heures. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
        </p>
      </div>
    </div>`
}

export async function sendAdminInviteEmail(to: string, nom: string, url: string) {
  return sendEmail({
    to,
    subject: 'Votre accès « Gestion des abonnements » — Import-eXPert',
    html: adminEmailLayout(
      `Bonjour${nom ? ' ' + nom : ''},`,
      'Un accès administrateur vous a été ouvert sur le tableau de bord « Gestion des abonnements » d’Import-eXPert. Créez votre mot de passe personnel pour l’activer.',
      url, 'CRÉER MON MOT DE PASSE'),
  })
}

export async function sendAdminResetEmail(to: string, url: string) {
  return sendEmail({
    to,
    subject: 'Réinitialisation de votre mot de passe administrateur — Import-eXPert',
    html: adminEmailLayout(
      'Nouveau mot de passe',
      'Une réinitialisation de votre mot de passe administrateur a été demandée. Cliquez ci-dessous pour en choisir un nouveau.',
      url, 'CHOISIR UN MOT DE PASSE'),
  })
}
