import { useContext, useState } from "react";

import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";

const LoginModal = ({ setShowLogin }) => {

  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const res = await API.post(
        "/auth/login",
        formData
      );

      login(res.data);

      alert("Login Successful");

      setShowLogin(false);

    } catch (error) {

      alert(error.response.data.message);

    }

  };

  return (

    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">

      <div className="bg-slate-900 w-[400px] p-8 rounded-3xl border border-slate-700">

        <div className="flex items-center justify-between mb-6">

          <h1 className="text-3xl font-bold">
            Login
          </h1>

          <button
            onClick={() => setShowLogin(false)}
            className="text-2xl"
          >
            ×
          </button>

        </div>

        <form onSubmit={handleSubmit}>

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-slate-800 p-4 rounded-xl mb-4 outline-none"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full bg-slate-800 p-4 rounded-xl mb-6 outline-none"
          />

          <button className="w-full bg-indigo-600 py-4 rounded-xl">
            Login
          </button>

        </form>

      </div>

    </div>

  );
};

export default LoginModal;