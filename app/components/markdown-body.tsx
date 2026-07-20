/** Minimal markdown: paragraphs + **bold**. */
export function MarkdownBody({ source }: { source: string }) {
  const paragraphs = source.split(/\n\n+/);

  return (
    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
      {paragraphs.map((para, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {renderInline(para)}
        </p>
      ))}
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-medium text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
