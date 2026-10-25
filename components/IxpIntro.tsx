// components/IxpIntro.tsx — animation d'ouverture du logo IXP en 3D (reprise de l'accueil actuel).
// Jouée une fois par session ; jamais si l'utilisateur a demandé de réduire les animations.
// Au premier chargement, le petit script inclus dans introHTML masque le calque avant l'affichage ;
// après une navigation interne, les scripts inclus ne s'exécutent pas : l'effet ci-dessous prend le relais.
import { useEffect } from 'react'
import { introCss, introHTML, introScript } from '../lib/ixpIntro'

export default function IxpIntro() {
  useEffect(() => {
    const root = document.getElementById('ixp-intro')
    if (!root || root.getAttribute('data-run')) return
    root.setAttribute('data-run', '1')
    let skip = root.className === 'ixp-off'
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) skip = true } catch { /* ignoré */ }
    try { if (sessionStorage.getItem('ixp-intro-seen') === '1') skip = true } catch { /* ignoré */ }
    if (skip) { root.className = 'ixp-off'; document.documentElement.style.overflow = ''; return }
    document.documentElement.style.overflow = 'hidden'
    const s = document.createElement('script')
    s.text = introScript
    document.body.appendChild(s)
    return () => { document.documentElement.style.overflow = ''; s.remove() }
  }, [])
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: introCss }} />
      <div dangerouslySetInnerHTML={{ __html: introHTML }} />
      {/* Premier chargement (et copie hors ligne) : l'animation démarre dès la lecture de la page */}
      <script dangerouslySetInnerHTML={{ __html: '(function(){var r=document.getElementById("ixp-intro");if(!r||r.getAttribute("data-run"))return;r.setAttribute("data-run","1");' + introScript + '})();' }} />
    </>
  )
}
