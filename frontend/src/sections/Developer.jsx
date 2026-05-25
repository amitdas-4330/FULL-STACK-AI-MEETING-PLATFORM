import { motion } from "framer-motion";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";

const developers = [
  {
    name: "Amit Baran Das",
    role: "MERN Stack Developer | DSA With C++ | Learning AIML",
    image: "/developers/amit-web.jpeg",
    linkedin: "https://www.linkedin.com/",
    github: "https://github.com/amitdas-4330",
  },
  {
    name: "Animesh Dolui",
    role: "Frontend Developer",
    image: "/developers/Animesh.jpeg",
    linkedin: "https://www.linkedin.com/",
    github: "https://github.com/",
  },
  {
    name: "Ashutosh Kumar Jha",
    role: "Backend Developer",
    image: "/developers/asutosh.jpeg",
    linkedin: "https://www.linkedin.com/",
    github: "https://github.com/",
  },
  {
    name: "Subhadip Patra",
    role: "UI/UX Designer",
    image: "/developers/subha-web.jpeg",
    linkedin: "https://www.linkedin.com/",
    github: "https://github.com/",
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.14,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 36,
    scale: 0.94,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: "easeOut",
    },
  },
};

const Developer = () => {
  return (
    <motion.div
      className="bg-slate-900 rounded-3xl p-8 min-h-[500px] overflow-hidden"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >

      <motion.h1
        className="text-4xl font-bold mb-8"
        initial={{ opacity: 0, x: -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        Developer
      </motion.h1>

      <motion.div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        {developers.map((developer, index) => (
          <motion.div
            key={developer.name}
            className="group relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-800 p-6 text-center shadow-lg shadow-black/20"
            variants={cardVariants}
            whileHover={{
              y: -12,
              scale: 1.03,
              transition: { duration: 0.25, ease: "easeOut" },
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.34),_transparent_42%)] opacity-0 transition duration-500 group-hover:opacity-100" />
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/70 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

            <motion.img
              src={developer.image}
              alt={developer.name}
              className="relative z-10 mb-6 h-[110px] w-[110px] rounded-full object-cover ring-4 ring-indigo-500/30"
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                duration: 3.2,
                delay: index * 0.25,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileHover={{
                rotate: [0, -4, 4, 0],
                scale: 1.08,
              }}
            />

            <h2 className="relative z-10 text-2xl font-bold transition duration-300 group-hover:text-indigo-200">
              {developer.name}
            </h2>

            <p className="relative z-10 text-gray-300 mt-4 mb-8">
              {developer.role}
            </p>

            <div className="relative z-10 mt-auto flex justify-center gap-3">
              <motion.a
                href={developer.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label={`${developer.name} LinkedIn profile`}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-sky-300 transition hover:bg-sky-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                whileHover={{ y: -4, scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
              >
                <FaLinkedinIn />
              </motion.a>

              <motion.a
                href={developer.github}
                target="_blank"
                rel="noreferrer"
                aria-label={`${developer.name} GitHub profile`}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-gray-200 transition hover:bg-gray-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-gray-300"
                whileHover={{ y: -4, scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
              >
                <FaGithub />
              </motion.a>
            </div>

          </motion.div>
        ))}
      </motion.div>

    </motion.div>
  );
};

export default Developer;
