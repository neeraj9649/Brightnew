import { officeAddresses } from "@/data/officeAddresses";
import { contactPhones } from "@/data/contactPhones";

export const contactItems = [
  {
    icon: "icon-pin",
    title: "Our Address",
    text: officeAddresses.map((a) => `${a.city}: ${a.full}`).join(" | "),
    lines: officeAddresses.map((a) => ({ label: a.city, text: a.full })),
  },
  {
    icon: "icon-mail-3",
    title: "Info@brightwingstravel.com",
    text: "Email us anytime for anykind of query.",
    link: "mailto:info@brightwingstravel.com",
  },
  {
    icon: "icon-call-3",
    title: "Contact No.",
    text: "Call us for any support, we are here to help.",
    phones: contactPhones,
  },
];
