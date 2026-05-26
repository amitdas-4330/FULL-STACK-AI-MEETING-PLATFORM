import { useContext, useState } from "react";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
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
      className="bg-slate-900 rounded-2xl p-5 sm:p-6 lg:p-8 border border-slate-800 overflow-hidden"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <div className="inline-flex items-center gap-2 text-indigo-300 text-sm mb-3">
            <FaCommentDots />
            Feedback
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
            Help us improve MeetAI
          </h1>

          <p className="text-gray-300 text-sm sm:text-base leading-7 mt-4">
            Share what worked well, what felt confusing, or what you
            would like to see next. Your feedback helps shape a better
            meeting experience.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 mt-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <FaCheckCircle className="text-green-300 mb-3" />
              <h2 className="font-bold">Quick review</h2>
              <p className="text-sm text-gray-400 leading-6 mt-2">
                Rate the platform and leave a short message in one
                place.
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <FaPaperPlane className="text-indigo-300 mb-3" />
              <h2 className="font-bold">Saved locally</h2>
              <p className="text-sm text-gray-400 leading-6 mt-2">
                Submissions are stored in this browser until a backend
                feedback API is connected.
              </p>
            </div>
          </div>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4"
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none transition focus:border-indigo-500"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none transition focus:border-indigo-500"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none transition focus:border-indigo-500"
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
              <div className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-3">
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
              rows="5"
              className="w-full resize-none bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none transition focus:border-indigo-500"
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
            className="navbar-action flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold transition hover:bg-indigo-500 sm:w-auto"
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
