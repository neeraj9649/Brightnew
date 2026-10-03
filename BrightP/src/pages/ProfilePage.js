import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import Navbar from "../components/Layout/Navbar";
import PinInput from "../components/Common/PinInput";
import MembershipCard from "../components/Profile/MembershipCard";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { userData, updateUserProfile, changePassword, loading } = useAuth(); // FIXED: updateUserProfile instead of updateUserData
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const {
    handleSubmit: handlePasswordSubmit,
    control: controlPassword,
    formState: { errors: passwordErrors },
    watch: watchPassword,
    reset: resetPasswordForm,
  } = useForm();
  const newPasswordValue = watchPassword("newPassword");

  const handleChangePassword = async (data) => {
    try {
      setPasswordSaving(true);
      await changePassword(data.currentPassword, data.newPassword);
      resetPasswordForm();
      setShowChangePassword(false);
    } catch (error) {
      // changePassword() already surfaces a toast on failure
    } finally {
      setPasswordSaving(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      // FIXED: Use correct field mappings from AuthContext
      displayName: userData?.displayName || userData?.name || "",
      phone: userData?.profile?.phone || userData?.phone || "",
      gender: userData?.profile?.gender || userData?.gender || "",
      dateOfBirth: userData?.profile?.dateOfBirth || userData?.dob || "",
    },
  });

  const handleSaveProfile = async (data) => {
    try {
      setUploading(true);

      // FIXED: Structure data correctly for AuthContext
      const updateData = {
        displayName: data.displayName,
        profile: {
          ...userData?.profile,
          phone: data.phone,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
        },
      };

      // Include new profile image if selected
      if (previewImage) {
        updateData.photoURL = previewImage;
      }

      await updateUserProfile(updateData); // FIXED: Use correct function name
      setIsEditing(false);
      setPreviewImage(null);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, or GIF)");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    try {
      setUploading(true);

      // FIXED: Convert image to base64 for real image processing
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const imageDataUrl = e.target.result;
          setPreviewImage(imageDataUrl);

          // Update profile immediately if not in edit mode
          if (!isEditing) {
            await updateUserProfile({
              photoURL: imageDataUrl,
            });
            toast.success("Profile image updated successfully!");
          } else {
            toast.success(
              'Image selected! Click "Save Changes" to update your profile.',
            );
          }
        } catch (error) {
          console.error("Image upload error:", error);
          toast.error("Failed to process image. Please try again.");
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read image file");
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to update profile image. Please try again.");
      setUploading(false);
    }
  };

  const getCurrentProfileImage = () => {
    // Priority: preview image > stored photoURL > stored profileImage > default
    return (
      previewImage ||
      userData?.photoURL ||
      userData?.profileImage ||
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face"
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-container">
        <div className="profile-header">
          <div className="header-content">
            <h1>My Profile</h1>
            <p>Manage your account settings and preferences</p>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <i className="fas fa-user"></i>
            Profile Information
          </button>
          <button
            className={`tab-btn ${activeTab === "membership" ? "active" : ""}`}
            onClick={() => setActiveTab("membership")}
          >
            <i className="fas fa-id-card"></i>
            Membership Card
          </button>
          <button
            className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <i className="fas fa-cog"></i>
            Settings
          </button>
        </div>

        <div className="profile-content">
          {activeTab === "profile" && (
            <div className="profile-info-section">
              <div className="profile-card">
                <div className="card-header">
                  <h2>Personal Information</h2>
                  <button
                    className={`btn ${isEditing ? "btn--secondary" : "btn--primary"} btn--sm`}
                    onClick={() => {
                      setIsEditing(!isEditing);
                      if (isEditing) {
                        setPreviewImage(null); // Clear preview when canceling
                      }
                    }}
                  >
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                <div className="profile-avatar-section">
                  <div className="avatar-container">
                    <img
                      src={getCurrentProfileImage()}
                      alt="Profile"
                      className="profile-avatar"
                    />
                    {uploading && (
                      <div className="avatar-loading">
                        <i className="fas fa-spinner fa-spin"></i>
                      </div>
                    )}
                    <div className="avatar-upload">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: "none" }}
                      />

                      <label htmlFor="avatar-upload" className="upload-btn">
                        <i className="fas fa-camera"></i>
                        {isEditing ? "Change Photo" : "Update Photo"}
                      </label>
                    </div>
                    {previewImage && (
                      <div className="preview-indicator">
                        <i className="fas fa-check-circle"></i>
                        <span>New image selected</span>
                      </div>
                    )}
                  </div>
                  <div className="avatar-info">
                    <h3>{userData?.displayName || userData?.name || "User"}</h3>
                    <p className="user-email">{userData?.email}</p>
                    <div className="w-full flex items-center justify-between">
                      <span className="membership-tier">
                        {userData?.membershipTier || "Bronze"} Member
                      </span>
                      <span className="tokens-count">
                        {userData?.tokens || 0} Wings
                      </span>
                    </div>
                    {userData?.cardNumber && (
                      <div className="card-number">
                        <span>
                          Card:{" "}
                          {userData.cardNumber.replace(/(.{4})/g, "$1 ").trim()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <form
                    onSubmit={handleSubmit(handleSaveProfile)}
                    className="edit-form"
                  >
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          {...register("displayName", {
                            required: "Full name is required",
                          })}
                        />
                        {errors.displayName && (
                          <span className="error-message">
                            {errors.displayName.message}
                          </span>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          {...register("phone", {
                            required: "Phone number is required",
                            pattern: {
                              value: /^[+]?[1-9][\d]{0,15}$/,
                              message: "Please enter a valid phone number",
                            },
                          })}
                        />
                        {errors.phone && (
                          <span className="error-message">
                            {errors.phone.message}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Gender</label>
                        <select
                          {...register("gender", {
                            required: "Please select gender",
                          })}
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not-to-say">
                            Prefer not to say
                          </option>
                        </select>
                        {errors.gender && (
                          <span className="error-message">
                            {errors.gender.message}
                          </span>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Date of Birth</label>
                        <input
                          type="date"
                          {...register("dateOfBirth", {
                            required: "Date of birth is required",
                          })}
                          max={new Date().toISOString().split("T")[0]}
                        />
                        {errors.dateOfBirth && (
                          <span className="error-message">
                            {errors.dateOfBirth.message}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn btn--outline"
                        onClick={() => {
                          setIsEditing(false);
                          setPreviewImage(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn--primary"
                        disabled={uploading}
                      >
                        {uploading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-details">
                    <div className="detail-row">
                      <div className="detail-item">
                        <label>Full Name</label>
                        <value>
                          {userData?.displayName ||
                            userData?.name ||
                            "Not provided"}
                        </value>
                      </div>
                      <div className="detail-item">
                        <label>Phone Number</label>
                        <value>
                          {userData?.profile?.phone ||
                            userData?.phone ||
                            "Not provided"}
                        </value>
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-item">
                        <label>Gender</label>
                        <value>
                          {userData?.profile?.gender ||
                            userData?.gender ||
                            "Not provided"}
                        </value>
                      </div>
                      <div className="detail-item">
                        <label>Date of Birth</label>
                        <value>
                          {userData?.profile?.dateOfBirth ||
                            userData?.dob ||
                            "Not provided"}
                        </value>
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-item">
                        <label>Member Since</label>
                        <value>
                          {userData?.joinedAt
                            ? new Date(
                                userData.joinedAt.seconds
                                  ? userData.joinedAt.seconds * 1000
                                  : userData.joinedAt,
                              ).getFullYear()
                            : "Not available"}
                        </value>
                      </div>
                      <div className="detail-item">
                        <label>Membership Code</label>
                        <value>
                          {userData?.membershipCode || "Not assigned"}
                        </value>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "membership" && (
            <div className="membership-section">
              <div className="membership-card-section">
                <MembershipCard userData={userData} />
              </div>

              <div className="membership-benefits">
                <h3>Your Membership Benefits</h3>
                <div className="benefits-grid">
                  <div className="benefit-card">
                    <i className="fas fa-star"></i>
                    <h4>Member Discounts</h4>
                    <p>Exclusive discounts on all bookings</p>
                  </div>
                  <div className="benefit-card">
                    <i className="fas fa-coins"></i>
                    <h4>Wings Rewards</h4>
                    <p>Earn Wings with every purchase</p>
                  </div>
                  <div className="benefit-card">
                    <i className="fas fa-headset"></i>
                    <h4>Priority Support</h4>
                    <p>24/7 customer support access</p>
                  </div>
                  <div className="benefit-card">
                    <i className="fas fa-gift"></i>
                    <h4>Special Offers</h4>
                    <p>Early access to exclusive deals</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="settings-section">
              <div className="settings-card">
                <h2>Account Settings</h2>
                <div className="settings-list">
                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Email Notifications</h4>
                      <p>Receive booking confirmations and updates via email</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>SMS Notifications</h4>
                      <p>Get important updates via text messages</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Marketing Communications</h4>
                      <p>Receive promotional offers and travel deals</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <div className="danger-zone">
                  <h3>Danger Zone</h3>
                  <div className="danger-actions">
                    <button
                      className="btn btn--outline btn--sm"
                      onClick={() => setShowChangePassword((v) => !v)}
                    >
                      <i className="fas fa-key"></i>
                      Change Password
                    </button>
                    <button className="btn btn--danger btn--sm">
                      <i className="fas fa-trash"></i>
                      Delete Account
                    </button>
                  </div>

                  {showChangePassword && (
                    <form
                      onSubmit={handlePasswordSubmit(handleChangePassword)}
                      className="edit-form"
                      style={{ marginTop: "1rem" }}
                    >
                      <div className="form-group">
                        <label>Current PIN</label>
                        <Controller
                          name="currentPassword"
                          control={controlPassword}
                          rules={{ required: "Current PIN is required" }}
                          render={({ field }) => (
                            <PinInput
                              value={field.value || ""}
                              onChange={field.onChange}
                              ariaLabel="Current PIN"
                            />
                          )}
                        />
                        {passwordErrors.currentPassword && (
                          <span className="error-message">
                            {passwordErrors.currentPassword.message}
                          </span>
                        )}
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>New PIN</label>
                          <Controller
                            name="newPassword"
                            control={controlPassword}
                            rules={{
                              required: "New PIN is required",
                              pattern: {
                                value: /^[0-9]{4}$/,
                                message: "PIN must be 4 digits",
                              },
                            }}
                            render={({ field }) => (
                              <PinInput
                                value={field.value || ""}
                                onChange={field.onChange}
                                ariaLabel="New PIN"
                              />
                            )}
                          />
                          {passwordErrors.newPassword && (
                            <span className="error-message">
                              {passwordErrors.newPassword.message}
                            </span>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Confirm New PIN</label>
                          <Controller
                            name="confirmPassword"
                            control={controlPassword}
                            rules={{
                              required: "Please confirm your new PIN",
                              validate: (value) =>
                                value === newPasswordValue || "PINs do not match",
                            }}
                            render={({ field }) => (
                              <PinInput
                                value={field.value || ""}
                                onChange={field.onChange}
                                ariaLabel="Confirm New PIN"
                              />
                            )}
                          />
                          {passwordErrors.confirmPassword && (
                            <span className="error-message">
                              {passwordErrors.confirmPassword.message}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="form-actions">
                        <button
                          type="button"
                          className="btn btn--outline"
                          onClick={() => setShowChangePassword(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn--primary"
                          disabled={passwordSaving}
                        >
                          {passwordSaving ? "Saving..." : "Update Password"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

