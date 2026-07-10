import Link from "next/link";

export function StagePlaceholder({
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div>
      <h1 className="font-serif text-3xl leading-tight text-foreground md:text-4xl">
        {title}
      </h1>

      <p className="mt-6 max-w-[55ch] text-base leading-relaxed text-muted-foreground">
        {body}
      </p>

      <div className="mt-12">
        <Link
          href={ctaHref}
          className="inline-block bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-transform hover:opacity-90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
