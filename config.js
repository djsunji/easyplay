// easyplay – Einstellungen für die Fragen-Datenbank
// Leer lassen = Fragen werden aus fragen-1.json bis fragen-3.json geladen.
// Für Supabase: Project URL und den öffentlichen Schlüssel (anon / publishable key) eintragen.
// Niemals den geheimen "service_role"- oder "secret"-Schlüssel hier eintragen!
window.EP_CONFIG = {
  supabaseUrl: "",   // z. B. "https://abcdefgh.supabase.co"
  supabaseKey: "",   // öffentlicher Schlüssel (anon / publishable)
  teilenUrl: "https://djsunji.github.io/easyplay/",   // Adresse für geteilte Qeels-Links
  texteDateien2: ["texte2-1.json", "texte2-2.json", "texte2-3.json", "texte2-4.json", "texte2-5.json", "texte2-6.json", "texte2-7.json"],
  fragenDateien: ["fragen-1.json", "fragen-2.json", "fragen-3.json", "fragen-4.json", "fragen-5.json", "fragen-6.json", "fragen-7.json", "fragen-8.json", "fragen-9.json", "fragen-10.json", "fragen-11.json", "fragen-12.json", "fragen-13.json", "fragen-14.json", "fragen-15.json", "fragen-16.json", "fragen-17.json", "fragen-18.json"]
};
