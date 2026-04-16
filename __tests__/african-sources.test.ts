/**
 * Tests unitaires pour isSeniorMenChampionshipArticle.
 *
 * Usage : npx tsx --test __tests__/african-sources.test.ts
 *     ou : npx jest __tests__/african-sources.test.ts (si jest configuré)
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck — tests exécutés via jest/vitest, pas compilés par tsc prod
import { isSeniorMenChampionshipArticle } from "../lib/scrapers/african-sources";

const BENIN_CLUBS = ["ASEC Mimosas", "San-Pédro", "Stade d'Abidjan", "Rahimo FC", "USFA"];

describe("isSeniorMenChampionshipArticle", () => {
  // ── DOIT GARDER ──
  it("garde un article avec mot-clé championnat", () => {
    const r = isSeniorMenChampionshipArticle({ title: "Celtiis Ligue 1 J23 : résultats" });
    expect(r.keep).toBe(true);
  });

  it("garde un article avec nom de club connu", () => {
    const r = isSeniorMenChampionshipArticle({
      title: "Rahimo FC sacré champion du Fasofoot",
      knownClubs: BENIN_CLUBS,
    });
    expect(r.keep).toBe(true);
  });

  it("garde un article Botola Pro", () => {
    const r = isSeniorMenChampionshipArticle({ title: "Botola Pro : Wydad vs Raja, analyse" });
    expect(r.keep).toBe(true);
  });

  it("garde un article avec adjectif national + contexte pro", () => {
    const r = isSeniorMenChampionshipArticle({
      title: "Transfert : un joueur ivoirien signe au WAC",
      nationalityMarker: "ivoirien",
    });
    expect(r.keep).toBe(true);
  });

  it("garde un article avec journée (J24)", () => {
    const r = isSeniorMenChampionshipArticle({ title: "Lonaci J24 : le Stade d'Abidjan grimpe" });
    expect(r.keep).toBe(true);
  });

  it("garde un article classement", () => {
    const r = isSeniorMenChampionshipArticle({ title: "Classement Fasofoot après la 20e journée" });
    expect(r.keep).toBe(true);
  });

  it("garde un article play-off", () => {
    const r = isSeniorMenChampionshipArticle({ title: "Les play-offs de Ligue 1 débutent samedi" });
    expect(r.keep).toBe(true);
  });

  it("garde malgré entités HTML dans le summary", () => {
    const r = isSeniorMenChampionshipArticle({
      title: "Match nul",
      summary: "L&rsquo;&eacute;quipe premi&egrave;re a jou&eacute; un match nul en championnat.",
    });
    expect(r.keep).toBe(true);
  });

  // ── DOIT EXCLURE ──
  it("exclut féminin", () => {
    const r = isSeniorMenChampionshipArticle({ title: "CAN féminine : les Amazones du Bénin" });
    expect(r.keep).toBe(false);
  });

  it("exclut U17", () => {
    const r = isSeniorMenChampionshipArticle({ title: "Mondial U17 : le Bénin en quart" });
    expect(r.keep).toBe(false);
  });

  it("exclut U15 scolaire", () => {
    const r = isSeniorMenChampionshipArticle({ title: "Tournoi scolaire U15 inter-collèges" });
    expect(r.keep).toBe(false);
  });

  it("exclut basketball", () => {
    const r = isSeniorMenChampionshipArticle({ title: "Finale basketball national : Abidjan vs Bouaké" });
    expect(r.keep).toBe(false);
  });

  it("exclut futsal", () => {
    const r = isSeniorMenChampionshipArticle({ title: "CAN Futsal 2026 : les Étalons en préparation" });
    expect(r.keep).toBe(false);
  });

  it("exclut articles sans indicateur (strict par défaut)", () => {
    const r = isSeniorMenChampionshipArticle({ title: "Le président de la FIF rencontre le ministre" });
    expect(r.keep).toBe(false);
  });

  it("exclut 'junior'", () => {
    const r = isSeniorMenChampionshipArticle({ title: "Équipe juniors du Cameroun en stage" });
    expect(r.keep).toBe(false);
  });

  it("exclut 'cadette'", () => {
    const r = isSeniorMenChampionshipArticle({ title: "Cadette nationale : match retour" });
    expect(r.keep).toBe(false);
  });

  // ── CAS LIMITES ──
  it("ne confond pas 'lutte pour le titre' avec le sport lutte", () => {
    const r = isSeniorMenChampionshipArticle({
      title: "L'ASEC dans la lutte pour le titre de champion",
      knownClubs: BENIN_CLUBS,
    });
    // Devrait garder car ASEC Mimosas (club connu) est mentionné
    expect(r.keep).toBe(true);
  });

  it("ne confond pas 'basket' dans une expression non-sportive", () => {
    const r = isSeniorMenChampionshipArticle({
      title: "Le joueur a mis le ballon dans le basket adverse en championnat",
    });
    // "championnat" est un INCLUDE_KEYWORD → gardé
    expect(r.keep).toBe(true);
  });
});
