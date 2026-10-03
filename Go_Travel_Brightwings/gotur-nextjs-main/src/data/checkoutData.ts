

interface Product {
  name: string;
  price: number;
  subtotal: number;
}

interface BillingAddress {
  firstName: string;
  lastName: string;
  companyName: string;
  country: string;
  streetAddress: string;
  address2: string;
  city: string;
  area: string;
  zipCode: string;
  phone: string;
  email: string;
}

interface ShippingAddress {
  address: string;
}

interface CheckoutData {
  billingAddress: BillingAddress;
  shippingAddress: ShippingAddress;
  products: Product[];
  shipping: string;
  total: number;
}

export const checkoutData: CheckoutData = {
  billingAddress: {
    firstName: "John",
    lastName: "Doe",
    companyName: "Doe Enterprises",
    country: "United States",
    streetAddress: "1837 E Homer M Adams Pkwy",
    address2: "Apt 202",
    city: "Atlanta",
    area: "Georgia",
    zipCode: "30301",
    phone: "123-456-7890",
    email: "johndoe@example.com",
  },
  shippingAddress: {
    address: "2801 Lafayette Blvd, Norfolk, Vermont 23509, United States",
  },
  products: [
    {
      name: "Pain Relievers",
      price: 15.0,
      subtotal: 15.0,
    },
  ],
  shipping: "free",
  total: 15.0,
};
