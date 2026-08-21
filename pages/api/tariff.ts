import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET uniquement" });

  const { sh } = req.query;
  if (!sh || typeof sh !== "string") return res.status(400).json({ error: "Paramètre sh manquant" });

  const code = sh.trim().replace(/\s/g, "");
  if (!code) return res.status(400).json({ error: "Code SH invalide" });

  const supabase = getSupabase();

  // 1. Recherche exacte sur code_sh
  let { data, error } = await supabase
    .from("tarifs")
    .select("code_sh, designation_clean, taux_droit, taux_raw, unite_norm, est_feuille")
    .eq("code_sh", code)
    .limit(1);

  // 2. Si non trouvé, chercher les feuilles (lignes tarifaires finales) avec ce préfixe
  if (!data?.length && !error) {
    const result = await supabase
      .from("tarifs")
      .select("code_sh, designation_clean, taux_droit, taux_raw, unite_norm, est_feuille")
      .ilike("code_sh", `${code}%`)
      .eq("est_feuille", true)
      .limit(10);
    data = result.data;
    error = result.error;
  }

  // 3. Si toujours rien, chercher sans filtre est_feuille
  if (!data?.length && !error) {
    const result = await supabase
      .from("tarifs")
      .select("code_sh, designation_clean, taux_droit, taux_raw, unite_norm, est_feuille")
      .ilike("code_sh", `${code}%`)
      .limit(10);
    data = result.data;
    error = result.error;
  }

  if (error) return res.status(500).json({ error: error.message });
  if (!data?.length) return res.status(404).json({ error: "Position SH non trouvée dans la nomenclature tarifaire" });

  return res.status(200).json({ results: data });
}
