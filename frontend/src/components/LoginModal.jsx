import { useContext, useState } from "react";

import API from "../api/axios";
import { AuthContext } from "../context/AuthContextValue";

const LoginModal = ({
  setShowLogin,
  setShowSignup,
  message,
}) => {

  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
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
    setLoading(true);

    try {

      const response = await API.post(
        "/auth/login",
        formData
      );

      login(response.data);
      setShowLogin(false);

    } catch (error) {

      setError(
        error.response?.data?.message ||
          "Login failed. Please try again."
      );

    } finally {

      setLoading(false);

    }

  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
      <div className="bg-slate-900 w-full max-w-[400px] p-8 rounded-3xl border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              Login
            </h1>

            <p className="text-sm text-gray-400 mt-2">
              {message || "Sign in to continue."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowLogin(false)}
            className="text-2xl"
            aria-label="Close login modal"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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
            className="w-full bg-slate-800 p-4 rounded-xl mb-4 outline-none"
          />

          {error && (
            <p className="text-red-400 text-sm mb-4">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full bg-indigo-600 disabled:bg-slate-700 py-4 rounded-xl"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {setShowSignup && (
          <button
            type="button"
            onClick={() => {
              setShowLogin(false);
              setShowSignup(true);
            }}
            className="w-full mt-4 text-sm text-indigo-300 hover:text-indigo-200"
          >
            Need an account? Create one
          </button>
        )}
      </div>
    </div>
  );

};

export default LoginModal;
