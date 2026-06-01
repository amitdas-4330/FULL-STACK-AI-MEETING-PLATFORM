import {
  FaVideo,
  FaUsers,
  FaRobot,
  FaArrowRight,
  FaClock,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import {
  useContext,
  useState,
} from "react";

import LoginModal from "../components/LoginModal";
import SignupModal from "../components/SignupModal";
import { AuthContext } from "../context/AuthContextValue";

const createRoomCode = () => {

  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const segmentLength = 3;
  const segmentCount = 3;

  return Array.from(
    {
      length: segmentCount,
    },
    () =>
      Array.from(
        {
          length: segmentLength,
        },
        () =>
          alphabet[
            Math.floor(Math.random() * alphabet.length)
          ]
      ).join("")
  ).join("-");

};

const Home = () => {

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [meetingId, setMeetingId] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const getRoomIdFromInput = (value) => {

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return "";
    }

    try {
      const url = new URL(trimmedValue);
      const meetingPrefix = "/meeting/";
      const meetingIndex =
        url.pathname.indexOf(meetingPrefix);

      if (meetingIndex >= 0) {
        return decodeURIComponent(
          url.pathname.slice(
            meetingIndex + meetingPrefix.length
          )
        );
      }
    } catch {
      return trimmedValue;
    }

    return trimmedValue;

  };

  // START MEETING

  const handleStartMeeting = () => {

    if (!user) {
      setAuthMessage("Login is required to start a meeting.");
      setShowLogin(true);
      return;
    }

    const roomId = createRoomCode();

    navigate(`/meeting/${roomId}`);
  };

  // JOIN MEETING

  const handleJoinMeeting = (event) => {

    event?.preventDefault();

    const roomId = getRoomIdFromInput(meetingId);

    if (roomId) {

      if (!user) {
        setAuthMessage("Login is required to join a meeting.");
        setShowLogin(true);
        return;
      }

      navigate(`/meeting/${encodeURIComponent(roomId)}`);

    }

  };

  return (

    <div
      className="
        bg-slate-900
        rounded-2xl
        p-4
        sm:p-5
        lg:p-6
        border
        border-slate-800
      "
    >

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-indigo-300 text-sm mb-3">
            <FaRobot />
            AI meeting workspace
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
            Start or join a meeting
          </h1>

          <p className="text-gray-400 text-sm sm:text-base mt-2 leading-6">
            Open a room, invite participants, record live
            transcripts, track attendance and generate summaries.
          </p>

          {!user && (
            <div className="mt-4 bg-slate-800 border border-indigo-500/30 rounded-xl p-4">
              <p className="text-sm font-semibold text-indigo-200">
                Login required
              </p>

              <p className="text-sm text-gray-400 mt-1">
                Sign in before starting or joining a meeting.
              </p>

              <div className="flex flex-wrap gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMessage("Login is required to start a meeting.");
                    setShowLogin(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm"
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => setShowSignup(true)}
                  className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleStartMeeting}
          className="
            bg-indigo-600
            hover:bg-indigo-500
            transition
            px-5
            py-3
            rounded-xl
            font-semibold
            flex
            items-center
            justify-center
            gap-2
            w-full
            sm:w-auto
          "
        >
          <FaVideo />
          New Meeting
        </button>
      </div>

      <form
        onSubmit={handleJoinMeeting}
        className="
          mt-6
          flex
          flex-col
          md:flex-row
          gap-3
          min-w-0
        "
      >
        <input
          value={meetingId}
          onChange={(event) =>
            setMeetingId(event.target.value)
          }
          placeholder="Paste meeting ID or link"
          className="
            flex-1
            bg-slate-800
            border
            border-slate-700
            px-4
            py-3
            rounded-xl
            outline-none
            min-w-0
            focus:border-indigo-500
          "
        />

        <button
          type="submit"
          className="
            bg-green-600
            hover:bg-green-500
            transition
            px-5
            py-3
            rounded-xl
            font-semibold
            flex
            items-center
            justify-center
            gap-2
          "
        >
          <FaUsers />
          Join Meeting
          <FaArrowRight />
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <FaRobot className="text-indigo-300 mb-2" />
          <p className="font-semibold">AI transcript</p>
          <p className="text-sm text-gray-400 mt-1">
            Start AI inside a room to capture speech.
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <FaClock className="text-green-300 mb-2" />
          <p className="font-semibold">Attendance</p>
          <p className="text-sm text-gray-400 mt-1">
            Host controls the required meeting time.
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <FaVideo className="text-sky-300 mb-2" />
          <p className="font-semibold">Video room</p>
          <p className="text-sm text-gray-400 mt-1">
            Meet, chat and stop the room when done.
          </p>
        </div>

      </div>

      {showLogin && (
        <LoginModal
          setShowLogin={setShowLogin}
          setShowSignup={setShowSignup}
          message={authMessage}
        />
      )}

      {showSignup && (
        <SignupModal setShowSignup={setShowSignup} />
      )}

    </div>
  );
};

export default Home;
