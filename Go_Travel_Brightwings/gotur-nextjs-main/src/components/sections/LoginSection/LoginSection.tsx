"use client";
import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { Form } from "react-bootstrap";
import { useRouter } from "next/navigation";
import image from "@/assets/images/resources/login-1-1.jpg";
import Image from "next/image";
import { authPost } from "@/lib/api";
import { useAuth, type User } from "@/store/auth";
import { PinInput } from "@/lib/ui";

interface LoginFormData {
  phone: string;
  pin: string;
}

interface RegisterFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  pin: string;
  referred_by_code?: string;
}

type Session = { access_token: string; user: User };

const LoginSection: React.FC = () => {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [activeTab, setActiveTab] = useState<string>("login");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const {
    register: loginRegister,
    handleSubmit: loginHandleSubmit,
    control: loginControl,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>();
  const {
    register: registerRegister,
    handleSubmit: registerHandleSubmit,
    setValue: registerSetValue,
    control: registerControl,
    formState: { errors: registerErrors },
  } = useForm<RegisterFormData>();

  // Referral deep-link: /login?ref=CODE prefills + opens the register tab.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      registerSetValue("referred_by_code", ref);
      setActiveTab("register");
    }
  }, [registerSetValue]);

  async function finish(promise: Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      const data = (await promise) as Session;
      setSession(data.access_token, data.user);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const onLoginSubmit: SubmitHandler<LoginFormData> = (data) =>
    finish(authPost("/auth/login", { phone: data.phone.trim(), pin: data.pin }));

  const onRegisterSubmit: SubmitHandler<RegisterFormData> = (data) =>
    finish(
      authPost("/auth/register", {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim() || undefined,
        date_of_birth: data.date_of_birth,
        phone: data.phone.trim(),
        pin: data.pin,
        referred_by_code: data.referred_by_code?.trim() || undefined,
      })
    );

  return (
    <section className="login-page section-space">
      <div className="container">
        <div className="row gutter-y-40 align-items-center">
          <div className="col-lg-6">
            <div className="login-page__thumb">
              <Image src={image} alt="Bright Wings" />
            </div>
          </div>
          <div className="col-lg-6">
            <div className="login-page__content">
              <div className="login-page__main-tab-box tabs-box">
                <div className="login-page__top">
                  <div className="login-page__top__left">
                    <h2 className="login-page__top__section-title">Welcome</h2>
                    <p className="login-page__top__section-subtitle">
                      Sign in with your phone &amp; PIN
                    </p>
                  </div>
                  <div className="login-page__top__btn tab-buttons">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("login");
                        setError(null);
                      }}
                      className={`tab-btn gotur-btn ${
                        activeTab === "login" ? "active-btn" : ""
                      }`}
                    >
                      Log In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("register");
                        setError(null);
                      }}
                      className={`tab-btn gotur-btn ${
                        activeTab === "register" ? "active-btn" : ""
                      }`}
                    >
                      Register
                    </button>
                  </div>
                </div>

                {error && (
                  <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>
                )}

                <div className="tabs-content">
                  {/* Login */}
                  <div
                    className={`tabs-content__item tab ${
                      activeTab === "login" ? "active-tab" : ""
                    }`}
                  >
                    <Form onSubmit={loginHandleSubmit(onLoginSubmit)}>
                      <div className="login-page__group">
                        <div className="login-page__input-box">
                          <i className="icon-phone"></i>
                          <input
                            type="tel"
                            placeholder="Phone number"
                            {...loginRegister("phone", {
                              required: "Phone is required",
                            })}
                          />
                        </div>
                        {loginErrors.phone && (
                          <small style={{ color: "#b91c1c" }}>
                            {loginErrors.phone.message}
                          </small>
                        )}

                        <div style={{ marginBottom: 16 }}>
                          <Controller
                            name="pin"
                            control={loginControl}
                            rules={{
                              required: "PIN is required",
                              pattern: { value: /^\d{4}$/, message: "PIN must be 4 digits" },
                            }}
                            render={({ field }) => (
                              <PinInput value={field.value || ""} onChange={field.onChange} />
                            )}
                          />
                          {loginErrors.pin && (
                            <small style={{ color: "#b91c1c", display: "block", marginTop: 4 }}>
                              {loginErrors.pin.message}
                            </small>
                          )}
                        </div>

                        <div className="login-page__input-box">
                          <div className="login-page__input-box__btn">
                            <button type="submit" className="gotur-btn" disabled={busy}>
                              {busy ? "..." : "log in"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </Form>
                  </div>

                  {/* Register */}
                  <div
                    className={`tabs-content__item tab ${
                      activeTab === "register" ? "active-tab" : ""
                    }`}
                  >
                    <Form onSubmit={registerHandleSubmit(onRegisterSubmit)}>
                      <div className="login-page__group">
                        <div className="login-page__input-box">
                          <i className="icon-user"></i>
                          <input
                            type="text"
                            placeholder="First name"
                            {...registerRegister("first_name", {
                              required: "First name is required",
                            })}
                          />
                        </div>
                        {registerErrors.first_name && (
                          <small style={{ color: "#b91c1c" }}>
                            {registerErrors.first_name.message}
                          </small>
                        )}

                        <div className="login-page__input-box">
                          <i className="icon-user"></i>
                          <input
                            type="text"
                            placeholder="Last name (optional)"
                            {...registerRegister("last_name")}
                          />
                        </div>

                        <div className="login-page__input-box">
                          <i className="icon-calendar"></i>
                          <input
                            type="date"
                            aria-label="Date of birth"
                            {...registerRegister("date_of_birth", {
                              required: "Date of birth is required",
                            })}
                          />
                        </div>
                        {registerErrors.date_of_birth && (
                          <small style={{ color: "#b91c1c" }}>
                            {registerErrors.date_of_birth.message}
                          </small>
                        )}

                        <div className="login-page__input-box">
                          <i className="icon-phone"></i>
                          <input
                            type="tel"
                            placeholder="Phone number"
                            {...registerRegister("phone", {
                              required: "Phone is required",
                            })}
                          />
                        </div>
                        {registerErrors.phone && (
                          <small style={{ color: "#b91c1c" }}>
                            {registerErrors.phone.message}
                          </small>
                        )}

                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 13, marginBottom: 6, opacity: 0.7 }}>
                            Set a 4-digit PIN
                          </div>
                          <Controller
                            name="pin"
                            control={registerControl}
                            rules={{
                              required: "PIN is required",
                              pattern: { value: /^\d{4}$/, message: "PIN must be 4 digits" },
                            }}
                            render={({ field }) => (
                              <PinInput value={field.value || ""} onChange={field.onChange} />
                            )}
                          />
                          {registerErrors.pin && (
                            <small style={{ color: "#b91c1c", display: "block", marginTop: 4 }}>
                              {registerErrors.pin.message}
                            </small>
                          )}
                        </div>

                        <div className="login-page__input-box">
                          <i className="icon-gift"></i>
                          <input
                            type="text"
                            placeholder="Referral code (optional)"
                            {...registerRegister("referred_by_code")}
                          />
                        </div>

                        <div className="login-page__input-box">
                          <div className="login-page__input-box__btn">
                            <button type="submit" className="gotur-btn" disabled={busy}>
                              {busy ? "..." : "Register"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </Form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginSection;
