"""Charte IXP — palette, typographie et formes de la page « Présentation de notre plateforme en 5 espaces ».

Les pages existantes utilisent des variables CSS communes (--ink, --gold, --border, --bg…).
On les redéfinit sur la palette de la vitrine, ce qui aligne toutes les pages sans réécrire
leur mise en page. Utilisé par build_chrome.py (pages HTML autonomes) ; le même bloc est
recopié dans styles/site.css pour les pages Next.js (.xs-wrapped main).
"""

VARS = {
    # encres et textes
    '--ink': '#14120F', '--ink2': '#3B3631', '--ink3': '#7A7168', '--text': '#14120F', '--text2': '#3B3631',
    '--mid': '#3B3631', '--muted': '#7A7168', '--muted2': '#A39886', '--inks': '#3B3631', '--inkm': '#7A7168',
    # fonds et surfaces
    '--bg': '#FAF7F0', '--bg2': '#F4EFE3', '--paper': '#FAF7F0', '--surface': '#FFFFFF', '--card': '#FFFFFF', '--white': '#FFFFFF',
    # filets
    '--border': '#E6DCC7', '--border2': '#D6C9AC', '--border-mid': '#D6C9AC', '--rule': '#E6DCC7', '--bd': '#E6DCC7',
    # or
    '--gold': '#A8822F', '--gold2': '#C9A84C', '--gold-h': '#C9A84C', '--gold3': '#EBDDB8', '--gold4': '#F4EBD3',
    '--gold-pale': '#F4EBD3', '--gold-bg': '#F4EBD3', '--gold-dark': '#8C6B18',
    '--gold-dim': 'rgba(168,130,47,.10)', '--gold-bd': 'rgba(168,130,47,.28)', '--gold-line': 'rgba(168,130,47,.28)',
    # couleurs d'étape (mêmes teintes que les tuiles de navigation)
    '--navy': '#153E82', '--blue': '#1F4E9A', '--blue-bg': '#EDF3FC', '--blue-bd': '#C9DAF3',
    '--green': '#1E7346', '--green-bg': '#EBF6EF', '--green-bd': '#C3E3CF',
    '--red': '#A82D3C', '--red-bg': '#FCEEF0', '--red-bd': '#F0C9CF',
    '--amber': '#9A620C', '--amber-bg': '#FCF4E3', '--amber-bd': '#EFD9A8',
    '--teal': '#16706B', '--teal-bg': '#E8F6F5', '--teal-bd': '#BFE2DF',
    '--purple': '#5B3FA0', '--purple-bg': '#F2EEFB', '--purple-bd': '#D8CDF1',
    # formes
    '--r': '10px', '--r-lg': '16px', '--r-xl': '20px',
    '--sh': '0 1px 2px rgba(20,18,15,.06)', '--sh-md': '0 18px 30px -22px rgba(20,18,15,.35)',
    '--shadow': '0 1px 2px rgba(20,18,15,.06)',
    # polices
    '--mono': "'JetBrains Mono',ui-monospace,monospace",
}

SERIF = "'DM Serif Display',Georgia,serif"
SANS = "'DM Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif"


def block(scope: str, text_scope: str) -> str:
    """scope : où redéfinir les variables ; text_scope : où appliquer la typographie."""
    v = ';'.join(f'{k}:{val}' for k, val in VARS.items())
    return (
        f'{scope}{{{v}}}\n'
        f'{text_scope}{{font-family:{SANS}}}\n'
        f'{text_scope} h1,{text_scope} h2{{font-family:{SERIF} !important;font-weight:400 !important;letter-spacing:-.01em}}\n'
        f'{text_scope} h1 em,{text_scope} h2 em{{font-style:italic}}\n'
    )


if __name__ == '__main__':
    print(block('.xs-wrapped main', '.xs-wrapped main'))
