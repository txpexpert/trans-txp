// lib/whatsappLien.ts — partie sans dépendance serveur (utilisable dans le navigateur) : numéro, lien wa.me, message par page.

export const WA_NUMERO = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '').replace(/^00/, '')

/** Numéro lisible : +212 666 651 839 */
export function numeroLisible(n: string = WA_NUMERO) {
  const m = /^212(\d{3})(\d{3})(\d{3})$/.exec(n)
  return m ? `+212 ${m[1]} ${m[2]} ${m[3]}` : n ? '+' + n : ''
}

export function lienWhatsapp(texte: string, n: string = WA_NUMERO) {
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(texte)}` : ''
}

// Message pré-rempli selon la page d'où part le visiteur : on sait tout de suite d'où vient le contact.
const MESSAGES: [RegExp, string, string][] = [
  [/^\/(ar\/)?diagnostic/, 'Bonjour, je viens de faire le diagnostic de conformité et j’ai une question.', 'مرحبًا، أجريت تشخيص الامتثال ولدي سؤال.'],
  [/^\/(ar\/)?tarifs|^\/abonnements/, 'Bonjour, je souhaite des informations sur les offres Import-eXPert.', 'مرحبًا، أرغب في معلومات حول عروض Import-eXPert.'],
  [/^\/mon-abonnement|^\/facturation/, 'Bonjour, j’ai une question sur mon abonnement Import-eXPert.', 'مرحبًا، لدي سؤال حول اشتراكي.'],
  [/^\/(ar\/)?echange-expert/, 'Bonjour, je souhaite un échange de 20 minutes avec un expert.', 'مرحبًا، أرغب في لقاء لمدة 20 دقيقة مع خبير.'],
  [/^\/accords/, 'Bonjour, j’ai une question sur un accord de libre-échange et l’origine.', 'مرحبًا، لدي سؤال حول اتفاقية تبادل حر والمنشأ.'],
  [/^\/risques/, 'Bonjour, j’ai une question sur un risque ou un litige à l’import.', 'مرحبًا، لدي سؤال حول خطر أو نزاع في الاستيراد.'],
  [/^\/fiches|^\/produits/, 'Bonjour, j’ai une question sur le classement d’un produit.', 'مرحبًا، لدي سؤال حول تصنيف منتوج.'],
  [/^\/modules|^\/espaces/, 'Bonjour, j’ai une question sur un module d’Import-eXPert.', 'مرحبًا، لدي سؤال حول إحدى وحدات Import-eXPert.'],
  [/^\/(ar\/)?contact/, 'Bonjour, je souhaite parler à un expert Import-eXPert.', 'مرحبًا، أرغب في التحدث مع خبير.'],
]
export function messagePourPage(chemin: string, ar: boolean) {
  const l = MESSAGES.find(([re]) => re.test(chemin))
  if (l) return ar ? l[2] : l[1]
  return ar ? 'مرحبًا، لدي سؤال حول الاستيراد إلى المغرب.' : 'Bonjour, j’ai une question sur l’importation au Maroc.'
}

