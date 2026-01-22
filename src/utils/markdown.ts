import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: false, // disallow raw HTML in input
  linkify: true,
  breaks: false,
});

export function renderInterviewProcessMarkdown(markdown: string): string {
  const trimmed = markdown.trim();
  if (!trimmed) return "";
  return md.render(trimmed);
}
