// components/ChainCompact.tsx — la chaîne en tuiles compactes (5 étapes + socle).
import Link from 'next/link'
import { CHAIN } from '../lib/suite'

export default function ChainCompact({ eyebrow, id }: { eyebrow: string; id?: string }) {
  return (
    <section className="x-sec x-sec-dark" id={id}>
      <div className="x-wrap">
        <div className="x-eyebrow">{eyebrow}</div>
        <h2 className="x-h2">Une opération, <em>cinq étapes</em>, un seul dossier.</h2>
        <p className="x-sub">Chaque espace répond à une question que vous vous posez à chaque importation, produit un livrable, et transmet ses données à l’étape suivante.</p>
        <div className="x-chain">
          {CHAIN.map((e, i) => (
            <Link href={`/espaces/${e.slug}`} className={`x-link-card x-c-${e.slug}`} key={e.slug}>
              <span className="x-num">{e.num}</span>
              <div className="x-verb">{e.verb}</div>
              <div className="x-card-t">{e.title}</div>
              <p className="x-card-q">{e.question}</p>
              <div className="x-card-out"><b>Livrable</b>{e.livrable}</div>
              {i < CHAIN.length - 1 && <span className="x-arrow" aria-hidden="true" />}
            </Link>
          ))}
        </div>
        <div className="x-base">
          <Link href="/espaces/bibliotheque" className="x-link-card x-c-bibliotheque"><div className="x-verb">Bibliothèque</div><p>Le socle : tarif, circulaires, CGI, IGOC, décisions, glossaire.</p></Link>
          <Link href="/#assistant" className="x-link-card x-c-assistant"><div className="x-verb">IXP-Assistant</div><p>Dans chaque espace, il répond en citant le texte exact.</p></Link>
          <Link href="/espaces/piloter" className="x-link-card x-c-piloter"><div className="x-verb">Piloter</div><p>Intelligence et stratégie pour la direction générale.</p></Link>
        </div>
      </div>
    </section>
  )
}
