import {
  FaVideo,
  FaUsers,
  FaRobot,
  FaChartLine,
  FaMicrophoneAlt,
  FaFileAlt,
  FaArrowRight,
  FaCopy,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const Home = () => {

  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  // START MEETING

  const handleStartMeeting = () => {

    const roomId = uuidv4();

    navigate(`/meeting/${roomId}`);
  };

  // JOIN MEETING

  const handleJoinMeeting = (event) => {

    event?.preventDefault();

    const roomId = meetingId.trim();

    if (roomId) {

      navigate(`/meeting/${encodeURIComponent(roomId)}`);

    }

  };

  // COPY SAMPLE ID

  const copyMeetingId = async () => {

    const sampleId = "AI-MEETING-2026";

    await navigator.clipboard.writeText(sampleId);

    setCopyStatus("Copied");

    window.setTimeout(() => {
      setCopyStatus("");
    }, 1500);
  };

  return (

    <div
      className="
        bg-slate-900
        rounded-3xl
        p-4
        sm:p-6
        lg:p-10
        min-h-screen
        overflow-hidden
      "
    >

      {/* HERO SECTION */}

      <div
        className="
          flex
          flex-col
          xl:flex-row
          items-center
          justify-between
          gap-8
          lg:gap-12
        "
      >

        {/* LEFT CONTENT */}

        <div className="flex-1">

          {/* TOP BADGE */}

          <div
            className="
              inline-flex
              items-center
              gap-2
              bg-indigo-600/20
              border
              border-indigo-500/30
              px-3
              sm:px-4
              py-2
              rounded-full
              text-indigo-300
              text-xs
              sm:text-sm
              mb-5
            "
          >

            <FaRobot />

            AI Powered Meeting Workspace

          </div>

          {/* TITLE */}

          <h1
            className="
              text-3xl
              sm:text-5xl
              lg:text-6xl
              font-bold
              leading-tight
              mb-5
            "
          >
            Smart AI Meeting
            <span className="text-indigo-400">
              {" "}Platform
            </span>
          </h1>

          {/* DESCRIPTION */}

          <p
            className="
              text-gray-300
              text-sm
              sm:text-base
              lg:text-lg
              leading-7
              max-w-2xl
            "
          >
            Real-time transcription, smart AI summaries,
            speaker recognition, attendance tracking,
            live participant monitoring and collaborative
            meeting tools for modern classrooms,
            organizations and teams.
          </p>

          {/* BUTTONS */}

          <div
            className="
              flex
              flex-col
              sm:flex-row
              gap-4
              mt-8
            "
          >

            {/* START MEETING */}

            <button
              onClick={handleStartMeeting}
              className="
                bg-indigo-600
                hover:bg-indigo-500
                transition
                duration-300
                px-6
                py-3
                sm:px-8
                sm:py-4
                rounded-2xl
                text-base
                sm:text-lg
                font-semibold
                flex
                items-center
                justify-center
                gap-3
                shadow-lg
                shadow-indigo-500/20
              "
            >

              <FaVideo />

              Start Meeting

            </button>

            <form
              onSubmit={handleJoinMeeting}
              className="
                flex
                flex-col
                sm:flex-row
                gap-3
                min-w-0
              "
            >
              <input
                value={meetingId}
                onChange={(event) =>
                  setMeetingId(event.target.value)
                }
                placeholder="Enter meeting ID"
                className="
                  bg-slate-800
                  border
                  border-slate-700
                  px-5
                  py-3
                  sm:py-4
                  rounded-2xl
                  outline-none
                  min-w-0
                "
              />

              <button
                type="submit"
                className="
                  bg-green-600
                  hover:bg-green-500
                  transition
                  duration-300
                  px-6
                  py-3
                  sm:px-8
                  sm:py-4
                  rounded-2xl
                  text-base
                  sm:text-lg
                  font-semibold
                  flex
                  items-center
                  justify-center
                  gap-3
                  shadow-lg
                  shadow-green-500/20
                "
              >
                <FaUsers />
                Join
              </button>
            </form>

          </div>

          {/* SAMPLE ROOM */}

          <div
            className="
              mt-8
              bg-slate-800
              border
              border-slate-700
              rounded-2xl
              p-4
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-4
            "
          >

            <div>

              <p className="text-gray-400 text-sm mb-1">
                Sample Meeting ID
              </p>

              <h3 className="text-lg font-semibold text-indigo-400 break-all">
                AI-MEETING-2026
              </h3>

            </div>

            <button
              onClick={copyMeetingId}
              className="
                bg-indigo-600
                hover:bg-indigo-500
                transition
                duration-300
                px-5
                py-3
                rounded-xl
                flex
                items-center
                justify-center
                gap-2
              "
            >

              <FaCopy />

              {copyStatus || "Copy ID"}

            </button>

          </div>

        </div>

        {/* RIGHT CARD */}

        <div className="flex-1 w-full max-w-[520px]">

          <div
            className="
              bg-slate-800/80
              border
              border-slate-700
              rounded-3xl
              p-5
              sm:p-6
              backdrop-blur-lg
              shadow-2xl
            "
          >

            {/* LIVE HEADER */}

            <div className="flex items-center justify-between mb-5">

              <div className="flex items-center gap-2 sm:gap-3">

                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 animate-pulse"></div>

                <span className="text-red-400 font-medium text-sm sm:text-base">
                  Live Meeting
                </span>

              </div>

              <div className="text-gray-400 text-xs sm:text-sm">
                10 Participants
              </div>

            </div>

            {/* TRANSCRIPTS */}

            <div className="space-y-4">

              {/* USER 1 */}

              <div className="bg-slate-700 p-3 sm:p-4 rounded-2xl">

                <div className="flex items-center justify-between mb-2">

                  <h3 className="text-green-400 font-bold text-sm sm:text-base">
                    Amit
                  </h3>

                  <span className="text-gray-400 text-xs sm:text-sm">
                    10:30 AM
                  </span>

                </div>

                <p className="text-gray-200 text-sm sm:text-base">
                  Welcome everyone to today's AI meeting.
                </p>

              </div>

              {/* USER 2 */}

              <div className="bg-slate-700 p-3 sm:p-4 rounded-2xl">

                <div className="flex items-center justify-between mb-2">

                  <h3 className="text-blue-400 font-bold text-sm sm:text-base">
                    Rahul
                  </h3>

                  <span className="text-gray-400 text-xs sm:text-sm">
                    10:31 AM
                  </span>

                </div>

                <p className="text-gray-200 text-sm sm:text-base">
                  Backend integration completed successfully.
                </p>

              </div>

              {/* AI SUMMARY */}

              <div className="bg-indigo-600/20 border border-indigo-500/20 p-3 sm:p-4 rounded-2xl">

                <div className="flex items-center gap-2 mb-2">

                  <FaRobot className="text-indigo-400" />

                  <h3 className="text-indigo-300 font-bold text-sm sm:text-base">
                    AI Summary
                  </h3>

                </div>

                <p className="text-gray-300 text-sm sm:text-base">
                  Meeting focused on frontend architecture,
                  AI transcription, attendance system and
                  real-time participant tracking.
                </p>

              </div>

            </div>

            {/* QUICK ACTION */}

            <button
              onClick={handleStartMeeting}
              className="
                mt-6
                w-full
                bg-indigo-600
                hover:bg-indigo-500
                transition
                duration-300
                py-4
                rounded-2xl
                font-semibold
                flex
                items-center
                justify-center
                gap-3
              "
            >

              Launch Instant Meeting

              <FaArrowRight />

            </button>

          </div>

        </div>

      </div>

      {/* STATS SECTION */}

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-4
          gap-5
          sm:gap-6
          mt-12
        "
      >

        {[
          {
            icon: <FaVideo />,
            color: "text-indigo-400",
            border: "hover:border-indigo-500",
            value: "120+",
            label: "Meetings Hosted",
          },
          {
            icon: <FaFileAlt />,
            color: "text-green-400",
            border: "hover:border-green-500",
            value: "450+",
            label: "AI Summaries",
          },
          {
            icon: <FaMicrophoneAlt />,
            color: "text-pink-400",
            border: "hover:border-pink-500",
            value: "98%",
            label: "Transcription Accuracy",
          },
          {
            icon: <FaChartLine />,
            color: "text-yellow-400",
            border: "hover:border-yellow-500",
            value: "10K+",
            label: "Users Connected",
          },
        ].map((item, i) => (

          <div
            key={i}
            className={`
              bg-slate-800
              p-5
              sm:p-6
              rounded-3xl
              border
              border-slate-700
              ${item.border}
              transition
              duration-300
              hover:-translate-y-1
            `}
          >

            <div className="flex items-center justify-between">

              <div>

                <h2 className={`text-3xl sm:text-4xl font-bold ${item.color}`}>
                  {item.value}
                </h2>

                <p className="text-gray-300 mt-2 text-sm sm:text-base">
                  {item.label}
                </p>

              </div>

              <div className={`text-3xl sm:text-4xl ${item.color}`}>
                {item.icon}
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
};

export default Home;
