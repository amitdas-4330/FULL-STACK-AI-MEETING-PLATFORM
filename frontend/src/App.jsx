import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  useEffect,
  useState,
} from "react";
import { FaTimes } from "react-icons/fa";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Home from "./sections/Home";
import FeatureVideos from "./sections/FeatureVideos";
import Transcript from "./sections/Transcript";
import Summary from "./sections/Summary";
import Developer from "./sections/Developer";
import About from "./sections/About";
import Feedback from "./sections/Feedback";

import MeetingRoom from "./pages/MeetingRoom";

function Dashboard() {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [productDemoOpen, setProductDemoOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {

    if (!location.state?.showFeedback) {
      return;
    }

    window.setTimeout(() => {
      setFeedbackOpen(true);
    }, 0);

    navigate(".", {
      replace: true,
      state: {},
    });

  }, [location.state, navigate]);

  return (
    <div className="bg-slate-950 min-h-screen text-white">

      {/* NAVBAR */}

      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

      <div className="flex">

        {/* SIDEBAR */}

        <Sidebar
          mobileOpen={sidebarOpen}
          setMobileOpen={setSidebarOpen}
          onOpenProductDemo={() => setProductDemoOpen(true)}
        />

        {/* MAIN CONTENT */}

        <main
          className="
            flex-1
            lg:ml-[250px]
            mt-[70px]
            md:mt-[80px]
            px-3
            sm:px-4
            md:px-6
            lg:px-8
            py-6
            space-y-8
            overflow-x-hidden
          "
        >

          {/* HOME */}

          <section
            id="home"
            className="
              scroll-mt-24
            "
          >
            <Home />
          </section>

          {/* TRANSCRIPT */}

          <section
            id="transcript"
            className="
              scroll-mt-24
            "
          >
            <Transcript />
          </section>

          {/* SUMMARY */}

          <section
            id="summary"
            className="
              scroll-mt-24
            "
          >
            <Summary />
          </section>

          {/* DEVELOPER */}

          <section
            id="developer"
            className="
              scroll-mt-24
            "
          >
            <Developer />
          </section>

          {/* ABOUT */}

          <section
            id="about"
            className="
              scroll-mt-24
            "
          >
            <About />
          </section>

          <footer className="footer-shell">

            <div className="footer-content">

              <div className="footer-brand">

                <a
                  href="#home"
                  aria-label="MeetAI home"
                  className="footer-brand-link"
                >
                  <img
                    src="/meetai-icon-navbar.png"
                    alt=""
                    className="footer-brand-logo"
                  />

                  <span className="footer-brand-name">
                    MeetAI
                  </span>
                </a>

                <p className="footer-brand-copy">
                  Intelligent meeting summaries, transcripts, and insights
                  for faster team decisions.
                </p>

              </div>

              <div className="footer-links">

                <a href="#home">
                  Home
                </a>

                <a href="#summary">
                  Summary
                </a>

                <a href="#developer">
                  Developer
                </a>

                <a href="#about">
                  About
                </a>

              </div>

            </div>

            <div className="footer-bottom">

              <p>
                Built for secure, productive AI-powered meetings.
              </p>

              <p>
                &copy; {currentYear} MeetAI. All rights reserved.
              </p>

            </div>

          </footer>

        </main>

      </div>

      {feedbackOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-3 py-5">
          <button
            type="button"
            aria-label="Close feedback form"
            className="absolute inset-0 cursor-default"
            onClick={() => setFeedbackOpen(false)}
          />

          <div className="relative z-10 w-full max-w-xl max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              aria-label="Close feedback form"
              onClick={() => setFeedbackOpen(false)}
              className="absolute right-3 top-3 z-20 rounded-full bg-slate-950/90 p-3 text-white transition hover:bg-slate-800"
            >
              <FaTimes />
            </button>

            <Feedback />
          </div>
        </div>
      )}

      {productDemoOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-3 py-5">
          <button
            type="button"
            aria-label="Close product demo"
            className="absolute inset-0 cursor-default"
            onClick={() => setProductDemoOpen(false)}
          />

          <div className="relative z-10 w-full max-w-6xl max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              aria-label="Close product demo"
              onClick={() => setProductDemoOpen(false)}
              className="absolute right-3 top-3 z-20 rounded-full bg-slate-950/90 p-3 text-white transition hover:bg-slate-800"
            >
              <FaTimes />
            </button>

            <FeatureVideos />
          </div>
        </div>
      )}

    </div>
  );
}

function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* DASHBOARD */}

        <Route
          path="/"
          element={<Dashboard />}
        />

        {/* LIVE MEETING ROOM */}

        <Route
          path="/meeting/:roomId"
          element={<MeetingRoom />}
        />

      </Routes>

    </BrowserRouter>

  );
}

export default App;
