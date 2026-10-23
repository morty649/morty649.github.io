import { HomePage } from "@/components/home-page";
import { getListedPosts } from "@/lib/blog";

export default function Page() {
  return <HomePage latestPosts={getListedPosts().slice(0, 3)} />;
}
