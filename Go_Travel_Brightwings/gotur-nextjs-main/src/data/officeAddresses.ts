// Company offices, shown everywhere an address appears (top bar, Contact page, footer).
// Edit them here only.
export interface OfficeAddress {
  city: string; // label shown before the address
  short: string; // a few words, for the one-line top bar (links to the map)
  full: string; // complete postal address
  mapUrl: string;
}

export const officeAddresses: OfficeAddress[] = [
  {
    city: "India",
    short: "Jaipur-302021, India",
    full: "Office No G-2,Vinayak residency Shiv Vihar AB Lalarpura Gandhi Path West Jaipur-302021",
    mapUrl: "https://maps.app.goo.gl/5sowvbHrWAakXqydA",
  },
  {
    city: "Dubai",
    short: "Al Quoz 3, Dubai, UAE",
    full: "Zak Holdings Building, First Floor, Office # 103, Al Quoz 3, Dubai, UAE",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Zak+Holdings+Building+Al+Quoz+3+Dubai",
  },
];
