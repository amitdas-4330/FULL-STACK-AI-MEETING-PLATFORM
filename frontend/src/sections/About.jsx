import { motion } from "framer-motion";
import {
  FaBrain,
  FaEnvelope,
  FaGithub,
  FaMapMarkerAlt,
  FaMicrophoneAlt,
  FaPhoneAlt,
  FaUsers,
  FaVideo,
} from "react-icons/fa";
import { MdOutlineAutoAwesome } from "react-icons/md";
import {
  SiExpress,
  SiFlask,
  SiMongodb,
  SiOpenai,
  SiReact,
  SiSocketdotio,
  SiTailwindcss,
  SiVite,
} from "react-icons/si";

const highlights = [
  {
    icon: FaVideo,
    title: "Live meeting rooms",
    text: "Create secure meeting spaces, invite participants, and keep the conversation connected from one dashboard.",
  },
  {
    icon: FaMicrophoneAlt,
    title: "Real-time transcripts",
    text: "Capture spoken discussion as readable transcript lines so teams can review important details later.",
  },
  {
    icon: FaBrain,
    title: "AI summaries",
    text: "Generate concise meeting notes from transcripts and preserve the key decisions in your history.",
  },
  {
    icon: FaUsers,
    title: "Attendance tracking",
    text: "See who joined, how long they stayed, and whether they met the required attendance time.",
  },
];

const metrics = [
  {
    value: "4",
    label: "Core modules",
  },
  {
    value: "PDF",
    label: "Report export",
  },
  {
    value: "Live",
    label: "Meeting capture",
  },
];

const technologies = [
  {
    icon: SiReact,
    name: "React",
    detail: "Interactive dashboard UI",
  },
  {
    icon: SiVite,
    name: "Vite",
    detail: "Fast frontend tooling",
  },
  {
    icon: SiTailwindcss,
    name: "Tailwind CSS",
    detail: "Responsive styling",
  },
  {
    icon: SiExpress,
    name: "Express.js",
    detail: "Backend API layer",
  },
  {
    icon: SiMongodb,
    name: "MongoDB",
    detail: "User and app data",
  },
  {
    icon: SiSocketdotio,
    name: "Socket.IO",
    detail: "Live meeting events",
  },
  {
    icon: SiFlask,
    name: "Flask",
    detail: "AI service server",
  },
  {
    icon: SiOpenai,
    name: "OpenAI",
    detail: "Transcript intelligence",
  },
];

const contacts = [
  {
    icon: FaEnvelope,
    label: "Email",
    value: "amitbarandas2@gmail.com",
    href: "mailto:amitbarandas2@gmail.com",
  },
  {
    icon: FaPhoneAlt,
    label: "Phone",
    value: "+91 96411 34330",
    href: "tel:+919641134330",
  },
  {
    icon: FaMapMarkerAlt,
    label: "Location",
    value: "West Bengal, India",
  },
  {
    icon: FaGithub,
    label: "GitHub",
    value: "github.com/amitdas-4330",
    href: "https://github.com/amitdas-4330",
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const About = () => {
  return (
    <motion.div
      className="bg-slate-900 rounded-2xl p-5 sm:p-6 lg:p-8 border border-slate-800 overflow-hidden mb-20"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-8">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
          <div>
            <motion.div
              className="inline-flex items-center gap-2 text-indigo-300 text-sm mb-3"
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <MdOutlineAutoAwesome />
              About MeetAI
            </motion.div>

            <motion.h1
              className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              A smarter workspace for focused online meetings
            </motion.h1>

            <motion.p
              className="text-gray-300 text-sm sm:text-base leading-7 mt-4 max-w-3xl"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              MeetAI combines video meetings, live transcription,
              AI-generated summaries, attendance tracking, and PDF
              reports in one place. It is built for teams, students,
              mentors, and project groups who want meeting outcomes to
              be easy to capture and easy to revisit.
            </motion.p>
          </div>

          <motion.div
            className="grid grid-cols-3 gap-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
          >
            {metrics.map((metric) => (
              <motion.div
                key={metric.label}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center"
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <p className="text-xl sm:text-2xl font-bold text-indigo-300">
                  {metric.value}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {metric.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.18 }}
        >
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                className="group bg-slate-800 border border-slate-700 rounded-xl p-5 transition hover:border-indigo-400/70 hover:bg-slate-800/80"
                variants={itemVariants}
                whileHover={{ y: -8 }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-indigo-300 transition group-hover:bg-indigo-600 group-hover:text-white">
                  <Icon />
                </div>

                <h2 className="text-lg font-bold">
                  {item.title}
                </h2>

                <p className="text-sm text-gray-400 leading-6 mt-2">
                  {item.text}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            className="bg-slate-800 border border-slate-700 rounded-xl p-5"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2 text-indigo-300 mb-4">
              <FaBrain />
              <h2 className="font-bold">Technologies Used</h2>
            </div>

            <motion.div
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              {technologies.map((technology) => {
                const Icon = technology.icon;

                return (
                  <motion.div
                    key={technology.name}
                    className="group rounded-xl border border-slate-700 bg-slate-900 p-4 transition hover:border-indigo-400/70 hover:bg-slate-950"
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                  >
                    <Icon className="text-2xl text-indigo-300 transition group-hover:text-white" />
                    <h3 className="mt-3 font-bold">
                      {technology.name}
                    </h3>
                    <p className="mt-1 text-sm leading-5 text-gray-400">
                      {technology.detail}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          <motion.div
            className="bg-slate-800 border border-slate-700 rounded-xl p-5"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2 text-green-300 mb-4">
              <FaEnvelope />
              <h2 className="font-bold">Contact Details</h2>
            </div>

            <p className="text-sm text-gray-400 leading-6 mb-4">
              Reach out for project questions, collaboration, demo
              requests, or feedback about the meeting platform.
            </p>

            <div className="space-y-3">
              {contacts.map((contact) => {
                const Icon = contact.icon;
                const content = (
                  <>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-indigo-300">
                      <Icon />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-xs text-gray-500">
                        {contact.label}
                      </span>
                      <span className="block break-words text-sm font-semibold text-gray-200">
                        {contact.value}
                      </span>
                    </span>
                  </>
                );

                return contact.href ? (
                  <a
                    key={contact.label}
                    href={contact.href}
                    target={
                      contact.href.startsWith("http")
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      contact.href.startsWith("http")
                        ? "noreferrer"
                        : undefined
                    }
                    className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 p-3 transition hover:border-indigo-400/70 hover:bg-slate-950"
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    key={contact.label}
                    className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 p-3"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default About;
