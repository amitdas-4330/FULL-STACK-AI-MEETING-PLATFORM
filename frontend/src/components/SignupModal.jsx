import { useState } from "react";

import API from "../api/axios";

const SignupModal = ({ setShowSignup }) => {

  const [formData, setFormData] = useState({
    name: "",
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

      await API.post(
        "/auth/signup",
        formData
      );

      alert("Signup Successful");

      setShowSignup(false);

    } catch (error) {

      alert(error.response.data.message);

    }

  };

  return (

    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">

      <div className="bg-slate-900 w-[400px] p-8 rounded-3xl border border-slate-700">

        <div className="flex items-center justify-between mb-6">

          <h1 className="text-3xl font-bold">
            Signup
          </h1>

          <button
            onClick={() => setShowSignup(false)}
            className="text-2xl"
          >
            ×
          </button>

        </div>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-slate-800 p-4 rounded-xl mb-4 outline-none"
          />

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

          <button className="w-full bg-green-600 py-4 rounded-xl">
            Create Account
          </button>

        </form>

      </div>

    </div>

  );
};

export default SignupModal;