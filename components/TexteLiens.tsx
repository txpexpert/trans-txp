// components/TexteLiens.tsx — texte d'une réponse dont les numéros de circulaires disponibles dans
// la Bibliothèque deviennent des liens vers « Textes officiels » (liens calculés côté serveur).
import Link from 'next/link'
import { decouperAvecLiens } from '../lib/textesLiens'

export default function TexteLiens({ texte, liens }: { texte: string; liens?: Record<string, string> | null }) {
  return (
    <>
      {decouperAvecLiens(texte, liens).map((m, i) =>
        m.href ? <Link key={i} href={m.href} style={{ textDecoration: 'underline', fontWeight: 600 }}>{m.t}</Link> : <span key={i}>{m.t}</span>)}
    </>
  )
}
