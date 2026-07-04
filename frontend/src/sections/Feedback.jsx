import { useContext, useState } from "react";
import { motion } from "framer-motion";
import {
  FaCommentDots,
  FaEnvelope,
  FaPaperPlane,
  FaRegStar,
  FaStar,
  FaUser,
} from "react-icons/fa";

import { AuthContext } from "../context/AuthContextValue";

const feedbackTypes = [
  "General feedback",
  "Bug report",
  "Feature request",
  "Meeting experience",
];

const initialForm = {
  name: "",
  email: "",
  type: feedbackTypes[0],
  rating: 5,
  message: "",
};

const Feedback = () => {

  const { user } = useContext(AuthContext);
  const currentUser = user?.user;

  const [form, setForm] = useState(() => ({
    ...initialForm,
    name: currentUser?.name || "",
    email: currentUser?.email || "",
  }));
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setError("");
    setSubmitted(false);
  };

  const handleSubmit = (event) => {

    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();

    if (!name || !email || !message) {
      setError("Please fill in your name, email, and feedback.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const savedFeedback = JSON.parse(
      localStorage.getItem("meetai-feedback") || "[]"
    );

    localStorage.setItem(
      "meetai-feedback",
      JSON.stringify([
        {
          ...form,
          name,
          email,
          message,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        },
        ...savedFeedback,
      ])
    );

    setForm({
      ...initialForm,
      name: currentUser?.name || "",
      email: currentUser?.email || "",
    });
    setSubmitted(true);
    setError("");

  };

  return (
    <motion.div
      className="overflow-hidden"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-xl">
        <motion.form
          onSubmit={handleSubmit}
          className="min-h-[640px] bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl shadow-black/30"
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="border-b border-slate-800 pb-5 pr-12">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
              <FaCommentDots />
            </div>

            <h2 className="text-2xl font-bold">
              Share your feedback
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Tell us how the meeting experience felt.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-200 mb-2">
                <FaUser className="text-indigo-300" />
                Name
              </span>
              <input
                value={form.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                placeholder="Your name"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>

            <label className="block">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-200 mb-2">
                <FaEnvelope className="text-indigo-300" />
                Email
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="block text-sm font-semibold text-gray-200 mb-2">
                Feedback type
              </span>
              <select
                value={form.type}
                onChange={(event) =>
                  updateField("type", event.target.value)
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {feedbackTypes.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="block text-sm font-semibold text-gray-200 mb-2">
                Rating
              </span>
              <div className="flex items-center gap-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-3.5">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => updateField("rating", rating)}
                    className="text-xl text-yellow-300 transition hover:scale-110"
                    aria-label={`${rating} star rating`}
                  >
                    {rating <= form.rating ? (
                      <FaStar />
                    ) : (
                      <FaRegStar />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="block">
            <span className="block text-sm font-semibold text-gray-200 mb-2">
              Message
            </span>
            <textarea
              value={form.message}
              onChange={(event) =>
                updateField("message", event.target.value)
              }
              placeholder="Write your feedback here..."
              rows="8"
              className="min-h-[190px] w-full resize-none bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>

          {error && (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          {submitted && (
            <p className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              Thank you. Your feedback has been saved successfully.
            </p>
          )}

          <button
            type="submit"
            className="navbar-action flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold transition hover:bg-indigo-500"
          >
            <FaPaperPlane />
            Submit Feedback
          </button>
        </motion.form>
      </div>
    </motion.div>
  );
};

export default Feedback;
