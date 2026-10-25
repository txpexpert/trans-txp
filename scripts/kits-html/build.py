import importlib, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from engine import build
OUT = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/kits/html/out'
os.makedirs(OUT, exist_ok=True)
names = sys.argv[2:] or ['kit01', 'kit02', 'kit03', 'kit04']
for n in names:
    m = importlib.import_module(n)
    fn = {'kit01': 'Kit01_Origine_preferentielle_ALE.html', 'kit02': 'Kit02_Regimes_suspensifs_economiques.html',
          'kit03': 'Kit03_Classement_SH_controle_a_posteriori.html', 'kit04': 'Kit04_Pack_conformite_integral.html'}[n]
    open(os.path.join(OUT, fn), 'w', encoding='utf-8').write(build(m.KIT))
    print(fn, os.path.getsize(os.path.join(OUT, fn)))
