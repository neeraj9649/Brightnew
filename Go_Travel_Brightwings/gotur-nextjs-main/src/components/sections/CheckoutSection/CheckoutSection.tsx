"use client";
import CustomReactSelectTwo from "@/components/common/CustomReactSelecTwo/CustomReactSelectTwo";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

// Interface for the product data (for simplicity, you can update based on your data structure)
interface Product {
  name: string;
  subtotal: number;
}
const countryOptions = [
  { label: "United States", value: "us" },
  { label: "Canada", value: "ca" },
  { label: "England", value: "en" },
  { label: "Australia", value: "au" },
];
const areaOptions = [
  { label: "Georgia", value: "us" },
  { label: "Canada", value: "ca" },
  { label: "England", value: "en" },
  { label: "Australia", value: "au" },
];
const CartSection: React.FC = () => {
  const [activePayment, setActivePayment] = useState<"bank" | "paypal" | null>("bank");

  const bankRef = useRef<HTMLDivElement>(null);
  const paypalRef = useRef<HTMLDivElement>(null);

  const togglePayment = (method: "bank" | "paypal") => {
    setActivePayment((prev) => (prev === method ? null : method));
  };

  useEffect(() => {
    const handleToggle = (
      ref: React.RefObject<HTMLDivElement | null>,
      isActive: boolean
    ) => {
      if (ref.current) {
        ref.current.style.maxHeight = isActive
          ? `${ref.current.scrollHeight}px`
          : "0px";
        ref.current.style.opacity = isActive ? "1" : "0";
        ref.current.style.marginBottom = isActive ? "28px" : "0";
      }
    };

    handleToggle(bankRef, activePayment === "bank");
    handleToggle(paypalRef, activePayment === "paypal");
  }, [activePayment]);

  const { register, handleSubmit, setValue } = useForm();
  const checkoutData = {
    billingAddress: {
      firstName: "",
      lastName: "",
      companyName: "",
      country: "",
      streetAddress: "",
      address2: "",
      city: "",
      area: "",
      zipCode: "",
      phone: "",
      email: "",
    },
    shippingAddress: {
      address: "",
    },
    products: [
      { name: "Pain Relievers", subtotal: 15 },
      { name: "Shipping", subtotal: 0 },
    ],
    shipping: "Free",
    total: 15,
  };

  const [country, setCountry] = useState<string>("");

  const onCountryChange = (value: string) => {
    setCountry(value);
  };
  const [area, setArea] = useState<string>("");

  const onAreaChange = (value: string) => {
    setArea(value);
  };

  // Handle form submission (can be updated for actual use)
  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <section className="checkout-page section-space">
      <div className="container">
        <div className="row">
          {/* Billing Address Section */}
          <div className="col-xl-6 col-lg-6">
            <div className="checkout-page__billing-address">
              <h2 className="checkout-page__billing-address__title">
                Billing Details
              </h2>
              <form
                className="checkout-page__form"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="row bs-gutter-x-20">
                  <div className="col-xl-6">
                    <div className="checkout-page__input-box">
                      <label htmlFor="first-name">First Name *</label>
                      <input
                        {...register("firstName")}
                        type="text"
                        id="first-name"
                        placeholder="First Name"
                      />
                    </div>
                  </div>
                  <div className="col-xl-6">
                    <div className="checkout-page__input-box">
                      <label htmlFor="last-name">Last Name *</label>
                      <input
                        {...register("lastName")}
                        type="text"
                        id="last-name"
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                  <div className="col-xl-6">
                    <div className="checkout-page__input-box">
                      <label htmlFor="company_name">Company Name</label>
                      <input
                        {...register("companyName")}
                        type="text"
                        id="company_name"
                        placeholder="Company Name"
                      />
                    </div>
                  </div>
                  <div className="col-xl-6">
                    <div className="checkout-page__input-box">
                      <label htmlFor="select_country">Select Country *</label>
                      <CustomReactSelectTwo
                        options={countryOptions}
                        value={country || ""}
                        onChange={(val) => onCountryChange(val)}
                        placeholder="Select Country"
                      />
                    </div>
                  </div>
                  <div className="col-xl-6">
                    <div className="checkout-page__input-box">
                      <label htmlFor="street-address">Street Address *</label>
                      <input
                        {...register("streetAddress")}
                        type="text"
                        id="street-address"
                        placeholder="Street Address"
                      />
                    </div>
                  </div>
                  <div className="col-xl-6">
                    <div className="checkout-page__input-box">
                      <label htmlFor="address">Address 2 *</label>
                      <input
                        {...register("address2")}
                        type="text"
                        id="address"
                        placeholder="Address 2"
                      />
                    </div>
                  </div>
                  <div className="col-xl-6">
                    <div className="checkout-page__input-box">
                      <label htmlFor="town-city">City or Town</label>
                      <input
                        {...register("city")}
                        type="text"
                        id="town-city"
                        placeholder="City or Town"
                      />
                    </div>
                  </div>
                  <div className="col-xl-6">
                    <div className="checkout-page__input-box">
                      <label htmlFor="select_area">Select Area</label>
                      <CustomReactSelectTwo
                        options={areaOptions}
                        value={area || ""}
                        onChange={(val) => onAreaChange(val)}
                        placeholder="Select Area"
                      />
                    </div>
                  </div>
                  <div className="col-xl-6">
                    <div className="checkout-page__input-box">
                      <label htmlFor="zip-code">ZIP Code *</label>
                      <input
                        {...register("zipCode")}
                        type="text"
                        id="zip-code"
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>
                  <div className="col-xl-6">
                    <div className="checkout-page__input-box">
                      <label htmlFor="phone">Phone *</label>
                      <input
                        {...register("phone")}
                        type="tel"
                        id="phone"
                        pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                        placeholder="Phone Number"
                      />
                    </div>
                  </div>
                  <div className="col-xl-12">
                    <div className="checkout-page__input-box">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        {...register("email")}
                        type="email"
                        id="email"
                        placeholder="Email Address"
                      />
                    </div>
                  </div>
                </div>
                <button type="submit" className="gotur-btn gotur-btn--base">
                  Place Your Order
                </button>
              </form>
            </div>
          </div>

          {/* Shipping Address Section */}
          <div className="col-xl-6 col-lg-6">
            <div className="checkout-page__shipping-address">
              <h2 className="checkout-page__shipping-address__title">
                Ship to a Different Address
              </h2>
              <form className="checkout-page__form">
                <div className="col-xl-12">
                  <div className="checkout-page__input-box">
                    <textarea
                      {...register("shippingAddress")}
                      name="shippingAddress"
                      placeholder="2801 Lafayette Blvd, Norfolk, Vermont 23509, united state"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="checkout-page__your-order">
          <h2 className="checkout-page__your-order__title">Your Order</h2>
          <div className="row">
            <div className="col-xl-6 col-lg-6">
              <table className="checkout-page__order-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {checkoutData.products.map((product, index) => (
                    <tr key={index}>
                      <td className="pro__title">{product.name}</td>
                      <td className="pro__price">${product.subtotal}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="pro__title">Subtotal</td>
                    <td className="pro__price">
                      $
                      {checkoutData.products.reduce(
                        (acc, curr) => acc + curr.subtotal,
                        0
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="pro__title">Shipping</td>
                    <td className="pro__price">{checkoutData.shipping}</td>
                  </tr>
                  <tr>
                    <td className="pro__title pro__title--total">Total</td>
                    <td className="pro__price pro__price--total">
                      ${checkoutData.total}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-lg-6">
              <div className="checkout-page__payment">
                <div
                  className={`checkout-page__payment__item ${
                    activePayment === "bank" ? "checkout-page__payment__item--active" : ""
                  }`}
                  onClick={() => togglePayment("bank")}
                >
                  <h3 className="checkout-page__payment__title">
                    Direct Bank Transfer
                  </h3>
                  <div
                    className="checkout-page__payment__content"
                    ref={bankRef}
                    style={{
                      maxHeight: "0px",
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      opacity: 0,
                      marginBottom: 0,
                    }}
                  >
                    Neque porro est qui dolorem ipsum quia quaed inventor
                    veritatis et quasi architecto beatae vitae dicta sunt
                    explicabo. Aelltes port lacus quis enim var sed efficitur
                  </div>
                </div>
                <div
                  className={`checkout-page__payment__item ${
                    activePayment === "paypal"
                      ? "checkout-page__payment__item--active"
                      : ""
                  }`}
                  onClick={() => togglePayment("paypal")}
                >
                  <h3 className="checkout-page__payment__title">
                    Paypal Payment
                  </h3>
                  <div
                    className="checkout-page__payment__content"
                    ref={paypalRef}
                    style={{
                      maxHeight: "0px",
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      opacity: 0,
                      marginBottom: 0,
                    }}
                  >
                    Neque porro est qui dolorem ipsum quia quaed inventor
                    veritatis et quasi architecto beatae vitae dicta sunt
                    explicabo. Aelltes port lacus quis enim var sed efficitur
                  </div>
                </div>
                <button className="gotur-btn gotur-btn--base">
                  Place Your Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartSection;
