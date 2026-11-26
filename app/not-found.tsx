import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <EmptyState
        glyph="store"
        wash="peach"
        title="Yeh page nahi mila"
        body="Shayad link purana hai. Aas-paas ki dukaanein dekhein?"
        action={<ButtonLink href="/" variant="primary-flame">← Explore All Nearby Shops</ButtonLink>}
      />
    </main>
  );
}
