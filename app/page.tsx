import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";
import { getSession } from "@/lib/auth";

const DESCRIPTION =
  "Switchboard puts DSA practice, job applications, and portfolio projects on one dashboard, with daily targets and spaced-repetition revisits that tell you exactly what to work on today.";

export const metadata: Metadata = {
  title: "Switchboard — Know exactly what to work on today",
  description: DESCRIPTION,
  openGraph: {
    title: "Switchboard — Know exactly what to work on today",
    description: DESCRIPTION,
    siteName: "Switchboard",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Switchboard — Know exactly what to work on today",
    description: DESCRIPTION
  }
};

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return <LandingPage />;
}
