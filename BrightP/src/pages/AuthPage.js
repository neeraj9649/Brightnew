import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import PinInput from "../components/Common/PinInput";

// ponytail: AuthPage.css migrated to Tailwind utilities. Desktop is pixel-exact
// (the verified baseline); only the major responsive shift is reproduced via
// max-lg: variants (the finer 768/480px px-tweaks were not cloned).
const labelCls = "block text-[var(--color-text)] font-medium text-[12px] mb-[8px] font-[var(--font-family-base)]";
const groupCls = "mb-[24px]";
const iconCls = "input-icon absolute left-[12px] top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] text-[12px] z-[1]";
const inputBase =
  "w-full pt-[16px] pr-[16px] pb-[12px] pl-[40px] border-2 rounded-[8px] text-[12px] text-[var(--color-text)] bg-[var(--color-surface)] outline-none transition-all duration-150 focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)]";
const errMsgCls = "flex items-center gap-[6px] text-[var(--color-error)] text-[11px] mt-[6px]";
const inputCls = (hasErr) =>
  `${inputBase} ${hasErr ? "border-[var(--color-error)] shadow-[0_0_0_3px_rgba(var(--color-error-rgb),0.1)]" : "border-[var(--color-border)]"}`;
const submitBase =
  "flex items-center justify-center gap-[8px] py-[12px] px-[24px] border-none rounded-[8px] font-[550] text-[12px] cursor-pointer w-full mb-[16px] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1);

  const navigate = useNavigate();
  const {
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    isFirebaseConfigured,
  } = useAuth();

  const {
    register: registerField,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
    getValues,
  } = useForm();

  const phoneValue = watch("phone");
  const passwordValue = watch("password");

  // Handle Login
  const handleLogin = async (data) => {
    try {
      setLoading(true);
      const user = await signIn(data.phone, data.password);
      toast.success("Welcome back!");
      // Employees land on the staff dashboard (assigned bookings + tasks),
      // not the customer dashboard. Admins/customers go to /dashboard.
      navigate(user?.role === "employee" ? "/admin" : "/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Failed to sign in. Please try again.";

      if (error.message === "Invalid phone number or PIN") {
        errorMessage =
          "Invalid phone number or PIN. Please check your credentials.";
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (data) => {
    try {
      setLoading(true);
      await signUp(data.phone, data.password, {
        name: data.name,
        phone: data.phone,
        dob: data.dob,
      });
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Failed to create account. Please try again.";

      if (error.message === "User Creation Error: Phone Already Registered") {
        errorMessage =
          "An account with this phone already exists. Please sign in instead.";
      } else if (error.message === "PIN must be exactly 4 digits") {
        errorMessage = "PIN must be exactly 4 digits.";
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
      toast.success("Welcome to Bright Wings!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Google auth error:", error);
      let errorMessage = "Failed to sign in with Google.";

      if (error.message === "Sign in was cancelled") {
        errorMessage = "Google sign in was cancelled.";
      }

      toast.error(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle pin Reset
  const handlePasswordReset = async () => {
    if (!phoneValue) {
      toast.error("Please enter your phone number first.");
      return;
    }

    try {
      await resetPassword(phoneValue);
      setShowResetPassword(false);
      toast.success("pin reset phone sent!");
    } catch (error) {
      console.error("pin reset error:", error);
      let errorMessage = "Failed to send password reset phone.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this phone number.";
      } else if (error.code === "auth/invalid-phone") {
        errorMessage = "Please enter a valid phone number.";
      }

      toast.error(errorMessage);
    }
  };

  // Handle Registration Step Navigation
  const handleNextStep = () => {
    const values = getValues();
    if (
      !values.name ||
      !values.phone ||
      !values.password ||
      !values.confirmPassword
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (values.password !== values.confirmPassword) {
      toast.error("PINs do not match.");
      return;
    }

    if (!/^[0-9]{4}$/.test(values.password)) {
      toast.error("PIN must be exactly 4 digits.");
      return;
    }

    setRegistrationStep(2);
  };

  const handleBackStep = () => {
    setRegistrationStep(1);
  };

  // Handle form submission
  const onSubmit = (data) => {
    if (activeTab === "login") {
      handleLogin(data);
    } else {
      handleRegister(data);
    }
  };

  // Switch tabs
  const switchTab = (tab) => {
    setActiveTab(tab);
    setRegistrationStep(1);
    reset();
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="fixed top-0 left-0 z-[-2] h-full w-full bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-hover)_50%,var(--color-warning)_100%)] before:absolute before:inset-0 before:z-[-1] before:bg-[url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&h=900&fit=crop')] before:bg-cover before:bg-center before:opacity-[0.15] before:content-['']">
        <div className="absolute inset-0 z-[-1] bg-[rgba(33,128,141,0.3)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px]"></div>
      </div>

      <div className="relative z-[1] flex min-h-screen w-screen items-center justify-center gap-[4rem] max-lg:flex-col">
        {/* Left Panel - Branding */}
        <div className="relative flex items-center justify-center p-[32px] text-[var(--color-white)] max-lg:flex-none">
          <div className="w-full max-w-[500px]">
            <div className="mb-[32px] flex items-center gap-[16px] text-[20px] font-semibold text-[var(--color-black)]">
              <i className="fas fa-plane text-[30px] text-[var(--color-warning)] [text-shadow:0_2px_4px_rgba(0,0,0,0.2)]"></i>
              <span>Bright Wings</span>
            </div>
            <h1 className="mb-[24px] text-[clamp(20px,4vw,30px)] font-semibold leading-[1.2] tracking-[-0.01em] text-[var(--color-black)] [text-shadow:0_2px_4px_rgba(0,0,0,0.2)]">
              Your Journey Begins Here
            </h1>
            <p className="mb-[32px] text-[16px] leading-[1.5] text-[rgba(95,95,95,0.9)] opacity-[0.95]">
              Explore the world with confidence. Book flights, hotels, and tours
              with our premium travel services and earn rewards with every
              journey.
            </p>

            <div className="mb-[32px] flex flex-col gap-[24px] max-lg:flex-row max-lg:overflow-x-auto">
              <div className="flex items-start gap-[16px] rounded-[12px] border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.1)] p-[24px] backdrop-blur-[20px] max-lg:min-w-[280px] max-lg:shrink-0">
                <i className="fas fa-shield-alt mt-[4px] shrink-0 text-[18px] text-[var(--color-warning)]"></i>
                <div className="flex-1">
                  <h3 className="mb-[8px] text-[16px] font-[550] text-[rgb(66,66,66)]">Secure Bookings</h3>
                  <p className="m-0 text-[12px] leading-[1.5] text-[rgb(66,66,66)] opacity-90">Your payments and data are protected</p>
                </div>
              </div>
              <div className="flex items-start gap-[16px] rounded-[12px] border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.1)] p-[24px] backdrop-blur-[20px] max-lg:min-w-[280px] max-lg:shrink-0">
                <i className="fas fa-star mt-[4px] shrink-0 text-[18px] text-[var(--color-warning)]"></i>
                <div className="flex-1">
                  <h3 className="mb-[8px] text-[16px] font-[550] text-[rgb(66,66,66)]">Premium Rewards</h3>
                  <p className="m-0 text-[12px] leading-[1.5] text-[rgb(66,66,66)] opacity-90">Earn Wings with every booking</p>
                </div>
              </div>
              <div className="flex items-start gap-[16px] rounded-[12px] border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.1)] p-[24px] backdrop-blur-[20px] max-lg:min-w-[280px] max-lg:shrink-0">
                <i className="fas fa-headset mt-[4px] shrink-0 text-[18px] text-[var(--color-warning)]"></i>
                <div className="flex-1">
                  <h3 className="mb-[8px] text-[16px] font-[550] text-[rgb(66,66,66)]">24/7 Support</h3>
                  <p className="m-0 text-[12px] leading-[1.5] text-[rgb(66,66,66)] opacity-90">We're here to help anytime</p>
                </div>
              </div>
            </div>

            {/* Travel Destinations Showcase */}
            <div className="mt-[32px]">
              <h3 className="mb-[16px] text-center text-[18px] font-medium text-[rgb(66,66,66)]">Popular Destinations</h3>
              <div className="grid grid-cols-4 gap-5">
                <div className="flex flex-col items-center gap-[8px] text-center">
                  <img
                    className="h-[60px] w-[60px] rounded-full border-2 border-[rgba(255,255,255,0.3)] object-cover"
                    src="https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=60&h=60&fit=crop"
                    alt="Paris"
                  />
                  <span className="text-[16px] font-medium text-[rgba(101,101,101,0.9)]">Paris</span>
                </div>
                <div className="flex flex-col items-center gap-[8px] text-center">
                  <img
                    className="h-[60px] w-[60px] rounded-full border-2 border-[rgba(255,255,255,0.3)] object-cover"
                    src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=60&h=60&fit=crop"
                    alt="Tokyo"
                  />
                  <span className="text-[16px] font-medium text-[rgba(101,101,101,0.9)]">Tokyo</span>
                </div>
                <div className="flex flex-col items-center gap-[8px] text-center">
                  <img
                    className="h-[60px] w-[60px] rounded-full border-2 border-[rgba(255,255,255,0.3)] object-cover"
                    src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=60&h=60&fit=crop"
                    alt="Bali"
                  />
                  <span className="text-[16px] font-medium text-[rgba(101,101,101,0.9)]">Bali</span>
                </div>
                <div className="flex flex-col items-center gap-[8px] text-center">
                  <img
                    className="h-[60px] w-[60px] rounded-full border-2 border-[rgba(255,255,255,0.3)] object-cover"
                    src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=60&h=60&fit=crop"
                    alt="Dubai"
                  />
                  <span className="text-[16px] font-medium text-[rgba(101,101,101,0.9)]">Dubai</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Auth Forms */}
        <div className="relative flex flex-[0_0_480px] items-center justify-center bg-[var(--color-surface)] p-[32px] max-lg:flex-none">
          <div className="relative w-full max-w-[400px]">
            {/* Back to Home Button */}
            <button
              className="mb-[32px] flex cursor-pointer items-center gap-[8px] rounded-[8px] border-none bg-none p-[8px] text-[12px] font-medium text-[var(--color-text-secondary)] transition-all duration-150 hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)]"
              onClick={() => navigate("/")}
            >
              <i className="fas fa-arrow-left"></i>
              Back to Home
            </button>

            {/* Tab Navigation */}
            <div className="mb-[32px] flex rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-[6px] shadow-[var(--shadow-sm)]">
              <button
                className={`flex flex-1 cursor-pointer items-center justify-center gap-[8px] rounded-[8px] border-none py-[12px] px-[16px] text-[12px] font-medium transition-all duration-150 ${
                  activeTab === "login"
                    ? "bg-[var(--color-primary)] text-[var(--color-btn-primary-text)] shadow-[var(--shadow-sm)]"
                    : "bg-transparent text-[var(--color-text-secondary)]"
                }`}
                onClick={() => switchTab("login")}
              >
                <i className="fas fa-sign-in-alt"></i>
                Sign In
              </button>
              <button
                className={`flex flex-1 cursor-pointer items-center justify-center gap-[8px] rounded-[8px] border-none py-[12px] px-[16px] text-[12px] font-medium transition-all duration-150 ${
                  activeTab === "register"
                    ? "bg-[var(--color-primary)] text-[var(--color-btn-primary-text)] shadow-[var(--shadow-sm)]"
                    : "bg-transparent text-[var(--color-text-secondary)]"
                }`}
                onClick={() => switchTab("register")}
              >
                <i className="fas fa-user-plus"></i>
                Sign Up
              </button>
            </div>

            {/* Form Content */}
            <div className="mb-[24px] rounded-[12px] border border-[var(--color-card-border)] bg-[var(--color-surface)] p-[32px] shadow-[var(--shadow-sm)]">
              {/* Demo Notice */}
              {!isFirebaseConfigured && (
                <div className="mb-[24px] flex items-start gap-[12px] rounded-[10px] border border-[var(--color-warning)] bg-[linear-gradient(135deg,var(--color-bg-2),var(--color-warning))] p-[16px]">
                  <div className="mt-[2px] text-[18px] text-[var(--color-warning)]">
                    <i className="fas fa-info-circle"></i>
                  </div>
                  <div>
                    <h3 className="mb-[4px] text-[12px] font-[550] text-[var(--color-warning)]">Demo Mode</h3>
                    <p className="mb-[8px] text-[11px] text-[var(--color-warning)]">Firebase not configured. Use demo credentials:</p>
                    <div className="flex flex-col gap-[4px]">
                      <div className="rounded-[6px] bg-[rgba(255,255,255,0.5)] py-[4px] px-[8px] font-[var(--font-family-mono)] text-[11px] text-[var(--color-text)]">
                        <strong>User:</strong> user@brightwings.com /
                        password123
                      </div>
                      <div className="rounded-[6px] bg-[rgba(255,255,255,0.5)] py-[4px] px-[8px] font-[var(--font-family-mono)] text-[11px] text-[var(--color-text)]">
                        <strong>Admin:</strong> admin@brightwings.com / admin123
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="mb-[32px] text-center">
                <h2 className="mb-[8px] text-[20px] font-[550] text-[var(--color-text)]">
                  {activeTab === "login"
                    ? "Welcome Back"
                    : "Create Your Account"}
                </h2>
                <p className="m-0 text-[12px] text-[var(--color-text-secondary)]">
                  {activeTab === "login"
                    ? "Sign in to your account to continue your journey"
                    : "Join thousands of travelers and start your journey with us"}
                </p>
              </div>

              {/* Google Sign In/Up Button */}
              <button
                type="button"
                className="mb-[24px] flex w-full cursor-pointer items-center justify-center gap-[12px] rounded-[8px] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-[12px] font-medium text-[var(--color-text)] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleGoogleAuth}
                disabled={googleLoading || loading}
              >
                {googleLoading ? (
                  <div className="h-[16px] w-[16px] animate-spin rounded-full border-2 border-transparent border-t-current"></div>
                ) : (
                  <>
                    <img
                      className="h-[18px] w-[18px]"
                      src="https://developers.google.com/identity/images/g-logo.png"
                      alt="Google"
                    />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <div className="relative mb-[24px] text-center before:absolute before:top-1/2 before:left-0 before:right-0 before:h-px before:bg-[var(--color-border)] before:content-['']">
                <span className="relative bg-[var(--color-surface)] px-[16px] text-[12px] text-[var(--color-text-secondary)]">
                  or {activeTab === "login" ? "sign in" : "sign up"} with phone
                </span>
              </div>

              {/* Main Form */}
              <form className="mb-[16px]" onSubmit={handleSubmit(onSubmit)}>
                {activeTab === "login" ? (
                  // LOGIN FORM
                  <>
                    {/* phone Field */}
                    <div className={groupCls}>
                      <label htmlFor="phone" className={labelCls}>phone number</label>
                      <div className="relative">
                        <i className={`fas fa-phone ${iconCls}`}></i>
                        <input
                          type="tel"
                          id="phone"
                          placeholder="Enter your phone"
                          {...registerField("phone", {
                            required: "Phone is required",
                            minLength: {
                              value: 5,
                              message:
                                "Phone number must be at least 5 characters",
                            },
                            maxLength: {
                              value: 20,
                              message:
                                "Phone number cannot exceed 20 characters",
                            },
                            pattern: {
                              value: /^[0-9+\-\s()]+$/,
                              message: "Please enter a valid phone number",
                            },
                          })}
                          className={inputCls(errors.phone)}
                        />
                      </div>
                      {errors.phone && (
                        <span className={errMsgCls}>
                          <i className="fas fa-exclamation-circle"></i>
                          {errors.phone?.message}
                        </span>
                      )}
                    </div>

                    {/* pin Field */}
                    <div className={groupCls}>
                      <label htmlFor="password" className={labelCls}>PIN</label>
                      <Controller
                        name="password"
                        control={control}
                        rules={{
                          required: "PIN is required",
                          pattern: {
                            value: /^[0-9]{4}$/,
                            message: "PIN must be 4 digits",
                          },
                        }}
                        render={({ field }) => (
                          <PinInput value={field.value || ""} onChange={field.onChange} />
                        )}
                      />
                      {errors.password && (
                        <span className={errMsgCls}>
                          <i className="fas fa-exclamation-circle"></i>
                          {errors.password?.message}
                        </span>
                      )}
                    </div>

                    {/* Forgot pin */}
                    <div className="mb-[24px] flex justify-end">
                      <button
                        type="button"
                        className="cursor-pointer border-none bg-none text-[12px] text-[var(--color-primary)] transition-colors duration-150 hover:underline"
                        onClick={() => setShowResetPassword(true)}
                      >
                        Forgot your password?
                      </button>
                    </div>

                    {/* Login Button */}
                    <button
                      type="submit"
                      className={`${submitBase} bg-[var(--color-primary)] text-[var(--color-btn-primary-text)]`}
                      disabled={loading || googleLoading}
                    >
                      {loading ? (
                        <>
                          <div className="h-[16px] w-[16px] animate-spin rounded-full border-2 border-transparent border-t-current"></div>
                          <span>Signing In...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sign-in-alt"></i>
                          <span>Sign In</span>
                        </>
                      )}
                    </button>

                    {/* Switch to Register */}
                    <div className="mt-[16px] text-center">
                      <p className="m-0 text-[12px] text-[var(--color-text-secondary)]">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          className="cursor-pointer border-none bg-none text-[12px] font-medium text-[var(--color-primary)] transition-colors duration-150 hover:underline"
                          onClick={() => switchTab("register")}
                        >
                          Sign up for free
                        </button>
                      </p>
                    </div>
                  </>
                ) : (
                  // REGISTRATION FORM
                  <>
                    {registrationStep === 1 ? (
                      // Step 1: Basic Information
                      <>
                        {/* Full Name */}
                        <div className={groupCls}>
                          <label htmlFor="name" className={labelCls}>Full Name *</label>
                          <div className="relative">
                            <i className={`fas fa-user ${iconCls}`}></i>
                            <input
                              type="text"
                              id="name"
                              placeholder="Enter your full name"
                              {...registerField("name", {
                                required: "Full name is required",
                                minLength: {
                                  value: 2,
                                  message: "Name must be at least 2 characters",
                                },
                              })}
                              className={inputCls(errors.name)}
                            />
                          </div>
                          {errors.name && (
                            <span className={errMsgCls}>
                              <i className="fas fa-exclamation-circle"></i>
                              {errors.name.message}
                            </span>
                          )}
                        </div>

                        {/* phone */}
                        <div className={groupCls}>
                          <label htmlFor="phone" className={labelCls}>phone number *</label>
                          <div className="relative">
                            <i className={`fas fa-envelope ${iconCls}`}></i>
                            <input
                              type="tel"
                              id="phone"
                              placeholder="Enter your phone"
                              {...registerField("phone", {
                                required: "Phone is required",
                                pattern: {
                                  value: /^[0-9+\-\s()]+$/,
                                  message: "Please enter a valid phone number",
                                },
                              })}
                              className={inputCls(errors.phone)}
                            />
                          </div>
                          {errors.phone && (
                            <span className={errMsgCls}>
                              <i className="fas fa-exclamation-circle"></i>
                              {errors.phone.message}
                            </span>
                          )}
                        </div>

                        {/* pin */}
                        <div className={groupCls}>
                          <label htmlFor="password" className={labelCls}>PIN *</label>
                          <Controller
                            name="password"
                            control={control}
                            rules={{
                              required: "PIN is required",
                              pattern: {
                                value: /^[0-9]{4}$/,
                                message: "PIN must be 4 digits",
                              },
                            }}
                            render={({ field }) => (
                              <PinInput value={field.value || ""} onChange={field.onChange} />
                            )}
                          />
                          {errors.password && (
                            <span className={errMsgCls}>
                              <i className="fas fa-exclamation-circle"></i>
                              {errors.password.message}
                            </span>
                          )}
                        </div>

                        {/* Confirm pin */}
                        <div className={groupCls}>
                          <label htmlFor="confirmPassword" className={labelCls}>Confirm PIN *</label>
                          <Controller
                            name="confirmPassword"
                            control={control}
                            rules={{
                              required: "Please confirm your PIN",
                              validate: (value) =>
                                value === passwordValue || "PINs do not match",
                            }}
                            render={({ field }) => (
                              <PinInput
                                value={field.value || ""}
                                onChange={field.onChange}
                                ariaLabel="Confirm PIN"
                              />
                            )}
                          />
                          {errors.confirmPassword && (
                            <span className={errMsgCls}>
                              <i className="fas fa-exclamation-circle"></i>
                              {errors.confirmPassword.message}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className={`${submitBase} bg-[var(--color-primary)] text-[var(--color-btn-primary-text)]`}
                          onClick={handleNextStep}
                        >
                          <span>Continue</span>
                          <i className="fas fa-arrow-right"></i>
                        </button>

                        {/* Switch to Login */}
                        <div className="mt-[16px] text-center">
                          <p className="m-0 text-[12px] text-[var(--color-text-secondary)]">
                            Already have an account?{" "}
                            <button
                              type="button"
                              className="cursor-pointer border-none bg-none text-[12px] font-medium text-[var(--color-primary)] transition-colors duration-150 hover:underline"
                              onClick={() => switchTab("login")}
                            >
                              Sign in here
                            </button>
                          </p>
                        </div>
                      </>
                    ) : (
                      // Step 2: Additional Information
                      <>
                        <div className="mb-[24px] text-center">
                          <h3 className="mb-[8px] text-[18px] font-[550] text-[var(--color-text)]">Additional Information</h3>
                          <p className="m-0 text-[12px] text-[var(--color-text-secondary)]">Help us personalize your travel experience</p>
                        </div>

                        {/* Phone Number */}
                        <div className={groupCls}>
                          <label htmlFor="phone" className={labelCls}>Phone Number</label>
                          <div className="relative">
                            <i className={`fas fa-phone ${iconCls}`}></i>
                            <input
                              type="tel"
                              id="phone"
                              placeholder="+1 (555) 123-4567"
                              {...registerField("phone", {
                                pattern: {
                                  value: /^[\+]?[0-9\(\)\-\s]+$/,
                                  message: "Please enter a valid phone number",
                                },
                              })}
                              className={inputCls(errors.phone)}
                            />
                          </div>
                          {errors.phone && (
                            <span className={errMsgCls}>
                              <i className="fas fa-exclamation-circle"></i>
                              {errors.phone.message}
                            </span>
                          )}
                        </div>

                        {/* Date of Birth */}
                        <div className={groupCls}>
                          <label htmlFor="dob" className={labelCls}>Date of Birth *</label>
                          <div className="relative">
                            <i className={`fas fa-calendar ${iconCls}`}></i>
                            <input
                              type="date"
                              id="dob"
                              {...registerField("dob", {
                                required: "Date of birth is required",
                              })}
                              className={inputCls(errors.dob)}
                            />
                          </div>
                          {errors.dob && (
                            <span className={errMsgCls}>
                              <i className="fas fa-exclamation-circle"></i>
                              {errors.dob.message}
                            </span>
                          )}
                        </div>

                        {/* Newsletter Subscription */}
                        <div className={groupCls}>
                          <label className="flex cursor-pointer items-start gap-[12px] rounded-[8px] border border-[var(--color-border)] bg-[var(--color-secondary)] p-[16px] text-[12px] text-[var(--color-text)]">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="peer hidden"
                              {...registerField("newsletter")}
                            />
                            <span className="relative mt-[2px] h-[18px] w-[18px] shrink-0 rounded-[6px] border-2 border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-150 peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)] peer-checked:after:absolute peer-checked:after:top-1/2 peer-checked:after:left-1/2 peer-checked:after:-translate-x-1/2 peer-checked:after:-translate-y-1/2 peer-checked:after:text-[11px] peer-checked:after:font-[550] peer-checked:after:text-[var(--color-btn-primary-text)] peer-checked:after:content-['✓']"></span>
                            <div>
                              <strong className="mb-[4px] block text-[var(--color-text)]">Subscribe to our newsletter</strong>
                              <p className="m-0 text-[11px] leading-[1.5] text-[var(--color-text-secondary)]">
                                Get travel deals, tips, and exclusive offers
                                delivered to your inbox
                              </p>
                            </div>
                          </label>
                        </div>

                        <div className="mt-[24px] flex items-center gap-[16px]">
                          <button
                            type="button"
                            className={`${submitBase} mr-[16px] mb-0 w-auto flex-none border border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)]`}
                            onClick={handleBackStep}
                          >
                            <i className="fas fa-arrow-left"></i>
                            <span>Back</span>
                          </button>

                          <button
                            type="submit"
                            className={`${submitBase} flex-1 bg-[var(--color-success)] text-[var(--color-btn-primary-text)]`}
                            disabled={loading || googleLoading}
                          >
                            {loading ? (
                              <>
                                <div className="h-[16px] w-[16px] animate-spin rounded-full border-2 border-transparent border-t-current"></div>
                                <span>Creating Account...</span>
                              </>
                            ) : (
                              <>
                                <i className="fas fa-user-plus"></i>
                                <span>Create Account</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="pt-[16px] text-center">
              <p className="m-0 text-[11px] leading-[1.5] text-[var(--color-text-secondary)]">
                By continuing, you agree to our{" "}
                <a href="#" className="font-medium text-[var(--color-primary)] hover:underline" onClick={(e) => e.preventDefault()}>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="font-medium text-[var(--color-primary)] hover:underline" onClick={(e) => e.preventDefault()}>
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* pin Reset Modal */}
      {showResetPassword && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(0,0,0,0.5)] p-[16px]"
          onClick={() => setShowResetPassword(false)}
        >
          <div className="w-full max-w-[400px] rounded-[10px] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--color-border)] p-[24px]">
              <h3 className="m-0 text-[16px] font-[550] text-[var(--color-text)]">Reset pin</h3>
              <button
                className="cursor-pointer rounded-[6px] border-none bg-none p-[4px] text-[16px] text-[var(--color-text-secondary)] transition-all duration-150 hover:bg-[var(--color-secondary)] hover:text-[var(--color-text)]"
                onClick={() => setShowResetPassword(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-[24px]">
              <p className="mb-[16px] leading-[1.5] text-[var(--color-text-secondary)]">
                Enter your phone number and we'll send you a link to reset your
                password.
              </p>
              <div className={groupCls}>
                <label className={labelCls}>phone number</label>
                <input
                  type="phone"
                  value={phoneValue || ""}
                  readOnly
                  placeholder="Please enter phone in the login form first"
                  className={inputCls(false)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-[12px] border-t border-[var(--color-border)] p-[24px]">
              <button
                className="cursor-pointer rounded-[8px] border border-[var(--color-border)] bg-transparent py-[8px] px-[16px] text-[12px] font-medium text-[var(--color-text-secondary)] transition-all duration-150 hover:bg-[var(--color-secondary)] hover:text-[var(--color-text)]"
                onClick={() => setShowResetPassword(false)}
              >
                Cancel
              </button>
              <button
                className="cursor-pointer rounded-[8px] border border-transparent bg-[var(--color-primary)] py-[8px] px-[16px] text-[12px] font-medium text-[var(--color-btn-primary-text)] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handlePasswordReset}
                disabled={!phoneValue}
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
