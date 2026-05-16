import { useEffect, useState } from "react";

import { getLatestMeetingRoom } from "../utils/meetingHistory";

const Transcript = () => {

  const [latestRoom, setLatestRoom] = useState(
    () => getLatestMeetingRoom()
  );

  useEffect(() => {

    const refreshHistory = () => {
      setLatestRoom(getLatestMeetingRoom());
    };

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

  }, []);

  const transcripts = latestRoom?.transcripts || [];

  return (
    <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 min-h-[500px]">
      <div className="flex flex-col gap-3 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">
          Live Transcript
        </h1>

        <p className="text-gray-300 max-w-3xl leading-7">
          {latestRoom
            ? `Latest saved room: ${latestRoom.roomId}`
            : "Start AI transcription in a meeting to see transcript lines here."}
        </p>
      </div>

      {transcripts.length > 0 ? (
        <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
          {transcripts.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800 p-5 rounded-2xl border border-slate-700"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                <h3 className="text-green-400 font-bold">
                  {item.speaker || "Unknown"}
                </h3>

                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{item.language || "unknown"}</span>
                  <span>{item.time || ""}</span>
                </div>
              </div>

              <p className="text-gray-200 leading-7">
                {item.transcript}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-gray-300">
          No transcript saved yet. Open a meeting room, click
          Start AI, speak for a few seconds, then return here.
        </div>
      )}
    </div>
  );

};

export default Transcript;
