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
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {

    if (!location.state?.showFeedback) {
      return;
    }

    window.setTimeout(() => {
      document
        .getElementById("feedback")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

      navigate(".", {
        replace: true,
        state: {},
      });
    }, 100);

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

          {/* FEATURE VIDEOS */}

          <section
            id="feature-videos"
            className="
              scroll-mt-24
            "
          >
            <FeatureVideos />
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

          {/* FEEDBACK */}

          <section
            id="feedback"
            className="
              scroll-mt-24
            "
          >
            <Feedback />
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

                <a href="#feedback">
                  Feedback
                </a>

              </div>

            </div>

            <div className="footer-bottom">

              <p>
                &copy; {currentYear} MeetAI. All rights reserved.
              </p>

              <p>
                Built for secure, productive AI-powered meetings.
              </p>

            </div>

          </footer>

        </main>

      </div>

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
