// Company phone numbers, shown everywhere a "call us" number appears (header, mobile menu,
// top bar, footer, About and Contact sections). Edit them here only.
export interface ContactPhone {
  label: string; // as shown on the page
  href: string; // tel: link, digits only
}

export const contactPhones: ContactPhone[] = [
  { label: "+91 7732957732", href: "tel:+917732957732" },
  { label: "+971 526099279", href: "tel:+971526099279" },
];
