import { Link } from "react-router-dom";
import logo from "../../../assets/logo-optimized.png";
import { getLegalDocument, type LegalDocument } from "../content";

type Props = {
  slug: LegalDocument["slug"];
  isAuthenticated: boolean;
};

export function LegalDocumentPage({ slug, isAuthenticated }: Props) {
  const document = getLegalDocument(slug);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-40 border-b border-outline-variant/20 bg-surface-container-lowest/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[92rem] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="University logo"
              className="h-7 w-7 rounded-sm object-contain"
            />
            <p className="font-headline text-sm font-bold text-primary sm:text-base">
              NEMSUEE
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/privacy-policy"
              className="rounded-md px-2.5 py-1.5 text-xs font-label font-semibold text-on-surface-variant hover:bg-surface-container"
            >
              Privacy
            </Link>
            <Link
              to="/terms-of-service"
              className="rounded-md px-2.5 py-1.5 text-xs font-label font-semibold text-on-surface-variant hover:bg-surface-container"
            >
              Terms
            </Link>
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-label font-bold text-on-primary hover:bg-primary/90"
            >
              {isAuthenticated ? "Back to App" : "Back to Login"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[72rem] px-4 py-8 md:px-6 md:py-10">
        <section className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <p className="mb-2 text-xs font-label uppercase tracking-[0.12em] text-on-surface-variant">
            Legal
          </p>
          <h1 className="font-headline text-2xl font-bold text-primary md:text-3xl">
            {document.title}
          </h1>
          <p className="mt-2 text-sm font-body text-on-surface-variant">
            Last updated: {document.lastUpdated}
          </p>
        </section>

        <section className="mt-6 space-y-4 md:mt-8 md:space-y-5">
          {document.sections.map((section) => (
            <article
              key={section.heading}
              className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm md:p-6"
            >
              <h2 className="font-headline text-lg font-bold text-primary">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-2 text-sm font-body text-on-surface-variant">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
