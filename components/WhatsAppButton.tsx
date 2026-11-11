// components/WhatsAppButton.tsx — bouton flottant « Discuter sur WhatsApp ».
// Ouvre wa.me avec un message pré-rempli qui dépend de la page : l'équipe sait
// d'où vient le contact (diagnostic, tarifs, module…). Aucune donnée n'est
// envoyée à Meta par le site : c'est le visiteur qui ouvre WhatsApp.
// Masqué tant que NEXT_PUBLIC_WHATSAPP_NUMBER n'est pas renseigné (format
// international sans + ni 0, ex. 212612345678).
import { useRouter } from 'next/router'

const NUMERO = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '')

// Préfixe de chemin → message. Le premier préfixe qui correspond l'emporte.
const MESSAGES_FR: [string, string][] = [
  ['/diagnostic', 'Bonjour, je viens de faire le diagnostic de conformité et j’aimerais en parler.'],
  ['/calculateur-dum', 'Bonjour, j’ai utilisé le calculateur « Argent laissé sur la table » et j’ai une question.'],
  ['/tarifs', 'Bonjour, je souhaite des informations sur l’abonnement annuel Import-eXPert.'],
  ['/abonnements', 'Bonjour, je souhaite des informations sur l’abonnement annuel Import-eXPert.'],
  ['/mon-abonnement', 'Bonjour, j’ai une question sur mon abonnement (pro-forma, virement, renouvellement).'],
  ['/echange-expert', 'Bonjour, je souhaite réserver un échange avec un expert.'],
  ['/expertise', 'Bonjour, je souhaite un accompagnement par vos experts.'],
  ['/accords', 'Bonjour, j’ai une question sur un accord de libre-échange et l’origine des marchandises.'],
  ['/risques', 'Bonjour, j’ai une question sur un risque ou un litige douanier.'],
  ['/produits', 'Bonjour, j’ai une question sur les droits applicables à un produit.'],
  ['/barometre', 'Bonjour, je vous contacte au sujet du Baromètre 2026.'],
  ['/profils/transitaire', 'Bonjour, je suis transitaire et l’offre Cabinet m’intéresse.'],
  ['/modules/', 'Bonjour, j’utilise un module d’Import-eXPert et j’ai une question.'],
]
const DEFAUT_FR = 'Bonjour, je vous contacte depuis import-expert.ma.'
const DEFAUT_AR = 'السلام عليكم، أتواصل معكم من موقع import-expert.ma.'
const TARIFS_AR = 'السلام عليكم، أرغب في معلومات حول الاشتراك السنوي في Import-eXPert.'

export function whatsappMessage(pathname: string, ar = false): string {
  if (ar) return pathname.startsWith('/ar/tarifs') ? TARIFS_AR : DEFAUT_AR
  return MESSAGES_FR.find(([p]) => pathname === p || pathname.startsWith(p.endsWith('/') ? p : p + '/'))?.[1] ?? DEFAUT_FR
}

export function whatsappHref(text: string): string {
  return `https://wa.me/${NUMERO}?text=${encodeURIComponent(text)}`
}

export default function WhatsAppButton({ ar = false }: { ar?: boolean }) {
  const { asPath } = useRouter()
  if (!NUMERO) return null
  const path = asPath.split(/[?#]/)[0]
  const href = whatsappHref(whatsappMessage(path, ar))
  return (
    <a className="x-wa" href={href} target="_blank" rel="noopener noreferrer"
       aria-label={ar ? 'تواصلوا معنا عبر واتساب' : 'Discuter avec Import-eXPert sur WhatsApp'}
       onClick={() => { try { fetch('/api/evenement', { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ e: 'whatsapp_clic' }) }).catch(() => {}) } catch {} }}>
      <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.3.6 4.5 1.8 6.4L3 29l7.2-1.9c1.8 1 3.8 1.5 5.8 1.5 7 0 12.7-5.6 12.7-12.6S23 3 16 3zm0 23.1c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.3 1.1 1.1-4.1-.3-.4a10.4 10.4 0 0 1-1.6-5.5C5.2 9.8 10 5.1 16 5.1s10.8 4.7 10.8 10.5S22 26.1 16 26.1zm5.9-7.8c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.7c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.1-1.2 2.7 1.2 3.2 1.4 3.4 2.4 3.6 5.7 5c2.1.9 2.9 1 4 .8.6-.1 1.9-.8 2.2-1.5s.3-1.4.2-1.5-.3-.2-.6-.3z"/></svg>
      <span>{ar ? 'واتساب' : 'WhatsApp'}</span>
    </a>
  )
}
