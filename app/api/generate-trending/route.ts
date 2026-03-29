import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { generateArticle } from "@/lib/claude";
import { getArticleImages, injectImagesIntoHTML } from "@/lib/images";

export const maxDuration = 300;

const SYSTEM_PROMPT = `Tu es le rédacteur en chef de 360 Foot, un média d'actualité football francophone couvrant l'Afrique et l'Europe.

Règles strictes :
- Rédige en français uniquement.
- L'article doit faire entre 500 et 800 mots.
- Ton professionnel, engageant, style journalistique sportif haut de gamme.
- Utilise des données RÉELLES et ACTUELLES (saison 2024-2025 / mars 2026).
- IMPORTANT : Le champ "content" doit être en HTML pur (balises <p>, <h2>, <h3>, <strong>, <ul>, <li>, <blockquote>). JAMAIS de markdown. Pas de <h1>.
- Le champ "excerpt" doit être du texte brut (1-2 phrases max).
- Inclus des statistiques, des faits, du contexte tactique.
- Retourne UNIQUEMENT un JSON valide avec : title, content, excerpt, seo_title, seo_description, tags (array de strings).`;

interface TrendingTopic {
  subject: string;
  type: "player_profile" | "preview" | "recap" | "transfer" | "result";
  prompt: string;
  tags: string[];
  imageQuery: string;
}

const TOPICS: TrendingTopic[] = [
  {
    subject: "mbappe-real-madrid-saison-2025-2026",
    type: "player_profile",
    prompt: `Rédige un article de profil sur Kylian Mbappé au Real Madrid en mars 2026.

Informations à utiliser :
- Kylian Mbappé, 27 ans, attaquant français
- Transféré du PSG au Real Madrid à l'été 2024 (transfert libre)
- Saison 2025-2026 au Real Madrid : son adaptation, ses performances
- Statistiques approximatives saison en cours : ~35 matchs, ~25 buts, ~8 passes décisives en Liga
- Joue aux côtés de Vinicius Jr, Bellingham, Rodrygo
- International français : 80+ sélections, 45+ buts
- Palmarès : 6x champion de France, 1x Champions League (2024-2025 potentiellement), Coupe du monde 2018, finaliste 2022
- Style : vitesse fulgurante, finition clinique, dribbles dévastateurs
- Parle de son impact sur La Liga et la rivalité avec Barcelone

Retourne en JSON : title, content, excerpt, seo_title, seo_description, tags.`,
    tags: ["Mbappé", "Real Madrid", "La Liga", "France"],
    imageQuery: "football stadium Real Madrid night",
  },
  {
    subject: "cristiano-ronaldo-al-nassr-2026",
    type: "player_profile",
    prompt: `Rédige un article de profil sur Cristiano Ronaldo à Al-Nassr en mars 2026.

Informations à utiliser :
- Cristiano Ronaldo, 41 ans, attaquant portugais
- À Al-Nassr depuis janvier 2023 en Saudi Pro League
- Continue de battre des records malgré son âge
- Statistiques approximatives 2025-2026 : ~30 matchs, ~20 buts en SPL
- Record historique : 900+ buts en carrière, 5 Ballons d'Or
- Sélection portugaise : 200+ sélections, 130+ buts (meilleur buteur de l'histoire en sélection)
- Impact sur le football saoudien : affluences records, médiatisation
- Parle de la question de sa retraite, de son héritage
- Style : détermination, physique exceptionnel, jeu aérien, frappe de loin

Retourne en JSON : title, content, excerpt, seo_title, seo_description, tags.`,
    tags: ["Cristiano Ronaldo", "Al-Nassr", "Saudi Pro League", "Portugal"],
    imageQuery: "football player celebration goal",
  },
  {
    subject: "lamine-yamal-prodige-barcelone-2026",
    type: "player_profile",
    prompt: `Rédige un article de profil sur Lamine Yamal au FC Barcelone en mars 2026.

Informations à utiliser :
- Lamine Yamal, 18 ans, ailier droit espagnol d'origine marocaine et équato-guinéenne
- Prodige formé à La Masia, intégré en équipe première à 15 ans
- Champion d'Europe avec l'Espagne (Euro 2024) — plus jeune buteur de l'histoire de l'Euro
- Saison 2025-2026 : titulaire indiscutable au Barça, ~35 matchs, ~12 buts, ~15 passes décisives
- Comparé à Messi pour sa vision du jeu et sa technique
- Valeur marchande estimée à 200M€+
- Style : dribbles, passes décisives, vision du jeu exceptionnelle, pied gauche magique
- Parle de son évolution, son rôle au Barça sous Flick, et son avenir

Retourne en JSON : title, content, excerpt, seo_title, seo_description, tags.`,
    tags: ["Lamine Yamal", "FC Barcelone", "La Liga", "Espagne"],
    imageQuery: "Barcelona football camp nou stadium",
  },
  {
    subject: "equipe-france-qualifications-coupe-du-monde-2026",
    type: "recap",
    prompt: `Rédige un article récap sur l'équipe de France et les qualifications pour la Coupe du monde 2026.

Informations à utiliser :
- Coupe du monde 2026 aux USA, Mexique et Canada (juin-juillet 2026)
- La France, finaliste en 2022 et championne en 2018
- Didier Deschamps toujours sélectionneur (fin de contrat après le Mondial 2026)
- Qualifications UEFA : la France dans un groupe avec les Pays-Bas, la Grèce, l'Irlande, Gibraltar
- Effectif clé : Mbappé, Griezmann (retraite internationale ?), Tchouaméni, Saliba, Upamecano, Camavinga, Dembélé
- Nouvelles générations : Zaïre-Emery, Barcola, Koné
- Enjeux : dernière compétition de Deschamps, question de la succession Griezmann
- Style : 4-3-3, attaque rapide, puissance physique

Retourne en JSON : title, content, excerpt, seo_title, seo_description, tags.`,
    tags: ["Équipe de France", "Coupe du monde 2026", "Deschamps", "Qualifications"],
    imageQuery: "France football national team blue jersey",
  },
  {
    subject: "bresil-coupe-du-monde-2026-renovation",
    type: "recap",
    prompt: `Rédige un article récap sur l'équipe du Brésil et sa préparation pour la Coupe du monde 2026.

Informations à utiliser :
- Le Brésil, 5 fois champion du monde, n'a pas gagné depuis 2002
- Élimination décevante en quarts de finale du Mondial 2022
- Nouveau cycle avec un effectif rajeuni
- Joueurs clés : Vinicius Jr (Real Madrid), Rodrygo, Endrick, Marquinhos, Paquetá
- Qualifications CONMEBOL : parcours difficile, le Brésil a dû lutter pour se qualifier
- Questions sur le sélectionneur et le système tactique
- La pression du football brésilien : samba style vs pragmatisme moderne
- L'objectif de ramener la 6ème étoile

Retourne en JSON : title, content, excerpt, seo_title, seo_description, tags.`,
    tags: ["Brésil", "Coupe du monde 2026", "Vinicius Jr", "Seleção"],
    imageQuery: "Brazil football yellow jersey Maracana",
  },
  {
    subject: "kenya-harambee-stars-football-africain-2026",
    type: "recap",
    prompt: `Rédige un article sur le football kenyan et les Harambee Stars en mars 2026.

Informations à utiliser :
- Le Kenya (Harambee Stars) : une nation en développement dans le football africain
- Dernière participation à la CAN : 2019 en Égypte
- Michael Olunga : star kenyane, attaquant prolifique (a joué au Japon, en Arabie Saoudite)
- La Kenya Premier League : championnat en croissance
- Objectif : qualification pour la CAN 2025 (Maroc) et développement du football jeune
- Rivalités est-africaines : Kenya vs Tanzanie, Kenya vs Ouganda
- Infrastructures en développement, académies de football
- Les défis : corruption, manque d'investissement, mais un potentiel énorme
- Population jeune passionnée de football

Retourne en JSON : title, content, excerpt, seo_title, seo_description, tags.`,
    tags: ["Kenya", "Harambee Stars", "Football africain", "Michael Olunga"],
    imageQuery: "African football stadium Kenya",
  },
  {
    subject: "victor-osimhen-meilleur-attaquant-africain-2026",
    type: "player_profile",
    prompt: `Rédige un profil sur Victor Osimhen, le meilleur attaquant africain du moment en mars 2026.

Informations à utiliser :
- Victor Osimhen, 27 ans, attaquant nigérian
- A quitté Naples après le Scudetto 2023 — prêt/transféré à un grand club européen (Galatasaray puis potentiellement PSG, Chelsea ou retour en Serie A)
- International nigérian : 30+ sélections, 20+ buts avec les Super Eagles
- Style : puissance physique, vitesse, jeu de tête dévastateur, pressing intense
- Parcours : Wolfsburg → Lille → Naples → ?
- Meilleur buteur de Serie A 2022-2023
- Un des attaquants les plus chers du monde (clause à 130M€ à Naples)
- Rôle clé avec le Nigeria pour les qualifications Coupe du monde 2026

Retourne en JSON : title, content, excerpt, seo_title, seo_description, tags.`,
    tags: ["Victor Osimhen", "Nigeria", "Super Eagles", "Football africain"],
    imageQuery: "Nigerian football player striker goal",
  },
  {
    subject: "sadio-mane-legende-football-africain-2026",
    type: "player_profile",
    prompt: `Rédige un profil sur Sadio Mané, légende du football africain, en mars 2026.

Informations à utiliser :
- Sadio Mané, 34 ans, attaquant sénégalais
- Parcours légendaire : Metz → Red Bull Salzburg → Southampton → Liverpool → Bayern Munich → Al-Nassr
- Champion d'Afrique avec le Sénégal (CAN 2022) — héros national
- Palmarès à Liverpool : Champions League 2019, Premier League 2020
- International sénégalais : 100+ sélections, 35+ buts
- Un des meilleurs joueurs africains de l'histoire
- Style : vitesse, dribbles, générosité, esprit collectif
- Impact humanitaire : construit hôpitaux et écoles au Sénégal
- Saison 2025-2026 à Al-Nassr aux côtés de Cristiano Ronaldo

Retourne en JSON : title, content, excerpt, seo_title, seo_description, tags.`,
    tags: ["Sadio Mané", "Sénégal", "Al-Nassr", "Football africain"],
    imageQuery: "Senegal football player African champion",
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { slug: string; status: string; error?: string }[] = [];
  const supabase = createClient();

  for (const topic of TOPICS) {
    const slug = slugify(topic.subject);

    try {
      // Check if article already exists
      const { data: existing } = await supabase
        .from("articles")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existing) {
        results.push({ slug, status: "skipped (exists)" });
        continue;
      }

      // Generate article with Claude
      console.log(`Generating article: ${slug}`);
      const raw = await generateArticle(SYSTEM_PROMPT, topic.prompt);

      // Parse JSON from response
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      // Get images from Pexels
      let contentWithImages = parsed.content;
      let ogImageUrl: string | null = null;

      try {
        const images = await getArticleImages({
          title: parsed.title,
          teams: topic.tags.slice(0, 2),
          league: topic.tags[topic.tags.length - 1] || "",
          type: topic.type,
          tags: topic.tags,
        });

        if (images.length > 0) {
          ogImageUrl = images[0].url;
          contentWithImages = injectImagesIntoHTML(parsed.content, images);
        }
      } catch (imgErr) {
        console.error(`Image error for ${slug}:`, imgErr);
      }

      // Insert into Supabase
      const { error: insertError } = await supabase.from("articles").insert({
        title: parsed.title,
        slug,
        excerpt: parsed.excerpt,
        content: contentWithImages,
        type: topic.type,
        seo_title: parsed.seo_title || parsed.title,
        seo_description: parsed.seo_description || parsed.excerpt,
        og_image_url: ogImageUrl,
        tags: parsed.tags || topic.tags,
        published_at: new Date().toISOString(),
      });

      if (insertError) {
        results.push({ slug, status: "error", error: insertError.message });
      } else {
        results.push({ slug, status: "created" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ slug, status: "error", error: msg });
      console.error(`Error generating ${slug}:`, msg);
    }
  }

  return NextResponse.json({
    generated: results.filter((r) => r.status === "created").length,
    skipped: results.filter((r) => r.status.startsWith("skipped")).length,
    errors: results.filter((r) => r.status === "error").length,
    details: results,
  });
}
