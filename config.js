// easyplay – Einstellungen für die Fragen-Datenbank
// Leer lassen = Fragen werden aus fragen-1.json bis fragen-3.json geladen.
// Für Supabase: Project URL und den öffentlichen Schlüssel (anon / publishable key) eintragen.
// Niemals den geheimen "service_role"- oder "secret"-Schlüssel hier eintragen!
window.EP_CONFIG = {
  supabaseUrl: "",   // z. B. "https://abcdefgh.supabase.co"
  supabaseKey: "",   // öffentlicher Schlüssel (anon / publishable)
  teilenUrl: "https://djsunji.github.io/easyplay/",   // Adresse für geteilte Qeels-Links
  fragenDateien: ["fragen-1.json", "fragen-2.json", "fragen-3.json"]
};
