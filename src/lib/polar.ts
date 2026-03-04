import { Polar } from "@polar-sh/sdk";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

// Pack definitions — product IDs will be set after creating them in Polar dashboard
export const PACKS = {
  "1": {
    credits: 1,
    priceCents: 250,
    label: "1 Track",
    polarProductId: process.env.POLAR_PRODUCT_1_ID!,
  },
  "3": {
    credits: 3,
    priceCents: 599,
    label: "3 Tracks",
    polarProductId: process.env.POLAR_PRODUCT_3_ID!,
  },
  "5": {
    credits: 5,
    priceCents: 999,
    label: "5 Tracks",
    polarProductId: process.env.POLAR_PRODUCT_5_ID!,
  },
  "10": {
    credits: 10,
    priceCents: 1499,
    label: "10 Tracks",
    polarProductId: process.env.POLAR_PRODUCT_10_ID!,
  },
} as const;

export type PackType = keyof typeof PACKS;
