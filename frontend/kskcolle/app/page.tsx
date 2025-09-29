import HeroHomepage from "@/app/components/HeroHomepage";
import Contact from "@/app/components/Contact";
import RecentArticles from "@/app/components/RecentArticles";

export default function Home() {
  return (
    <>
      <HeroHomepage />
      <RecentArticles />
      <Contact />
    </>
  );
}
