// components/VoirMotDePasse.tsx — case « Afficher le mot de passe » (2026-11-15)
// À placer après le(s) champ(s) mot de passe d'un formulaire : la case affiche ou masque
// ensemble tous les champs mot de passe du formulaire (ou, à défaut de <form>, du plus
// proche bloc parent qui en contient). React ne réécrit pas l'attribut « type » tant que
// sa valeur dans le code ne change pas : la bascule reste stable entre deux saisies.
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'

export default function VoirMotDePasse({ langue = 'fr', style }: { langue?: 'fr' | 'ar'; style?: CSSProperties }) {
  const id = useId()
  const ref = useRef<HTMLLabelElement>(null)
  const [voir, setVoir] = useState(false)

  const zone = (): HTMLElement | null => {
    const el = ref.current
    if (!el) return null
    const form = el.closest('form')
    if (form) return form
    let p: HTMLElement | null = el.parentElement
    while (p && !p.querySelector('input[type="password"], input[data-mdp]')) p = p.parentElement
    return p
  }

  const appliquer = (v: boolean) => {
    const z = zone()
    if (!z) return
    z.querySelectorAll<HTMLInputElement>('input[type="password"], input[data-mdp]').forEach(c => {
      c.setAttribute('data-mdp', '')
      c.type = v ? 'text' : 'password'
    })
  }

  // Champs ajoutés après coup (ex. confirmation) : même état que la case
  useEffect(() => {
    const z = zone()
    if (!z || !voir) return
    const obs = new MutationObserver(() => appliquer(true))
    obs.observe(z, { childList: true, subtree: true })
    return () => obs.disconnect()
  })

  const ar = langue === 'ar'
  return (
    <label ref={ref} htmlFor={id} dir={ar ? 'rtl' : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#6E6A62', cursor: 'pointer', margin: '2px 0 12px', fontWeight: 400, letterSpacing: 0, textTransform: 'none', ...style }}>
      <input id={id} type="checkbox" checked={voir} onChange={e => { setVoir(e.target.checked); appliquer(e.target.checked) }}
        style={{ width: 'auto', margin: 0, accentColor: '#0C2D5C' }} />
      {ar ? 'إظهار كلمة المرور' : 'Afficher le mot de passe'}
    </label>
  )
}
