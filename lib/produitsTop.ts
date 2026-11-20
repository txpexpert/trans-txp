// lib/produitsTop.ts — les 100 premières positions SH (4 chiffres) qui ont leur page publique.
// Sélection : positions les plus litigieuses (décisions de classement publiées), puis écart de droit
// entre sous-positions et nombre de lignes tarifaires (tarif 2026). Toute autre position reste
// accessible à /produits/<code>, générée à la première visite.
export const POSITIONS_TOP = ('4203,3824,2106,2309,1806,3307,1901,2404,3304,2101,4202,1207,1905,1302,1902,2905,3301,3401,1515,2907,' +
  '2932,0102,0202,2902,5604,0902,5607,1301,2901,5308,0104,0405,3305,5311,0206,5302,1904,2202,1704,1001,' +
  '0409,8537,0402,8704,3105,0403,8531,8504,8536,8703,8479,2008,7326,6404,0207,3002,8711,1211,8507,0105,' +
  '1103,3003,3808,8543,8705,8716,0910,9028,8302,0401,6210,1602,2009,2710,3004,4016,4421,5512,7210,8421,' +
  '8481,8516,8708,9405,0210,3006,3102,3921,3923,7007,3005,8517,9406,1006,1104,2005,4601,1202,0406,0802').split(',')
