import { redirect } from "next/navigation";

export const metadata = {
  title: "Classements football - 360 Foot",
  description:
    "Tous les classements des ligues de football africaines et europeennes sur 360 Foot.",
  alternates: { canonical: "https://360-foot.com/competitions" },
};

export default function ClassementsPage() {
  redirect("/competitions");
}
