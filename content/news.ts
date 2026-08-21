/**
 * Short dated announcements shown on the landing page, newest first.
 *
 * Drawn from the CV. TODO(asim): add links where they exist -- the CV's
 * [Certificate] / [Workshop Link] anchors lost their URLs in conversion.
 */

export type NewsItem = {
  date: string; // YYYY-MM-DD
  /** Plain text. Use `link` for a single trailing "read more" style link. */
  text: string;
  link?: { label: string; href: string };
};

export const news: NewsItem[] = [
  {
    date: "2026-01-01",
    text: "Attended the MenaML Winter School 2026 at KAUST, Saudi Arabia.",
  },
  {
    date: "2025-12-01",
    text: "Gave a practical workshop on LLM foundations — tokenization, embeddings, and attention in transformer architectures — at IndabaX Sudan 2025.",
  },
  {
    date: "2025-11-01",
    text: "Completed the African Master's in Machine Intelligence (AMMI) at AIMS.",
  },
  {
    date: "2025-10-01",
    text: "New preprint under review: Is Multilingual LLM Watermarking Truly Multilingual? A Simple Back-Translation Solution.",
  },
  {
    date: "2025-08-01",
    text: "Attended the Deep Learning Indaba 2025 in Kigali, Rwanda.",
  },
  {
    date: "2025-07-01",
    text: "Took part in the Cohere Labs Open Science Community Summer School.",
  },
];
