// pages/api/barometre-csv.ts — chiffres agrégés du Baromètre 2026 au format CSV (presse, partenaires).
import type { NextApiRequest, NextApiResponse } from 'next'
import { QUESTIONS, SEUIL_PUBLICATION } from '../../lib/barometre'
import { agregatsBarometre } from '../../lib/barometreAgregats'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const a = await agregatsBarometre()
  if (!a.resultats || a.n < SEUIL_PUBLICATION) return res.status(404).json({ error: `Chiffres publiés à partir de ${SEUIL_PUBLICATION} répondants (${a.n} à ce jour).` })
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`
  const lignes = ['Question;Réponse;Répondants à la question;Nombre;Pourcentage']
  QUESTIONS.forEach((qu, i) => {
    const r = a.resultats![qu.id]
    qu.o.forEach((o, j) => lignes.push([q(`${i + 1}. ${qu.t}`), q(o), r.n, r.cnt[j], r.n ? Math.round(r.cnt[j] / r.n * 100) : 0].join(';')))
  })
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="barometre-2026-import-expert.csv"')
  return res.status(200).send('﻿' + lignes.join('\n'))
}
