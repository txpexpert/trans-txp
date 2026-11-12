// components/WhatsAppBouton.tsx — bouton flottant « Discuter sur WhatsApp », message pré-rempli selon la page.
// À droite sur l'interface française, à gauche sur l'interface arabe. Clic compté de façon anonyme.
import { WA_NUMERO, lienWhatsapp, messagePourPage } from '../lib/whatsappLien'

export default function WhatsAppBouton({ chemin, ar }: { chemin: string; ar: boolean }) {
  if (!WA_NUMERO) return null
  const compter = () => { try { fetch('/api/evenement', { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ e: 'whatsapp_clic' }) }) } catch {} }
  return (
    <a href={lienWhatsapp(messagePourPage(chemin, ar))} target="_blank" rel="noopener noreferrer" onClick={compter}
      className={`x-wa${ar ? ' x-wa-ar' : ''}`} aria-label={ar ? 'تواصلوا معنا عبر واتساب' : 'Discuter sur WhatsApp'} title={ar ? 'تواصلوا معنا عبر واتساب' : 'Discuter sur WhatsApp'}>
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.6l-.4-.3-3.8 1.2 1.2-3.7-.3-.4c-1.2-1.8-1.8-3.8-1.8-5.9 0-5.9 4.9-10.7 11-10.7s11 4.8 11 10.7-4.9 10.7-11 10.7zm6-8c-.3-.2-1.9-1-2.2-1.1-.3-.1-.5-.2-.7.2-.2.3-.8 1.1-1 1.3-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.8 5 .8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>
      <span className="x-wa-txt">{ar ? 'واتساب' : 'WhatsApp'}</span>
    </a>
  )
}
