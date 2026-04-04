"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function RecherchePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    players: any[];
    teams: any[];
    articles: any[];
    leagues: any[];
  }>({ players: [], teams: [], articles: [], leagues: [] });
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults({ players: [], teams: [], articles: [], leagues: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 300);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const hasResults = results.players.length > 0 || results.teams.length > 0 || results.articles.length > 0 || results.leagues.length > 0;

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="font-display text-3xl font-bold">
          <span className="text-emerald-400">Recherche</span>
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Joueurs, équipes, ligues, articles
        </p>

        {/* Search input */}
        <div className="mt-6 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <label htmlFor="search-input" className="sr-only">Rechercher</label>
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un joueur, une équipe, un article..."
            className="w-full rounded-xl border border-gray-700 bg-dark-card px-10 py-3 text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-sm"
            autoFocus
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
            </div>
          )}
        </div>

        {/* Results */}
        {query.length >= 2 && !loading && (
          <div className="mt-6 space-y-6">
            {/* Leagues */}
            {results.leagues.length > 0 && (
              <div>
                <h2 className="font-display text-sm font-bold text-gray-400 mb-2">Ligues</h2>
                <div className="space-y-1">
                  {results.leagues.map((l: any) => (
                    <Link key={l.slug} href={`/ligue/${l.slug}`} className="flex items-center gap-3 rounded-lg bg-dark-card px-4 py-3 hover:bg-gray-800/50 transition-colors">
                      {l.logo_url && <Image src={l.logo_url} alt={`Logo ${l.name}`} width={24} height={24} className="h-6 w-6 object-contain" />}
                      <span className="text-sm font-medium text-white">{l.name}</span>
                      {l.country && <span className="text-xs text-gray-500">{l.country}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Teams */}
            {results.teams.length > 0 && (
              <div>
                <h2 className="font-display text-sm font-bold text-gray-400 mb-2">Équipes</h2>
                <div className="space-y-1">
                  {results.teams.map((t: any) => (
                    <Link key={t.slug} href={`/equipe/${t.slug}`} className="flex items-center gap-3 rounded-lg bg-dark-card px-4 py-3 hover:bg-gray-800/50 transition-colors">
                      {t.logo_url && <Image src={t.logo_url} alt={`Logo ${t.name}`} width={24} height={24} className="h-6 w-6 object-contain" />}
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-white block truncate">{t.name}</span>
                        {t.league_name && <span className="text-xs text-gray-500">{t.league_name}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Players */}
            {results.players.length > 0 && (
              <div>
                <h2 className="font-display text-sm font-bold text-gray-400 mb-2">Joueurs</h2>
                <div className="space-y-1">
                  {results.players.map((p: any) => (
                    <Link key={p.slug} href={`/joueur/${p.slug}`} className="flex items-center gap-3 rounded-lg bg-dark-card px-4 py-3 hover:bg-gray-800/50 transition-colors">
                      {p.photo_url ? (
                        <Image src={p.photo_url} alt={`Photo ${p.name}`} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                          {p.name?.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-white block truncate">{p.name}</span>
                        <div className="flex gap-2">
                          {p.team_name && <span className="text-xs text-gray-500">{p.team_name}</span>}
                          {p.position && (
                            <Badge className="bg-gray-700 text-[10px] text-gray-400 border-gray-600 px-1 py-0">
                              {p.position}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Articles */}
            {results.articles.length > 0 && (
              <div>
                <h2 className="font-display text-sm font-bold text-gray-400 mb-2">Articles</h2>
                <div className="space-y-1">
                  {results.articles.map((a: any) => (
                    <Link key={a.slug} href={`/actu/${a.slug}`} className="block rounded-lg bg-dark-card px-4 py-3 hover:bg-gray-800/50 transition-colors">
                      <span className="text-sm font-medium text-white block truncate">{a.title}</span>
                      <div className="flex gap-2 mt-1">
                        {a.type && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1 py-0">
                            {a.type}
                          </Badge>
                        )}
                        {a.published_at && (
                          <span className="text-xs text-gray-500">
                            {new Date(a.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!hasResults && (
              <Card className="border-gray-800 bg-dark-card p-8 text-center">
                <p className="text-sm text-gray-500">Aucun résultat pour &ldquo;{query}&rdquo;</p>
              </Card>
            )}
          </div>
        )}

        {query.length < 2 && (
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">Tapez au moins 2 caractères pour lancer la recherche</p>
          </div>
        )}
      </div>
    </main>
  );
}
