import "katex/dist/katex.min.css";
import { Writer } from "@/components/writer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Writer",
  robots: { index: false, follow: false },
};

export default function WritePage() {
  return <Writer />;
}
