export type NavItem = {
  href: string;
  label: string;
};

export const NAV_LINKS: readonly NavItem[] = [
  { href: "/", label: "Browse Companies" },
  { href: "/hiring-tips", label: "Hiring Tips" },
  { href: "/about", label: "About" },
];
