// Documents Word des kits Import-eXPert.
// Sources : Guide des procédures douanières Maroc, éd. 2026 (à jour au 04/10/2026) ;
// Import Process Management (maj 17/10/2026).
const fs = require('fs');
const D = require('docx');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  HeadingLevel, AlignmentType, LevelFormat, ImageRun, Header, Footer, PageNumber, BorderStyle } = D;

const OUT = '/home/claude/kits/out';
const NAVY = '153E82', RED = 'A82D3C', INK = '1C2333', GREY = '5A6475', LIGHT = 'EEF2F9', ROSE = 'FBEDEF', GOLDBG = 'FBF5E6';
const W = 9638;

function runs(text, base = {}) {
  const out = [];
  for (const p of String(text).split(/(\*\*[^*]+\*\*)/)) {
    if (!p) continue;
    if (p.startsWith('**')) out.push(new TextRun({ text: p.slice(2, -2), bold: true, ...base }));
    else out.push(new TextRun({ text: p, ...base }));
  }
  return out;
}
const P = (t, o = {}) => new Paragraph({ children: runs(t, o.run || {}), spacing: { after: o.after ?? 120, line: 290 }, alignment: o.align || AlignmentType.JUSTIFIED });
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const B = t => new Paragraph({ numbering: { reference: 'bul', level: 0 }, children: runs(t), spacing: { after: 70, line: 280 } });
const N = (t, ref) => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t), spacing: { after: 70, line: 280 } });
const DOTS = '…………………………';
const sp = () => new Paragraph({ children: [], spacing: { after: 60 } });

const bd = { style: BorderStyle.SINGLE, size: 4, color: 'C9D2E3' };
const borders = { top: bd, bottom: bd, left: bd, right: bd };
function table(headers, rows, widths) {
  const sum = widths.reduce((a, b) => a + b, 0);
  const hdr = new TableRow({ tableHeader: true, children: headers.map((h, i) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA }, borders, shading: { type: ShadingType.CLEAR, fill: NAVY, color: 'auto' },
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18 })] })] })) });
  const body = rows.map((r, ri) => new TableRow({ children: r.map((c, i) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA }, borders,
    shading: { type: ShadingType.CLEAR, fill: i === 0 ? LIGHT : (ri % 2 ? 'F7F9FC' : 'FFFFFF'), color: 'auto' },
    margins: { top: 50, bottom: 50, left: 90, right: 90 },
    children: String(c).split('\n').map(l => new Paragraph({ children: runs(l, { size: 18 }), spacing: { after: 30 } })) })) }));
  return new Table({ width: { size: sum, type: WidthType.DXA }, columnWidths: widths, rows: [hdr, ...body] });
}
function box(title, lines, fill = LIGHT, color = NAVY) {
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({
    width: { size: W, type: WidthType.DXA },
    borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.SINGLE, size: 24, color } },
    shading: { type: ShadingType.CLEAR, fill, color: 'auto' }, margins: { top: 120, bottom: 120, left: 200, right: 200 },
    children: [...(title ? [new Paragraph({ children: [new TextRun({ text: title, bold: true, color, size: 20 })], spacing: { after: 70 } })] : []),
      ...lines.map(l => new Paragraph({ children: runs(l, { size: 19 }), spacing: { after: 50, line: 270 } }))] })] })] });
}
// Formulaire : bloc encadré à remplir (modèle d'acte)
function form(lines) {
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({
    width: { size: W, type: WidthType.DXA }, borders: { top: bd, bottom: bd, left: bd, right: bd },
    shading: { type: ShadingType.CLEAR, fill: 'FFFFFF', color: 'auto' }, margins: { top: 160, bottom: 160, left: 240, right: 240 },
    children: lines.map(l => new Paragraph({ children: runs(l, { size: 20 }), spacing: { after: 110, line: 300 } })) })] })] });
}
const checklist = (rows) => table(['N°', 'Point de contrôle', 'Référence', 'Conforme', 'Observation'],
  rows.map((r, i) => [String(i + 1), r[0], r[1], '☐ Oui  ☐ Non', '']), [500, 4300, 2100, 1300, 1438]);

const DISCLAIMER = "Outil d'aide à la conformité. Il ne se substitue ni aux textes officiels ni à une consultation personnalisée. Données à jour au 04/10/2026 (Guide des procédures douanières Maroc, éd. 2026) : avant toute opération, vérifier que le texte cité n'a pas été modifié. Lorsque l'administration impose un formulaire ou une forme particulière, celle-ci prévaut sur les modèles du kit.";

function cover(kit, titre, sous) {
  return [
    new Paragraph({ spacing: { before: 600, after: 120 }, children: [new TextRun({ text: 'IMPORT-eXPERT · ' + kit, bold: true, color: RED, size: 22, characterSpacing: 40 })] }),
    new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: titre, bold: true, color: NAVY, size: 44 })] }),
    new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: sous, color: GREY, size: 24 })] }),
    box('Avertissement', [DISCLAIMER], GOLDBG, 'A8822F'),
    sp(),
  ];
}

function makeDoc(file, kit, children, numbering = []) {
  const doc = new Document({
    creator: 'Import-eXPert', title: file,
    styles: {
      default: { document: { run: { font: 'Calibri', size: 21, color: INK } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 30, bold: true, color: NAVY, font: 'Calibri' }, paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: RED, space: 4 } } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, color: NAVY, font: 'Calibri' }, paragraph: { spacing: { before: 220, after: 110 }, outlineLevel: 1 } },
      ],
    },
    numbering: { config: [
      { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 480, hanging: 260 } } } }] },
      ...numbering.map(ref => ({ reference: ref, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 480, hanging: 300 } } } }] })),
    ] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Import-eXPert · ' + kit, color: GREY, size: 16 })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'import-expert.ma · Outil d’aide, à jour au 04/10/2026 · page ', color: GREY, size: 16 }), new TextRun({ children: [PageNumber.CURRENT], color: GREY, size: 16 })] })] }) },
      children,
    }],
  });
  return Packer.toBuffer(doc).then(b => fs.writeFileSync(`${OUT}/${file}`, b));
}

// ═════════════ KIT 01 — Modèles de preuves et fiche d'origine ═════════════
const k01m = [
  ...cover('Kit 01 · Origine préférentielle et ALE', 'Modèles de déclarations et fiche d’origine', 'Déclaration d’origine sur facture, déclaration à long terme du fournisseur, clause de coopération, fiche d’origine produit et dossier d’origine États-Unis'),
  H1('1. Ce qu’il faut savoir avant d’utiliser les modèles'),
  table(['Point', 'Règle', 'Référence'], [
    ['Preuves admises (UE, Turquie)', 'Certificat EUR.1 visé par la douane, ou déclaration d’origine sur une facture, un bon de livraison ou un autre document commercial. Les EUR-MED sont supprimés depuis le 01/01/2026.', 'Circ. n° 6706/233, annexe I, art. 17'],
    ['Qui peut établir une déclaration d’origine', 'Tout exportateur pour un envoi n’excédant pas 6 000 EUR ; sans limite de valeur, l’exportateur agréé titulaire d’un numéro d’autorisation.', 'Annexe I, art. 18 et 19'],
    ['Validité', '10 mois (UE et Turquie).', 'Annexe I, art. 23'],
    ['Mentions à l’export marocain', '« REVISED RULES » en case 7 ; « CUMULATION APPLIED WITH » suivi du nom de la ou des parties en cas de cumul.', 'Circ. n° 6706/233 ; circ. n° 6722/233'],
    ['Déclaration du fournisseur', 'Ponctuelle, ou à long terme valable deux ans au plus.', 'Annexe I, art. 29'],
    ['Conservation', 'Trois ans au moins pour l’exportateur (UE, Turquie) ; cinq ans pour l’importateur dans l’accord avec les États-Unis.', 'Annexe I, art. 31 ; circ. n° 4977/222'],
    ['AELE et Agadir', 'Anciennes règles maintenues jusqu’à la modification des protocoles : vérifier les preuves et mentions dans les circulaires n° 4980/233 et 5047/223.', 'Circ. n° 6706/233'],
    ['États-Unis', 'Aucun certificat : l’importateur qui demande la préférence est réputé certifier l’éligibilité.', 'Circ. n° 4977/222'],
  ], [2300, 5000, 2338]),
  sp(),
  box('Point de vigilance', ['Le texte officiel de la déclaration d’origine figure en appendice de l’annexe I de la circulaire n° 6706/233. Le modèle ci-dessous en reprend la structure ; avant la première utilisation, comparez-le mot pour mot au texte de l’appendice et utilisez la version linguistique demandée par l’accord.'], ROSE, RED),
  H1('Modèle A — Déclaration d’origine sur facture (UE, Turquie)'),
  P('**Usage.** Envoi n’excédant pas 6 000 EUR, ou exportateur agréé quelle que soit la valeur. La déclaration est portée sur la facture, le bon de livraison ou un autre document commercial décrivant les produits avec assez de précision pour les identifier.'),
  form([
    '**Version française**',
    `L'exportateur des produits couverts par le présent document (autorisation douanière ou de l'autorité gouvernementale compétente n° ${DOTS}) déclare que, sauf indication claire du contraire, ces produits ont l'origine préférentielle ${DOTS}.`,
    'REVISED RULES',
    `[Le cas échéant] CUMULATION APPLIED WITH ${DOTS}`,
    `Lieu et date : ${DOTS}`,
    `Nom, fonction et signature de l'exportateur : ${DOTS}`,
    '**Version anglaise**',
    `The exporter of the products covered by this document (customs or competent governmental authority authorisation No ${DOTS}) declares that, except where otherwise clearly indicated, these products are of ${DOTS} preferential origin.`,
    'REVISED RULES',
    `[If applicable] CUMULATION APPLIED WITH ${DOTS}`,
    `Place and date: ${DOTS} — Name, position and signature of the exporter: ${DOTS}`,
  ]),
  P('Le numéro d’autorisation n’est indiqué que par l’exportateur agréé. Au-delà de 6 000 EUR sans ce statut, la préférence sera refusée à l’importateur : demandez alors un EUR.1 pour chaque envoi (Guide, n° 2-026, cas pratique).', { after: 80 }),
  H1('Modèle B — Déclaration à long terme du fournisseur'),
  P('**Usage.** Le fournisseur atteste le caractère originaire des matières qu’il livre de façon régulière, pour permettre à l’exportateur d’appliquer le cumul. Durée de validité : deux ans au plus (annexe I, art. 29). Le texte réglementaire de la déclaration du fournisseur prévaut sur ce modèle de structure.'),
  form([
    `Le soussigné, ${DOTS}, agissant pour la société ${DOTS} (adresse : ${DOTS} ; identifiant : ${DOTS}), fournisseur,`,
    `déclare que les marchandises énumérées ci-après, livrées régulièrement à la société ${DOTS}, client :`,
    `1. Désignation : ${DOTS} — Code SH : ${DOTS} — Référence commerciale : ${DOTS}`,
    `2. Désignation : ${DOTS} — Code SH : ${DOTS} — Référence commerciale : ${DOTS}`,
    `sont originaires de ${DOTS} et satisfont aux règles d’origine régissant les échanges préférentiels avec ${DOTS}.`,
    `La présente déclaration couvre les envois effectués du ${DOTS} au ${DOTS} (deux ans au plus).`,
    'Le fournisseur s’engage à informer immédiatement le client si la présente déclaration cesse d’être valable, et à mettre à la disposition des autorités douanières toutes les justifications requises.',
    `Fait à ${DOTS}, le ${DOTS}. Nom, fonction, signature et cachet : ${DOTS}`,
  ]),
  H1('Modèle C — Clause de coopération à la vérification de l’origine'),
  P('**Usage.** À insérer dans le contrat d’achat. Une preuve formellement correcte ne suffit pas : si la douane du pays d’exportation ne confirme pas l’origine dans les 10 mois, la préférence est refusée et les droits de droit commun sont recouvrés (annexe I, art. 34 et 35 ; Guide, n° 2-027).'),
  form([
    `Article ${DOTS} — Origine préférentielle. Le vendeur garantit que les marchandises livrées sous preuve d’origine préférentielle satisfont aux règles d’origine de l’accord ${DOTS}. Il conserve pendant au moins ${DOTS} ans les justificatifs du caractère originaire (nomenclature des matières, preuves des fournisseurs, calculs).`,
    'Il s’engage à répondre sans délai à toute demande de vérification émanant des autorités douanières du pays d’exportation ou d’importation, et à communiquer à l’acheteur, sur demande, les éléments nécessaires à la justification de l’origine.',
    'En cas de refus de la préférence imputable à une preuve inexacte ou à un défaut de coopération du vendeur, celui-ci rembourse à l’acheteur les droits, intérêts et pénalités mis à sa charge.',
  ]),
  H1('Modèle D — Fiche d’origine produit'),
  P('**Usage.** Une fiche par produit et par accord : c’est la pièce demandée en cas de contrôle a posteriori (Guide, n° 2-021 et 2-024). Le calcul de valeur se fait dans la matrice Excel du kit.'),
  table(['Rubrique', 'À renseigner'], [
    ['Produit fini', `Désignation : ${DOTS}  Code SH : ${DOTS}`],
    ['Accord invoqué', `${DOTS} (UE et Turquie : règles révisées ; AELE et Agadir : anciennes règles)`],
    ['Règle de liste applicable', `Texte de la règle : ${DOTS}  Source : ${DOTS}`],
    ['Prix départ usine', `${DOTS} DH`],
    ['Matières non originaires', `Désignation, code SH, origine, valeur : ${DOTS}`],
    ['Matières originaires et preuves', `Fournisseur, preuve reçue (EUR.1, déclaration, déclaration à long terme) : ${DOTS}`],
    ['Cumul appliqué', `☐ Non  ☐ Oui, avec : ${DOTS}  (mention « CUMULATION APPLIED WITH »)`],
    ['Opérations réalisées', `${DOTS} (vérifier qu’elles dépassent les opérations insuffisantes de l’art. 6 de l’annexe I)`],
    ['Résultat', '☐ Originaire  ☐ Non originaire  ☐ Tolérance de 15 % utilisée (hors textiles)'],
    ['Preuve émise', `☐ EUR.1  ☐ Déclaration d’origine  N° / date : ${DOTS}`],
    ['Validation', `Établie par ${DOTS} le ${DOTS} ; revue le ${DOTS}`],
  ], [2600, 7038]),
  H1('Modèle E — Dossier d’origine à obtenir d’un fournisseur américain'),
  P('**Usage.** Dans l’accord Maroc–États-Unis, c’est l’importateur qui certifie l’éligibilité et en répond. Sélectionné au contrôle, il doit produire une déclaration d’origine détaillant les matières et le calcul (circ. n° 4977/222 ; Guide, n° 2-023).'),
  B('Description du produit et code SH.'),
  B('Règle appliquée : règle spécifique des listes 1 et 2 de l’annexe IX, ou, à défaut, article nouveau ou différent et critère de valeur.'),
  B('Calcul : (valeur des matières produites dans les parties + coûts directs de transformation) / valeur estimée du produit × 100 ≥ 35 %.'),
  B('Liste des matières, avec leur origine et leur valeur ; pour les textiles, vérification du de minimis de 7 % du poids du composant déterminant.'),
  B('Preuve du transport direct entre les parties.'),
  B('Engagement du fournisseur de fournir ces éléments sur demande ; conservation par l’importateur pendant 5 ans.'),
  P('En cas de rejet de la préférence, la douane le notifie par écrit dans un délai d’un mois, avec ses motifs de fait et de droit (circ. n° 4977/222).'),
  H2('Sources'),
  P('Guide des procédures douanières Maroc, éd. 2026, n° 2-021 à 2-028. Circ. ADII n° 6706/233 du 31/12/2025 (annexe I), 6722/233 du 10/02/2026, 4977/222 du 30/12/2005, 6139/222 du 31/12/2020, 6758/233 du 07/07/2026.'),
];

// ═════════════ KIT 01 — Check-list d'audit des justificatifs ═════════════
const k01c = [
  ...cover('Kit 01 · Origine préférentielle et ALE', 'Check-list d’audit des justificatifs d’origine', 'À dérouler avant chaque déclaration sous préférence, puis lors de l’audit annuel d’un échantillon de dossiers'),
  H1('1. À l’importation : avant de demander la préférence'),
  checklist([
    ['L’accord invoqué couvre le pays d’origine et le produit (code SH), à la date de l’opération.', 'Guide n° 2-021'],
    ['La preuve est admise par l’accord : EUR.1 ou déclaration d’origine (UE, Turquie) ; aucun certificat pour les États-Unis ; certificat visé pour la ZLECAf.', 'Annexe I, art. 17 ; circ. 4977/222 ; note D87/2026'],
    ['La preuve est encore valable à la date de la déclaration (10 mois pour l’UE et la Turquie).', 'Annexe I, art. 23'],
    ['Déclaration d’origine au-delà de 6 000 EUR : elle porte un numéro d’exportateur agréé au format de la partie (ex. « GB » + 5 chiffres + année).', 'Annexe I, art. 18 ; note D99/2026'],
    ['La description et les quantités de la preuve correspondent à la facture et aux marchandises (les légères discordances n’invalident pas la preuve).', 'Annexe I, art. 28'],
    ['Le cachet et la signature correspondent aux spécimens diffusés par l’ADII ; toute discordance justifie une demande de contrôle a posteriori.', 'Note D105/2026'],
    ['La règle de non-modification est respectée en cas de passage par un pays tiers (connaissements, marquage, certificat de non-manipulation).', 'Annexe I, art. 14'],
    ['Produits agricoles transformés de l’AELE : seul l’élément agricole est taxé, au taux de la liste actualisée.', 'Circ. n° 6409/222'],
    ['États-Unis : le dossier d’origine du fournisseur (critère de 35 %) est en possession de l’importateur.', 'Circ. n° 4977/222'],
    ['La référence de l’accord et la preuve sont jointes à la déclaration ; en ATPA, la garantie peut être calculée au taux préférentiel.', 'Circ. n° 6063/313'],
  ]),
  H1('2. À l’exportation : avant d’émettre une preuve'),
  checklist([
    ['Une fiche d’origine existe pour le produit et l’accord du pays de destination.', 'Guide n° 2-021'],
    ['La règle de liste de l’accord est satisfaite (UE, Turquie : annexe II de la circ. n° 6706/233 ; tolérance de 15 % hors textiles).', 'Annexe I, art. 5'],
    ['Les opérations réalisées dépassent les opérations insuffisantes.', 'Annexe I, art. 6'],
    ['Les matières cumulées sont couvertes par une preuve ou une déclaration du fournisseur valable (déclaration à long terme : 2 ans au plus).', 'Annexe I, art. 7, 8 et 29'],
    ['Textiles des chapitres 50 à 63 : la règle du no-drawback est respectée (aucune matière non originaire importée en suspension).', 'Circ. n° 6706/233 ; circ. n° 6139/222'],
    ['La preuve porte « REVISED RULES » (UE, Turquie) et, en cas de cumul, « CUMULATION APPLIED WITH … ».', 'Circ. n° 6706/233'],
    ['Déclaration d’origine au-delà de 6 000 EUR : l’entreprise est exportateur agréé ; sinon, EUR.1 demandé sur BADR.', 'Annexe I, art. 18 et 19'],
    ['Royaume-Uni : le type de cumul (bilatéral ou diagonal) et la preuve correspondante sont vérifiés auprès de l’ADII.', 'Circ. n° 6139/222 ; circ. n° 6758/233'],
    ['AELE et Agadir : les anciennes règles et preuves de ces accords sont appliquées.', 'Circ. n° 4980/233 et 5047/223'],
    ['Le dossier d’origine (fiche, preuves fournisseurs, calculs) est archivé au moins 3 ans.', 'Annexe I, art. 31'],
  ]),
  H1('3. Audit annuel : questions de revue'),
  B('Combien de déclarations sous préférence sur l’année, et quel échantillon a été revu ?'),
  B('Des demandes de vérification ont-elles été reçues ? Ont-elles été traitées dans les délais ?'),
  B('Les fiches d’origine UE et Turquie ont-elles été révisées au regard des règles appliquées depuis le 01/01/2026 ?'),
  B('Des exportations de 2025 réalisées sans preuve pourraient-elles bénéficier d’une preuve rétroactive « REVISED RULES » ?'),
  B('Le statut d’exportateur agréé est-il pertinent au vu du volume d’envois au-delà de 6 000 EUR ?'),
  H2('Sources'),
  P('Guide des procédures douanières Maroc, éd. 2026, n° 2-021 à 2-028 ; Import Process Management, chapitre 5 et annexe D.'),
];

// ═════════════ KIT 02 — Dossier de demande RED ═════════════
const k02d = [
  ...cover('Kit 02 · Régimes suspensifs et économiques', 'Dossier de demande et d’engagement', 'Demande d’opérer sous régime économique de transformation, engagement du soumissionnaire et de la caution, mandat du transitaire, check-list d’ouverture'),
  H1('1. Quand une demande est-elle nécessaire ?'),
  P('Depuis le 19/02/2021, la souscription d’une déclaration sous régime économique vaut demande et la mainlevée vaut autorisation (circ. n° 6164/313). Deux exceptions comptent en pratique :'),
  B('**Première opération en ATPA, transformation sous douane ou entrepôt industriel franc** : depuis le 15/02/2024, la société doit d’abord obtenir une autorisation après enquête d’outillage. La demande est déposée une seule fois, examinée sous huitaine, et vaut ensuite pour tous les bureaux ouverts au régime ; les artisans en sont dispensés (circ. n° 6538/313).'),
  B('**Opérations maintenues sous autorisation préalable** : liste de l’annexe II de la circulaire n° 6348/313 (par exemple l’importation fractionnée sous régime 241).'),
  P('Une opération non autorisée expose à l’annulation de la déclaration (CDII, art. 78 bis).'),
  H1('Modèle A — Demande d’opérer sous régime économique de transformation'),
  P('**Usage.** Accompagner le formulaire « Demande d’opérer sous RED de transformation » de l’ADII (circ. n° 6538/313). Le formulaire officiel prévaut : ce modèle structure les informations à réunir.'),
  form([
    `Raison sociale : ${DOTS}  RC n° : ${DOTS}  ICE : ${DOTS}`,
    `Adresse du siège : ${DOTS}  Adresse(s) des sites de production : ${DOTS}`,
    `Représentée par : ${DOTS}, en qualité de : ${DOTS}`,
    `Régime sollicité : ☐ ATPA (code 22 avec paiement / 23 sans paiement)  ☐ Transformation sous douane  ☐ Entrepôt industriel franc`,
    `1. Intrants à placer sous le régime : désignation, code SH, origine, quantités annuelles prévues : ${DOTS}`,
    `2. Nature de la transformation (ouvraison, montage, complément de main-d’œuvre) : ${DOTS}`,
    `3. Produits compensateurs : désignation, code SH, destination (exportation, entrepôt, admission temporaire) : ${DOTS}`,
    `4. Modalités d’apurement : taux de rendement par produit compensateur : ${DOTS} ; taux de déchets : ${DOTS} ; caractère récupérable des déchets : ${DOTS}`,
    `5. Moyens de production : liste des matériels (quantité, valeur, état, origine, justificatifs) en annexe ${DOTS} ; à défaut d’outillage propre, liste des sous-traitants locaux en annexe ${DOTS}`,
    `6. Garantie envisagée : ☐ caution bancaire  ☐ consignation  ☐ facilité de cautionnement n° ${DOTS}`,
    `Fait à ${DOTS}, le ${DOTS}. Signature et cachet : ${DOTS}`,
  ]),
  P('**Pièces à joindre (circ. n° 6538/313) :** formulaire de demande ; registre de commerce ; justificatifs d’adresse ; description des intrants, de la transformation et des produits compensateurs ; modalités d’apurement et taux de déchets ; liste des matériels ou des sous-traitants. Les sociétés non outillées voient leur demande examinée par le service central des RED.'),
  H1('Modèle B — Engagement du soumissionnaire et de la caution'),
  P('**Usage.** Formaliser l’engagement solidaire attaché à l’acquit à caution, notamment à l’appui d’une demande de cautionnement. L’acquit à caution lui-même est établi sur la formule de déclaration (CDII, art. 116-1°). Modèle repris du Guide des procédures douanières (annexe, modèle M2).'),
  form([
    `Le soussigné ${DOTS}, agissant au nom de la société ${DOTS} (RC n° ${DOTS}, ICE ${DOTS}), ci-après « le soumissionnaire »,`,
    `et ${DOTS}, agissant au nom de ${DOTS}, ci-après « la caution »,`,
    `s’engagent solidairement envers l’Administration des douanes et impôts indirects, pour les marchandises placées sous le régime ${DOTS} (code ${DOTS}) par la déclaration n° ${DOTS} du ${DOTS}, bureau de ${DOTS}, à :`,
    '1. représenter les marchandises à toute réquisition de l’administration pendant leur séjour sous le régime ;',
    `2. apurer le compte dans le délai de séjour fixé, soit au plus tard le ${DOTS}, par l’une des destinations autorisées (exportation, entreposage, cession autorisée ou mise à la consommation autorisée), au moyen des fiches d’imputation jointes aux déclarations de sortie (décret, art. 107 et 108) ;`,
    '3. tenir les écritures de suivi des marchandises placées, des produits compensateurs et des déchets (CDII, art. 116 ter), et régulariser les déchets taxables pendant la validité du compte (circ. n° 5458/313) ;',
    '4. à défaut d’apurement régulier, acquitter les droits et taxes dont les marchandises sont passibles, avec l’intérêt de retard et les pénalités encourues.',
    'Le soumissionnaire reconnaît qu’il demeure pénalement responsable de l’inexécution des engagements souscrits (CDII, art. 222-c) et que le mandat donné à un transitaire ne le décharge pas de ses obligations (circ. n° 5496/400). L’engagement prend fin par la délivrance du certificat de décharge, total ou partiel à proportion des quantités apurées (CDII, art. 117).',
    `Fait à ${DOTS}, le ${DOTS}. Le soumissionnaire (signature légalisée) : ${DOTS}   La caution (signature légalisée) : ${DOTS}`,
  ]),
  box('À savoir sur la caution', [
    'La banque valide sa caution électroniquement sur BADR ; sans validation, le dépôt de la déclaration est bloqué, et tout redressement doit être revalidé (circ. n° 5712/300 et 5724/300).',
    'La caution bancaire peut limiter son engagement aux sommes cautionnées : intérêts et pénalités restent alors à la charge de l’entreprise (CDII, art. 230).',
    'Schéma progressif des facilités : caution bancaire ou consignation, puis cautionnement mixte (20 % garantis, 80 % sur engagement, après au moins 3 mois sous RED et 10 opérations et/ou 2 MDH), puis cautionnement sur engagement des exportateurs (CA export ≥ 10 MDH, capital ≥ 500 000 DH) (circ. n° 6707/313).',
  ]),
  H1('Modèle C — Clause du mandat donné au transitaire'),
  P('**Usage.** Le mandat doit viser expressément la souscription des acquits à caution, et l’acceptation de cession pour être opposable ; il ne décharge pas le soumissionnaire (circ. n° 5496/400). Les mandats sont donnés via PortNet depuis le 01/03/2023 ; un mandat inactif pendant un an est annulé (circ. n° 6421/411).'),
  form([
    `La société ${DOTS} donne mandat à ${DOTS}, transitaire agréé n° ${DOTS}, pour accomplir en son nom les formalités de dédouanement, et notamment, de manière expresse :`,
    '☐ souscrire les acquits à caution afférents aux régimes économiques en douane ;',
    '☐ accepter, au nom du mandant, les cessions de marchandises placées sous régime suspensif ;',
    '☐ signer les fiches d’imputation jointes aux déclarations de sortie.',
    'Le mandant reconnaît que le présent mandat ne le décharge pas de ses engagements de soumissionnaire.',
    `Durée du mandat : du ${DOTS} au ${DOTS}. Fait à ${DOTS}, le ${DOTS}.`,
  ]),
  H1('2. Check-list d’ouverture et de suivi d’un compte'),
  checklist([
    ['La marchandise n’est pas exclue par l’article 115 ; les visas non suspendus (ONSSA, ANRT…) sont identifiés.', 'CDII, art. 114 et 115 ; circ. 6164/313'],
    ['Première opération en ATPA, TSD ou EIF : autorisation obtenue après enquête d’outillage.', 'Circ. n° 6538/313'],
    ['Nomenclature de fabrication, taux de rendement et de déchets documentés.', 'CDII, art. 136'],
    ['Garantie dimensionnée sur l’encours maximal ; caution validée sur BADR.', 'Circ. n° 6707/313 et 5712/300'],
    ['Date d’échéance contrôlée dès la mainlevée et saisie dans le tableau d’apurement.', 'Note D885/21'],
    ['Fiches d’imputation établies avec chaque déclaration de sortie.', 'Décret, art. 107'],
    ['Rapprochement mensuel du sommier BADR et de la comptabilité matières.', 'CDII, art. 116 ter'],
    ['Déchets taxables régularisés pendant la validité du compte.', 'Circ. n° 5458/313'],
    ['Ratio de mise à la consommation inférieur à 15 % des quantités exportées.', 'Circ. n° 6348/313'],
    ['Alertes à J-90 et J-60 ; certificat de décharge reçu par la banque.', 'Circ. n° 6052/300'],
  ]),
  H2('Sources'),
  P('Guide des procédures douanières Maroc, éd. 2026, n° 7-001 à 7-015 et annexe (modèle M2) ; Import Process Management, annexe D.3.'),
];

// ═════════════ KIT 02 — Guide des délais et du contentieux ═════════════
const k02g = [
  ...cover('Kit 02 · Régimes suspensifs et économiques', 'Guide des délais, des autorités et des sanctions', 'Tout ce qui se joue entre le placement sous régime et le certificat de décharge'),
  H1('1. Délais de séjour'),
  table(['Régime', 'Délai initial', 'Maximum', 'Référence'], [
    ['ATPA', '6 mois', '2 ans à compter de l’enregistrement de la déclaration d’importation (prolongations de 18 mois au plus)', 'Décret, art. 105 ; CDII, art. 137'],
    ['ATPA des artisans', '3 mois', '—', 'Circ. n° 6164/313, annexe II'],
    ['ATPA retouches', '6 mois', '—', 'Circ. n° 6164/313'],
    ['Cession de produits compensateurs d’ATPA (reliquat < 12 mois)', '1 an', '—', 'Circ. n° 6164/313, annexe I'],
    ['AT matériels Ca, Cc, D3, D9, D11', 'Temps nécessaire, 2 ans au plus', 'Jusqu’au double, par le ministre ou le directeur général délégué', 'Décret, art. 132'],
    ['AT matériels Cb', '1 an au plus', 'Jusqu’au double', 'Décret, art. 132'],
    ['AT autres biens de la catégorie D', '6 mois au plus', 'Jusqu’au double', 'Décret, art. 132'],
    ['AT expositions / essais / échantillons des unités exportatrices', '6 mois / 2 ans / 6 mois', '—', 'Circ. n° 6348/313, annexe I'],
    ['AT commerce triangulaire hors enceinte', '3 mois', '—', 'Note D885/21/ADII/100'],
    ['AT voyageurs', '6 mois (18 mois pour les bateaux de plaisance)', 'Jusqu’au double', 'Décret, art. 117'],
    ['Transformation sous douane (envois fractionnés)', '3 mois', '+ 9 mois au plus', 'Décret, art. 172 septies'],
    ['Compensation par équivalence', '2 ans, compensation incluse', '—', 'CDII, art. 142-4° et 5°'],
  ], [3000, 1900, 2800, 1938]),
  P('La cession d’une marchandise sous régime ne prolonge pas le délai (CDII, art. 129-2° et 149-2°).'),
  H1('2. Qui décide quoi'),
  table(['Décision', 'Autorité', 'Référence'], [
    ['Exportation hors délai en suite d’ATPA, AT, EIF ou EPP', 'Directeurs provinciaux, préfectoraux, des MEAD et des importations-exportations', 'Circ. n° 6348/313, annexe II'],
    ['Prorogation au-delà du délai réglementaire', 'Administration centrale', 'Circ. n° 6348/313, annexe II'],
    ['Destruction, abandon ou dons en exonération', 'Administration centrale', 'Circ. n° 6348/313, annexe II'],
    ['Imputation a posteriori d’un compte en cours ou échu', 'Ordonnateurs', 'Circ. n° 6348/313, annexe II'],
    ['Mise à la consommation en suite d’ATPA (code 040) ou d’AT (code 044)', 'Plus d’autorisation préalable : mainlevée après contrôle', 'Circ. n° 6348/313, annexe I'],
    ['Accès d’une nouvelle société à l’ATPA, la TSD ou l’EIF', 'Structures régionales gérant les comptes RED, sous huitaine', 'Circ. n° 6538/313'],
    ['Facilités de cautionnement', 'Commission d’agrément (chaque jeudi) ; délai de traitement de 30 jours', 'Circ. n° 6707/313'],
  ], [3600, 3700, 2338]),
  H1('3. Apurement et décharge'),
  B('Le compte s’apure globalement ou par apurements partiels successifs, au moyen de fiches d’imputation signées du déclarant et du soumissionnaire (décret, art. 107 et 108).'),
  B('Les éléments d’apurement déclarés (rendement, déchets) sont réputés admis si l’administration ne les conteste pas dans les 2 mois suivant l’enregistrement de la déclaration d’exportation (CDII, art. 136-2°).'),
  B('Le certificat de décharge, électronique, a la valeur du papier ; la banque libère l’opérateur sans délai à hauteur de la valeur déchargée (circ. n° 6052/300).'),
  B('Les soldes échus inférieurs à 500 DH sont exonérés ; les marchandises détruites par force majeure naturelle justifiée avant l’échéance aussi (CDII, art. 116 bis).'),
  B('La décharge sans observation n’empêche pas la constatation ultérieure d’infractions (CDII, art. 234-2°).'),
  H1('4. Mise à la consommation en suite d’ATPA'),
  table(['Situation', 'Base de taxation', 'Référence'], [
    ['Intrants ou produits compensateurs mis à la consommation par dérogation', 'Espèce, quantités, valeur et quotités du jour de la déclaration d’admission temporaire, plus intérêt de retard si les droits n’ont pas été consignés', 'CDII, art. 141-2° et 3°'],
    ['Produits compensateurs dans les proportions fixées par arrêté', 'Quotités du jour de la mise à la consommation, sur la valeur des intrants à cette date', 'CDII, art. 141-4°'],
    ['Part dispensée d’amende', '15 % des quantités exportées sous ATPA ; articles de 2e choix du textile-cuir', 'Circ. n° 6348/313, annexe I'],
    ['Liquidation BADR', 'Automatique aux conditions de l’importation initiale ; manuelle (mode « Autres ») pour la part de 15 %', 'Circ. n° 6325/313'],
  ], [3000, 4600, 2038]),
  H1('5. Sanctions'),
  table(['Manquement', 'Qualification et sanction', 'Référence'], [
    ['Abus volontaire d’un régime suspensif (vente non autorisée, substitution, détournement d’usage, décharge abusive)', 'Contravention de 1re classe', 'CDII, art. 285-8° et 286'],
    ['Impossibilité de présenter les marchandises (entrepôt, AT, EIF, TSD)', 'Présomption d’abus du régime, jusqu’à preuve contraire', 'CDII, art. 287'],
    ['Défaut d’exportation ou de mise en entrepôt dans les délais (ATPA, AT) ; défaut de régularisation (entrepôt, EIF, transit, TSD)', 'Contravention de 2e classe : amende d’une fois et demie les droits et taxes', 'CDII, art. 294-2° et 3°, 294 bis'],
    ['Déchets taxables non régularisés à l’échéance', 'Liquidation d’office des droits', 'Circ. n° 5458/313'],
    ['Inexécution des engagements du soumissionnaire', 'Responsabilité pénale du soumissionnaire ; caution appelée dans les limites de son engagement', 'CDII, art. 222-c et 230'],
    ['Infraction à un régime suspensif, ou prête-nom', 'Privation du bénéfice du régime par arrêté ministériel', 'CDII, art. 304'],
    ['Compte échu non régularisé', 'Suspension des facilités de cautionnement', 'Note n° 12014/313'],
  ], [3600, 3700, 2338]),
  box('Ce qui ne s’applique plus', ['Le barème réduit de 5 % et 10 % de la circulaire n° 6087/313 était une mesure liée à la COVID-19, valable jusqu’au 31/12/2020 : il ne peut plus être invoqué (Guide, n° 7-006).'], ROSE, RED),
  H1('6. Calendrier d’alertes recommandé'),
  table(['Moment', 'Action'], [
    ['Mainlevée', 'Contrôler la date d’échéance inscrite au compte et la saisir dans le tableau d’apurement.'],
    ['Chaque sortie', 'Joindre la fiche d’imputation à la déclaration de sortie.'],
    ['Chaque mois', 'Rapprocher le sommier BADR et la comptabilité matières ; suivre le ratio de mise à la consommation.'],
    ['J-90', 'Planifier l’apurement ; régulariser les déchets taxables.'],
    ['J-60', 'Déposer la demande de prorogation ou d’exportation hors délai auprès de l’autorité compétente.'],
    ['Après apurement', 'Obtenir le certificat de décharge et vérifier que la banque a réduit l’encours ; conserver les pièces.'],
  ], [2000, 7638]),
  H2('Sources'),
  P('Guide des procédures douanières Maroc, éd. 2026, n° 7-001 à 7-025 ; Import Process Management, annexe D.3.'),
];

// ═════════════ KIT 03 — Arbre de décision RGI ═════════════
const k03a = [
  ...cover('Kit 03 · Classement SH et contrôle a posteriori', 'Arbre de décision RGI 1 à 6', 'Classer une marchandise, documenter le raisonnement et sécuriser le classement face à un contrôle'),
  H1('1. L’arbre de décision'),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'png', data: fs.readFileSync('/home/claude/kits/out_rgi.png'), transformation: { width: 520, height: 670 } })] }),
  P('Les règles s’appliquent dans l’ordre. Seule la RGI 1 a valeur de point de départ obligatoire : on ne passe à la suivante que si la précédente ne permet pas de conclure. Les titres des sections et chapitres n’ont qu’une valeur indicative ; ce sont les libellés des positions et les notes qui font foi.'),
  H1('2. Comment l’ADII applique les RGI'),
  table(['Règle', 'Application par l’ADII', 'Exemple tiré des circulaires'], [
    ['RGI 1 et 6', 'Classement direct par les libellés de la position et de la sous-position ; les décisions les citent systématiquement.', 'Œufs entiers séchés : 0408.91.00.10 (circ. n° 6729/232) ; diffuseur ultrasonique, selon sa fonction principale : 8479.89.70.00 (circ. n° 6710/232)'],
    ['RGI 3 b)', 'Article composite : l’élément qui confère le caractère essentiel.', 'Tuyau en polyuréthane sur dévidoir, classé en totalité comme tuyau : 3917.33.00.00 (circ. n° 6709/232)'],
    ['RGI 5', 'Certains emballages suivent le produit qu’ils contiennent.', 'Circ. n° 6706/233, annexe I, art. 9'],
    ['Composition', 'L’état chimique décide : mélange non réagi ou composé défini.', 'Précurseur NCM : 3824.99.00.99 ; matériau cathodique NCM : 2853.90.90.90 (circ. n° 6714/232 et 6715/232)'],
    ['Notes complémentaires nationales', 'Elles fixent des seuils propres au tarif marocain et sont modifiées par arrêté.', 'Veaux : poids vif porté à 350 kg depuis le 10/08/2023 (circ. n° 6491/211)'],
  ], [1700, 3900, 4038]),
  H1('3. Les outils de sécurisation'),
  table(['Outil', 'Ce qu’il apporte', 'Référence'], [
    ['Décision anticipée', 'Réponse en 150 jours au plus ; validité de 5 ans pour le classement. Nulle rétroactivement si elle repose sur des indications fausses, inexactes ou incomplètes. Déposer la demande au moins cinq mois avant l’opération.', 'CDII, art. 45 ter ; modèle M1 du Guide'],
    ['Décision de classement', 'Prise à la demande du redevable ou à la suite d’un litige ; immédiatement exécutoire, valable jusqu’à une décision modificative ou un changement de nomenclature.', 'CDII, art. 15-2° et 3°'],
    ['Analyse de laboratoire', 'Frais à la charge de l’administration si la déclaration est confirmée, du redevable sinon ; une contre-analyse peut être demandée.', 'CDII, art. 81-2°'],
    ['Classement regroupé', 'Sur autorisation, sans augmentation ni diminution des droits ; le plus taxé à la demande du déclarant.', 'CDII, art. 15-4°'],
    ['Déclaration globale (import)', 'Depuis le 02/09/2026 : DUM initiale au code de l’article fini, puis DUM partielles ; régularisation en 365 jours, prorogeable d’un an au plus.', 'Circ. n° 6771/312 ; note D201/2026'],
    ['Commissions', 'En cas de désaccord sur l’espèce : commission locale de concertation, puis commission consultative et de recours.', 'CDII, art. 22 bis et 22 ter'],
  ], [2100, 5500, 2038]),
  H1('4. Fiche de classement à joindre au registre'),
  form([
    `Article : ${DOTS}  Réf. interne : ${DOTS}`,
    `Description : composition ${DOTS} ; présentation et conditionnement ${DOTS} ; usage ${DOTS} ; procédé ${DOTS}`,
    `Circulaires de classement consultées (série 232) : ${DOTS}`,
    `RGI 1 : positions envisagées et notes lues : ${DOTS}`,
    `RGI 2 à 5 (le cas échéant) : ${DOTS}`,
    `RGI 6 : sous-position SH retenue ${DOTS} ; sous-position nationale (10 chiffres) ${DOTS}`,
    `Positions écartées et motifs : ${DOTS}`,
    `Pièces : ☐ fiche technique  ☐ photos  ☐ bulletin d’analyse  ☐ décision anticipée n° ${DOTS}`,
    `Validé par (import) ${DOTS} et (technique) ${DOTS}, le ${DOTS}`,
  ]),
  H1('5. Erreurs fréquentes'),
  B('Classer d’après la composition élémentaire sans connaître l’état chimique du produit (Guide, n° 2-002).'),
  B('Classer un article composite selon la matière la plus chère, au lieu de l’élément qui confère le caractère essentiel (RGI 3 b).'),
  B('Garder une ancienne sous-position après une circulaire « études tarifaires » : la déclaration devient erronée même si le droit ne change pas (Guide, n° 2-001).'),
  B('Raisonner par analogie avec une circulaire portant sur un produit différent : une décision ne vaut que pour un produit identique (Guide, n° 2-005).'),
  B('Dédouaner le premier envoi d’un matériel livré en plusieurs lots avant d’avoir obtenu l’autorisation (Guide, n° 2-004).'),
  H2('Sources'),
  P('Guide des procédures douanières Maroc, éd. 2026, n° 2-001 à 2-005, 2-060, 2-061 et annexe (modèle M1, figure 1) ; CDII, art. 2, 15, 22 bis, 45 ter, 81-2° ; circulaires ADII série 232.'),
];

// ═════════════ KIT 04 — Notice méthodologique unifiée ═════════════
const k04 = [
  ...cover('Kit 04 · Pack conformité intégral', 'Notice méthodologique unifiée', 'Utiliser les trois kits comme un seul programme de conformité import'),
  H1('1. Ce que contient le pack'),
  table(['Kit', 'Fichiers', 'Question traitée'], [
    ['01 · Origine préférentielle et ALE', 'Matrice d’éligibilité (Excel) ; modèles de déclarations et fiche d’origine (Word) ; check-list d’audit des justificatifs (Word)', 'Puis-je bénéficier du droit préférentiel, et puis-je le prouver ?'],
    ['02 · Régimes suspensifs et économiques', 'Tableau d’apurement (Excel) ; dossier de demande et d’engagement (Word) ; guide des délais et sanctions (Word)', 'Mes comptes seront-ils apurés à temps et sans pénalité ?'],
    ['03 · Classement SH et contrôle a posteriori', 'Registre des codes SH (Excel) ; auto-diagnostic (Excel) ; arbre de décision RGI (Word)', 'Mes classements et mes dossiers tiendront-ils face à un contrôle ?'],
    ['04 · Pack intégral', 'Les trois kits et la présente notice', 'Comment piloter l’ensemble ?'],
  ], [2700, 4400, 2538]),
  H1('2. Le cadre : un programme de conformité en dix composantes'),
  P('Les programmes de conformité import reposent sur une logique de diligence raisonnable : l’entreprise démontre qu’elle a mis en place des procédures, des contrôles et des ressources proportionnés à ses risques (Import Process Management, 23.1). Les kits outillent les composantes les plus exposées.'),
  table(['Composante', 'Outil du pack'], [
    ['1. Gouvernance (propriétaire du processus, RACI, délégations)', 'Auto-diagnostic, domaine « Gouvernance »'],
    ['2. Politique et procédures écrites', 'Présente notice ; check-lists des kits 01 et 02'],
    ['3. Base articles (classement, origine, valeur, réglementations)', 'Registre des codes SH ; fiche d’origine'],
    ['4. Partenaires (transitaires, fournisseurs)', 'Clause de coopération ; clause de mandat'],
    ['5. Screening avant commande', 'Colonne « Documents et contrôles requis » du registre'],
    ['6. Contrôles clés', 'Calendrier ci-dessous'],
    ['7. Gestion des régimes et franchises', 'Tableau d’apurement ; guide des délais'],
    ['8. Archivage (4 ans)', 'Suivi des preuves ; auto-diagnostic, domaine « Archivage »'],
    ['9. Formation et veille', 'Mise à jour du pack à chaque loi de finances et circulaire'],
    ['10. Audit et amélioration', 'Auto-diagnostic annuel ; check-list d’audit'],
  ], [5000, 4638]),
  H1('3. La méthode en cinq temps'),
  N('**Mesurer.** Remplir l’auto-diagnostic (kit 03) avec les responsables import, achats, production et finance. L’indice par domaine désigne les priorités.', 'num'),
  N('**Fonder la base articles.** Classer chaque article dans le registre SH, avec double validation et fiche de classement ; pour les produits sous préférence, établir la fiche d’origine par accord.', 'num'),
  N('**Sécuriser les flux.** Dérouler la check-list d’origine avant chaque déclaration sous préférence ; tenir le suivi des preuves.', 'num'),
  N('**Piloter les régimes.** Saisir chaque compte dans le tableau d’apurement dès la mainlevée ; traiter les alertes J-90 et J-60.', 'num'),
  N('**Réviser.** Revue post-mainlevée, rapprochements mensuels, audit annuel ; refaire l’auto-diagnostic et mesurer le progrès.', 'num'),
  H1('4. Le calendrier des contrôles clés'),
  table(['Moment', 'Contrôle', 'Erreur prévenue'], [
    ['Création d’un article', 'Double validation du classement ; recherche de circulaires de classement', 'Sous-position erronée'],
    ['Signature du contrat', 'Documents exigés du fournisseur, dont la preuve d’origine et la clause de coopération', 'Preuve d’origine manquante'],
    ['Avant expédition', 'Preuve d’origine reçue et contrôlée ; titre d’importation valide', 'Droit commun au lieu du préférentiel'],
    ['Avant signature de la DUM', 'Rapprochement facture / DUM / titre / preuve d’origine ; valeur reconstituée selon l’Incoterm', 'Fausse déclaration'],
    ['J+7 à J+30 après mainlevée', 'Revue des écarts DUM / réception / comptabilité', 'Infraction transformée en régularisation spontanée'],
    ['Chaque mois', 'Rapprochement des comptes RED ; échéanciers ; consignations à récupérer', 'Comptes échus'],
    ['Chaque année', 'Audit d’un échantillon de dossiers ; auto-diagnostic', 'Redressement en contrôle a posteriori'],
  ], [2300, 4400, 2938]),
  P('Source : Import Process Management, 23.2.', { run: { italics: true, color: GREY } }),
  H1('5. Quand une erreur est découverte'),
  P('Dans les 30 jours suivant la mainlevée, la révélation volontaire peut dispenser de tout ou partie des pénalités, sauf si le déclarant a déjà été informé d’un contrôle ou d’une enquête ; la demande indique les énonciations rectifiées et les motifs, avec les justificatifs (CDII, art. 78-3° ; décret, art. 74 et 74 bis). Au-delà, la bonne foi, la régularisation spontanée et l’absence d’antécédents sont les éléments pris en compte en transaction. La pire option est de laisser l’erreur se répéter : chaque déclaration est une infraction distincte, et la récidive dans les trois ans d’une transaction double le maximum de l’amende (CDII, art. 257 ter).'),
  box('Délais à garder en tête', [
    'Contrôle a posteriori et reprise des droits : 4 ans ; en cas de fraude, à compter de la découverte (CDII, art. 86 bis, 99 bis et 99 ter).',
    'Conservation des documents : 4 ans (CDII, art. 42-2° et 72) ; preuves d’origine UE et Turquie : 3 ans au moins ; États-Unis : 5 ans.',
    'Décisions anticipées : 5 ans (classement), 3 ans (origine), 1 an (valeur) (CDII, art. 45 ter-2°).',
  ]),
  H1('6. Mise à jour du pack'),
  P('Les kits sont à jour des textes disponibles au 04/10/2026. Les points à surveiller en priorité : les circulaires « études tarifaires » (nomenclature), les circulaires de classement de la série 232, la série 233 (règles d’origine : alignement attendu de l’AELE et d’Agadir sur les règles révisées), la série 313 (régimes économiques et cautionnement) et la loi de finances. Chaque mise à jour du pack est datée sur la page de garde des fichiers.'),
  H2('Sources'),
  P('Guide des procédures douanières Maroc, éd. 2026 ; Import Process Management (maj 17/10/2026), chapitres 5, 21 et 23, annexe D.'),
];

(async () => {
  await makeDoc('Kit01_Modeles_declarations_et_fiche_origine.docx', 'Kit 01 · Origine préférentielle et ALE', k01m);
  await makeDoc('Kit01_Checklist_audit_justificatifs_origine.docx', 'Kit 01 · Origine préférentielle et ALE', k01c);
  await makeDoc('Kit02_Dossier_demande_et_engagement_RED.docx', 'Kit 02 · Régimes suspensifs et économiques', k02d);
  await makeDoc('Kit02_Guide_delais_autorites_sanctions.docx', 'Kit 02 · Régimes suspensifs et économiques', k02g);
  await makeDoc('Kit03_Arbre_decision_RGI.docx', 'Kit 03 · Classement SH et contrôle a posteriori', k03a);
  await makeDoc('Kit04_Notice_methodologique_unifiee.docx', 'Kit 04 · Pack conformité intégral', k04, ['num']);
  console.log(fs.readdirSync(OUT).join('\n'));
})();
