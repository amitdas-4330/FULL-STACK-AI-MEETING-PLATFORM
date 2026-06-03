import { useContext, useState } from "react";
import { HiMenuAlt2, HiMenuAlt3, HiX } from "react-icons/hi";

import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";

import API from "../api/axios";
import { AuthContext } from "../context/AuthContextValue";

const UserAvatar = ({ currentUser }) => {

  const initial =
    currentUser?.name?.charAt(0)?.toUpperCase() || "U";

  return (
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
        overflow-hidden
        shrink-0
      "
    >
      {currentUser?.profilePic ? (
        <img
          src={currentUser.profilePic}
          alt={`${currentUser.name || "User"} profile`}
          className="h-full w-full object-cover"
        />
      ) : (
        initial
      )}
    </div>
  );

};

const createProfilePhotoDataUrl = (file) =>
  new Promise((resolve, reject) => {

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {

      const size = 512;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const scale = Math.max(
        size / image.width,
        size / image.height
      );
      const width = image.width * scale;
      const height = image.height * scale;
      const x = (size - width) / 2;
      const y = (size - height) / 2;

      canvas.width = size;
      canvas.height = size;

      context.drawImage(
        image,
        x,
        y,
        width,
        height
      );

      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.82));

    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read that image."));
    };

    image.src = objectUrl;

  });

const Navbar = ({ onOpenSidebar }) => {

  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const {
    user,
    updateUser,
    logout,
  } = useContext(AuthContext);
  const [photoError, setPhotoError] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);

  const handleProfilePhotoChange = async (event) => {

    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || photoUploading) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoError("Choose an image file.");
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setPhotoError("Photo must be under 6 MB.");
      return;
    }

    if (!user?.token) {
      setPhotoError("Login again before updating photo.");
      return;
    }

    setPhotoUploading(true);
    setPhotoError("");

    try {

      const profilePic =
        await createProfilePhotoDataUrl(file);

      const response = await API.put(
        "/auth/profile-photo",
        {
          profilePic,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      updateUser(response.data.user);

    } catch (error) {

      const status = error.response?.status;

      setPhotoError(
        error.response?.data?.message ||
          (status
            ? `Photo update failed (${status}).`
            : error.message || "Could not update profile photo.")
      );

    } finally {

      setPhotoUploading(false);

    }

  };

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

          {/* LOGO */}

          <a
            href="#home"
            aria-label="MeetAI home"
            className="
              navbar-brand
              cursor-pointer
            "
          >
            <img
              src="/meetai-icon-navbar.png"
              alt=""
              className="navbar-brand-logo"
            />
            <span className="navbar-brand-text">
              MeetAI
            </span>
          </a>

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

                  <label
                    className="cursor-pointer"
                    title="Change profile photo"
                  >
                    <UserAvatar currentUser={user?.user} />

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      className="sr-only"
                    />
                  </label>

                  <div className="flex flex-col">

                    <span className="text-sm font-semibold text-white">
                      {user?.user?.name}
                    </span>

                    <span className="text-xs text-gray-400">
                      {photoUploading ? "Updating photo..." : "Online"}
                    </span>

                    {photoError && (
                      <span className="text-xs text-red-300">
                        {photoError}
                      </span>
                    )}

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

            <button
              type="button"
              onClick={() => {
                onOpenSidebar();
                setMobileMenu(false);
              }}
              className="navbar-mobile-link flex items-center gap-2 text-left"
            >
              <HiMenuAlt2 />
              Meeting Tools
            </button>

            <a
              href="#home"
              onClick={() => setMobileMenu(false)}
              className="navbar-mobile-link"
            >
              Home
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

                    <label
                      className="cursor-pointer"
                      title="Change profile photo"
                    >
                      <UserAvatar currentUser={user?.user} />

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="sr-only"
                      />
                    </label>

                    <div>

                      <h3 className="font-semibold">
                        {user?.user?.name}
                      </h3>

                      <p className="text-sm text-gray-400">
                        {photoUploading
                          ? "Updating photo..."
                          : "Logged In"}
                      </p>

                      {photoError && (
                        <p className="text-xs text-red-300">
                          {photoError}
                        </p>
                      )}

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
