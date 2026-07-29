"use client";

import Marquee from "react-fast-marquee";
import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import { CommerceImage } from "@/components/commerce/home/shared/CommerceImage";
import { useCommerceBrands } from "@/hooks/commerce/use-commerce-api";
import type { CommerceBrand } from "@/lib/commerce/types";

type TrustedBrandsProps = {
  initialBrands: CommerceBrand[];
};

function BrandTile({ brand }: { brand: CommerceBrand }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      className="group mx-4 flex h-28 w-44 shrink-0 flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/40 px-4 backdrop-blur-md transition-colors hover:border-gold/30"
    >
      <div className="relative mb-3 h-12 w-12 overflow-hidden rounded-xl">
        <CommerceImage
          src={brand.logo_url}
          alt={brand.name}
          className="h-full w-full"
          fallback={brand.name.slice(0, 2)}
        />
        <BadgeCheck className="absolute -right-1 -bottom-1 h-4 w-4 text-gold" />
      </div>
      <p className="text-center text-xs font-medium text-white group-hover:text-gold">
        {brand.name}
      </p>
    </motion.div>
  );
}

export function TrustedBrands({ initialBrands }: TrustedBrandsProps) {
  const { data: brands = initialBrands } = useCommerceBrands(50);

  if (!brands.length) {
    return (
      <SectionShell
        eyebrow="Trust Layer"
        title="Trusted brands"
        description="Approved brands appear here automatically once verified by the Nexar Commerce network."
      >
        <p className="text-sm text-muted">No approved brands yet.</p>
      </SectionShell>
    );
  }

  return (
    <SectionShell
      eyebrow="Trust Layer"
      title="Trusted brands"
      description="Verified merchant brands from the Nexar Commerce approval pipeline — surfaced automatically when approved."
      className="overflow-hidden"
    >
      <Marquee gradient={false} speed={35} pauseOnHover>
        {brands.map((brand) => (
          <BrandTile key={brand.id} brand={brand} />
        ))}
      </Marquee>
    </SectionShell>
  );
}
