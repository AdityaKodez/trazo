export interface TrazoSponsor {
  id: string;
  name: string;
  url?: string;
  logo?: string;
  order: number;
  enabled?: boolean;
}

export const sponsorsSectionConfig = {
  heading: "Sponsored by",
  supportLabel: "Become a supporter",
  supportNote: "$5 · Once. Here for good.",
  supportHref: "https://akoder.xyz/sponsor",
} as const;

export const trazoSponsors: readonly TrazoSponsor[] = [
  {
    id: "talvess",
    name: "Talvess",
    url: "https://talvess.app",
    logo: "/sponsors/talvess.svg",
    order: 0,
    enabled: true,
  },
  {
    id: "vakh",
    name: "vakh",
    url: "https://vakh.com/",
    logo: "/sponsors/pay_0NnVTVxfMVfkEoLNcqhwx.webp",
    order: 1,
    enabled: true,
  },
  {
    id: "anubhav-choubey",
    name: "Anubhav Choubey",
    url: "https://anubhavchoubey.com/",
    logo: "/sponsors/pay_0Nrz8A7y7OLbCFQGFEDz6.jpg",
    order: 2,
    enabled: true,
  },
  {
    id: "liniqo",
    name: "Liniqo",
    url: "https://liniqo.com/",
    logo: "/sponsors/pay_0Ns6Owuj2MkWlwm9bDjIX.png",
    order: 3,
    enabled: true,
  },
] as const;

export function getEnabledSponsors(): TrazoSponsor[] {
  return [...trazoSponsors]
    .filter((sponsor) => sponsor.enabled !== false)
    .sort((a, b) => a.order - b.order);
}
