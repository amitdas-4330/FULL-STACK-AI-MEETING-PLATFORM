import { useContext, useState } from "react";
import { HiMenuAlt2, HiMenuAlt3, HiX } from "react-icons/hi";

import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";

import { AuthContext } from "../context/AuthContextValue";

const Navbar = ({ onOpenSidebar }) => {

  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const { user, logout } = useContext(AuthContext);

  return (
    <>
      <nav
        className="
          navbar-shell
          fixed
          top-0
          left-0
          w-full
          h-[70px]
          md:h-[80px]
          bg-slate-900/90
          backdrop-blur-lg
          border-b
          border-slate-700
          z-50
          flex
          items-center
          justify-between
          px-4
          sm:px-6
          lg:px-10
        "
      >

        <div className="flex items-center gap-3">

          {/* SIDEBAR TOGGLE */}

          <button
            type="button"
            onClick={onOpenSidebar}
            className="
              navbar-icon-btn
              lg:hidden
              text-white
              text-3xl
              p-1
              -ml-1
            "
            aria-label="Open sidebar"
          >
            <HiMenuAlt2 />
          </button>

          {/* LOGO */}

          <div
            className="
              text-2xl
              sm:text-3xl
              font-bold
              text-indigo-400
              cursor-pointer
            "
          >
            MeetAI
          </div>

        </div>

        {/* DESKTOP MENU */}

        <div
          className="
            hidden
            lg:flex
            items-center
            gap-6
            lg:gap-8
            text-gray-300
            font-medium
          "
        >

          <a
            href="#home"
            className="navbar-link"
          >
            Home
          </a>

          <a
            href="#transcript"
            className="navbar-link"
          >
            Transcript
          </a>

          <a
            href="#summary"
            className="navbar-link"
          >
            Summary
          </a>

          <a
            href="#developer"
            className="navbar-link"
          >
            Developer
          </a>

          <a
            href="#about"
            className="navbar-link"
          >
            About
          </a>

          <a
            href="#feedback"
            className="navbar-link"
          >
            Feedback
          </a>

        </div>

        {/* RIGHT SECTION */}

        <div className="hidden lg:flex items-center gap-4">

          {
            !user ? (

              <>
                <button
                  onClick={() => setShowLogin(true)}
                  className="
                    navbar-action
                    bg-slate-700
                    hover:bg-slate-600
                    transition
                    duration-300
                    px-5
                    py-2
                    rounded-xl
                  "
                >
                  Login
                </button>

                <button
                  onClick={() => setShowSignup(true)}
                  className="
                    navbar-action
                    bg-indigo-600
                    hover:bg-indigo-500
                    transition
                    duration-300
                    px-5
                    py-2
                    rounded-xl
                  "
                >
                  Signup
                </button>
              </>

            ) : (

              <>
                {/* USER INFO */}

                <div className="flex items-center gap-3">

                  <div
                  className="
                    navbar-avatar
                      w-[42px]
                      h-[42px]
                      rounded-full
                      bg-indigo-600
                      flex
                      items-center
                      justify-center
                      font-bold
                      text-lg
                    "
                  >
                    {
                      user?.user?.name?.charAt(0)?.toUpperCase()
                    }
                  </div>

                  <div className="flex flex-col">

                    <span className="text-sm font-semibold text-white">
                      {user?.user?.name}
                    </span>

                    <span className="text-xs text-gray-400">
                      Online
                    </span>

                  </div>

                </div>

                {/* LOGOUT BUTTON */}

                <button
                  onClick={logout}
                  className="
                    navbar-action
                    bg-red-500
                    hover:bg-red-400
                    transition
                    duration-300
                    px-5
                    py-2
                    rounded-xl
                  "
                >
                  Logout
                </button>

              </>

            )
          }

        </div>

        {/* MOBILE MENU BUTTON */}

        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="
            navbar-icon-btn
            lg:hidden
            text-white
            text-3xl
          "
        >

          {
            mobileMenu
              ? <HiX />
              : <HiMenuAlt3 />
          }

        </button>

      </nav>

      {/* MOBILE MENU */}

      {
        mobileMenu && (

          <div
            className="
              navbar-mobile-menu
              fixed
              top-[70px]
              md:top-[80px]
              left-0
              w-full
              bg-slate-900
              border-b
              border-slate-700
              z-40
              flex
              flex-col
              items-start
              px-6
              py-6
              gap-5
              lg:hidden
            "
          >

            <a
              href="#home"
              onClick={() => setMobileMenu(false)}
              className="navbar-mobile-link"
            >
              Home
            </a>

            <a
              href="#transcript"
              onClick={() => setMobileMenu(false)}
              className="navbar-mobile-link"
            >
              Transcript
            </a>

            <a
              href="#summary"
              onClick={() => setMobileMenu(false)}
              className="navbar-mobile-link"
            >
              Summary
            </a>

            <a
              href="#developer"
              onClick={() => setMobileMenu(false)}
              className="navbar-mobile-link"
            >
              Developer
            </a>

            <a
              href="#about"
              onClick={() => setMobileMenu(false)}
              className="navbar-mobile-link"
            >
              About
            </a>

            <a
              href="#feedback"
              onClick={() => setMobileMenu(false)}
              className="navbar-mobile-link"
            >
              Feedback
            </a>

            {/* MOBILE AUTH */}

            {
              !user ? (

                <div className="flex items-center gap-4 pt-2">

                  <button
                    onClick={() => {
                      setShowLogin(true);
                      setMobileMenu(false);
                    }}
                    className="
                      navbar-action
                      bg-slate-700
                      px-5
                      py-2
                      rounded-xl
                    "
                  >
                    Login
                  </button>

                  <button
                    onClick={() => {
                      setShowSignup(true);
                      setMobileMenu(false);
                    }}
                    className="
                      navbar-action
                      bg-indigo-600
                      px-5
                      py-2
                      rounded-xl
                    "
                  >
                    Signup
                  </button>

                </div>

              ) : (

                <div className="w-full">

                  <div className="flex items-center gap-3 mb-4">

                    <div
                      className="
                        navbar-avatar
                        w-[42px]
                        h-[42px]
                        rounded-full
                        bg-indigo-600
                        flex
                        items-center
                        justify-center
                        font-bold
                        text-lg
                      "
                    >
                      {
                        user?.user?.name?.charAt(0)?.toUpperCase()
                      }
                    </div>

                    <div>

                      <h3 className="font-semibold">
                        {user?.user?.name}
                      </h3>

                      <p className="text-sm text-gray-400">
                        Logged In
                      </p>

                    </div>

                  </div>

                  <button
                    onClick={() => {
                      logout();
                      setMobileMenu(false);
                    }}
                    className="
                      navbar-action
                      bg-red-500
                      px-5
                      py-2
                      rounded-xl
                    "
                  >
                    Logout
                  </button>

                </div>

              )
            }

          </div>

        )
      }

      {/* LOGIN MODAL */}

      {
        showLogin &&
        <LoginModal setShowLogin={setShowLogin} />
      }

      {/* SIGNUP MODAL */}

      {
        showSignup &&
        <SignupModal setShowSignup={setShowSignup} />
      }

    </>
  );
};

export default Navbar;
