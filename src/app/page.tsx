import { HomePage } from "@/components/home-page";
import { getPosts } from "@/lib/blog";

export default function Page() {
  return <HomePage latestPosts={getPosts().slice(0, 3)} />;
}
