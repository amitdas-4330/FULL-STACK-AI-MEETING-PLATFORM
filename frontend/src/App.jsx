import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Home from "./sections/Home";
import Transcript from "./sections/Transcript";
import Summary from "./sections/Summary";
import Developer from "./sections/Developer";
import About from "./sections/About";

import MeetingRoom from "./pages/MeetingRoom";

function Dashboard() {

  return (
    <div className="bg-slate-950 min-h-screen text-white">

      {/* NAVBAR */}

      <Navbar />

      <div className="flex">

        {/* SIDEBAR */}

        <Sidebar />

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
          path="/meeting"
          element={<MeetingRoom />}
        />

      </Routes>

    </BrowserRouter>

  );
}

export default App;