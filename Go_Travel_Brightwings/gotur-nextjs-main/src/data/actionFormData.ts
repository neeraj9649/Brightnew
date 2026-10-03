
export interface ActionFormData {
  locations: { label: string; value: string }[];
  activities: { label: string; value: string }[];
  dateRangePlaceholder: string;
  travelerCount: number;
  icons: {
    location: string;
    activity: string;
    calendar: string;
    group: string;
  };
}

export const actionFormData: ActionFormData = {
  locations: [
    { label: "Australia", value: "australia" },
    { label: "Spain", value: "spain" },
    { label: "Africa", value: "africa" },
    { label: "Europe", value: "europe" }
  ],
  activities: [
    { label: "Adventure", value: "adventure" },
    { label: "Booking Type", value: "booking-type" },
    { label: "Beach", value: "beach" },
    { label: "Discovery", value: "discovery" }
  ],
  dateRangePlaceholder: "Feb 5 - 5",
  travelerCount: 2,
  icons: {
    location: "icon icon-location",
    activity: "icon icon-travle",
    calendar: "icon icon-clock",
    group: "icon icon-group"
  }
};
