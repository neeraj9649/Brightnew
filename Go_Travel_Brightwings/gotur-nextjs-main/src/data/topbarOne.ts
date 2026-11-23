import { contactPhones } from "@/data/contactPhones";
import { officeAddresses } from "@/data/officeAddresses";

// app/data/topbarOne.ts

export const topbarOne = {
    contactInfo: [
      ...contactPhones.map((p) => ({
        type: "phone",
        iconClass: "icon-telephone",
        label: p.label,
        href: p.href,
      })),
      {
        type: "email",
        iconClass: "icon-email",
        label: "Info@brightwingstravel.com",
        href: "mailto:info@brightwingstravel.com",
      },
    ],
    contactInfoTwo: [
      {
        type: "email",
        iconClass: "icon-email",
        label: "Info@brightwingstravel.com",
        href: "mailto:info@brightwingstravel.com",
      },
      ...officeAddresses.map((a) => ({
        type: "loc",
        iconClass: "icon-maps-and-flags",
        label: a.short,
        href: a.mapUrl,
      })),
      
    ],
    addresses: officeAddresses.map((a) => ({
      iconClass: "icon-maps-and-flags",
      label: a.short,
      href: a.mapUrl,
    })),
    socialLinks: [
      {
        platform: "Facebook",
        iconClass: "icon-facebook",
        href: "https://www.facebook.com/BrightwingsTravelTourism/",
      },
      // {
      //   platform: "Twitter",
      //   iconClass: "icon-twitter",
      //   href: "https://twitter.com",
      // },
      {
        platform: "Instagram",
        iconClass: "fa fa-instagram",
        href: "https://www.instagram.com/brightwingstours/?hl=en", 
      },
      // {
      //   platform: "Youtube",
      //   iconClass: "icon-youtube",
      //   href: "https://youtube.com",
      // },
    ],
  };
  