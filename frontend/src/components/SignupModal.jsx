import { useState } from "react";
import { FaCamera } from "react-icons/fa";

import API from "../api/axios";

const SignupModal = ({ setShowSignup }) => {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    profilePic: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {

    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });

  };

  const handleProfilePhotoChange = (event) => {

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Profile photo must be under 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setFormData((currentForm) => ({
        ...currentForm,
        profilePic: reader.result,
      }));
      setError("");
    };

    reader.onerror = () => {
      setError("Could not read that image. Try another one.");
    };

    reader.readAsDataURL(file);

  };

  const handleSubmit = async (event) => {

    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {

      await API.post(
        "/auth/signup",
        formData
      );

      setSuccess("Account created. You can log in now.");
      setFormData({
        name: "",
        email: "",
        password: "",
        profilePic: "",
      });

    } catch (error) {

      setError(
        error.response?.data?.message ||
          "Signup failed. Please try again."
      );

    } finally {

      setLoading(false);

    }

  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
      <div className="bg-slate-900 w-full max-w-[400px] p-8 rounded-3xl border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            Signup
          </h1>

          <button
            type="button"
            onClick={() => setShowSignup(false)}
            className="text-2xl"
            aria-label="Close signup modal"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="mb-5 flex flex-col items-center gap-3 cursor-pointer">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border border-slate-700 bg-slate-800">
              {formData.profilePic ? (
                <img
                  src={formData.profilePic}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl text-indigo-300">
                  <FaCamera />
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs">
                Photo
              </div>
            </div>

            <span className="text-sm text-indigo-300">
              Add profile photo
            </span>

            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePhotoChange}
              className="sr-only"
            />
          </label>

          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full bg-slate-800 p-4 rounded-xl mb-4 outline-none"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full bg-slate-800 p-4 rounded-xl mb-4 outline-none"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full bg-slate-800 p-4 rounded-xl mb-4 outline-none"
          />

          {error && (
            <p className="text-red-400 text-sm mb-4">
              {error}
            </p>
          )}

          {success && (
            <p className="text-green-400 text-sm mb-4">
              {success}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full bg-green-600 disabled:bg-slate-700 py-4 rounded-xl"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );

};

export default SignupModal;
