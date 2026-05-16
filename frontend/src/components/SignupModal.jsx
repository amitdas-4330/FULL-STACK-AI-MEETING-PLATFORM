import { useState } from "react";

import API from "../api/axios";

const SignupModal = ({ setShowSignup }) => {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
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
