import { useContext, useEffect, useState } from "react";
import {
  FaClock,
  FaComments,
  FaMicrophoneAlt,
  FaSyncAlt,
} from "react-icons/fa";

import { AuthContext } from "../context/AuthContextValue";
import {
  clearLatestMeetingTranscripts,
  getLatestMeetingRoom,
} from "../utils/meetingHistory";

const Transcript = () => {

  const { user } = useContext(AuthContext);

  const [latestRoom, setLatestRoom] = useState(
    () => user ? getLatestMeetingRoom() : null
  );

  useEffect(() => {

    const refreshHistory = () => {
      setLatestRoom(user ? getLatestMeetingRoom() : null);
    };

    refreshHistory();

    window.addEventListener(
      "meeting-history-updated",
      refreshHistory
    );
    window.addEventListener(
      "storage",
      refreshHistory
    );

    return () => {
      window.removeEventListener(
        "meeting-history-updated",
        refreshHistory
      );
      window.removeEventListener(
        "storage",
        refreshHistory
      );
    };

  }, [user]);

  const transcripts = latestRoom?.transcripts || [];
  const hasTranscripts = transcripts.length > 0;
  const latestTranscript = transcripts[transcripts.length - 1];
  const speakerCount = new Set(
    transcripts.map((item) => item.speaker || "Unknown")
  ).size;

  const handleRefreshTranscript = () => {

    clearLatestMeetingTranscripts();
    setLatestRoom(user ? getLatestMeetingRoom() : null);

  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/20 sm:p-7 lg:p-8">
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-200">
            <FaMicrophoneAlt />
            Live capture
          </div>

          <h1 className="text-2xl font-bold sm:text-3xl">
            Meeting Transcript
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400 sm:text-base">
            {latestRoom
              ? `Review the latest saved transcript from room ${latestRoom.roomId}.`
              : "Start AI transcription in a meeting to see captured conversation here."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefreshTranscript}
          disabled={!hasTranscripts}
          className="flex items-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaSyncAlt />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-cyan-200">
            <FaComments />
            Lines
          </div>
          <p className="text-2xl font-bold">
            {transcripts.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-emerald-200">
            <FaMicrophoneAlt />
            Speakers
          </div>
          <p className="text-2xl font-bold">
            {hasTranscripts ? speakerCount : 0}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-indigo-200">
            <FaClock />
            Latest
          </div>
          <p className="truncate text-lg font-bold">
            {latestTranscript?.time || "--"}
          </p>
        </div>
      </div>

      {hasTranscripts ? (
        <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
          {transcripts.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-600 sm:p-5"
            >
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-200">
                    {(item.speaker || "U").charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="font-bold text-white">
                      {item.speaker || "Unknown"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Transcript entry
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                  <span className="rounded-full bg-slate-800 px-3 py-1">
                    {item.language || "unknown"}
                  </span>
                  <span className="rounded-full bg-slate-800 px-3 py-1">
                    {item.time || ""}
                  </span>
                </div>
              </div>

              <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 leading-7 text-gray-200">
                {item.transcript}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
            <FaMicrophoneAlt size={22} />
          </div>

          <h2 className="text-xl font-bold">
            No transcript saved yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
            Open a meeting room, start AI transcription, speak for a
            few seconds, then return here to review the captured lines.
          </p>
        </div>
      )}
    </div>
  );

};

export default Transcript;
