import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

/**
 * Redirect old /classement/[slug] URLs to /ligue/[slug]/classement
 * Keeps backward compatibility + SEO redirect
 */
export default async function StandingsRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/ligue/${slug}/classement`);
}
