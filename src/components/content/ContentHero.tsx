import CatalogHero from "@/components/catalog/CatalogHero";
import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";

type ContentHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  heroImage?: string;
  breadcrumbLabel: string;
};

export default function ContentHero({
  eyebrow,
  title,
  description,
  heroImage,
  breadcrumbLabel,
}: ContentHeroProps) {
  return (
    <>
      <CatalogHero
        banner={{
          title,
          subtitle: eyebrow ?? "BeyondBabyCo",
          description,
          imageUrl: heroImage ?? null,
        }}
        priorityImage={false}
      />
      <CatalogBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: breadcrumbLabel },
        ]}
      />
    </>
  );
}
