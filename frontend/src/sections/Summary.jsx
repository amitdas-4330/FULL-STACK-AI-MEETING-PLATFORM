import { useEffect, useState } from "react";

import { getLatestMeetingRoom } from "../utils/meetingHistory";

const Summary = () => {

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

  const summaries = latestRoom?.summaries || [];
  const latestSummary =
    summaries[summaries.length - 1];

  return (
    <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 min-h-[500px]">
      <div className="flex flex-col gap-3 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">
          AI Summary
        </h1>

        <p className="text-gray-300 max-w-3xl leading-7">
          {latestRoom
            ? `Latest saved room: ${latestRoom.roomId}`
            : "Generate a summary inside a meeting to see it here."}
        </p>
      </div>

      {latestSummary ? (
        <div className="space-y-5">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h3 className="text-indigo-300 font-bold">
                Latest Summary
              </h3>

              <span className="text-xs text-gray-400">
                {latestSummary.createdAt
                  ? new Date(
                      latestSummary.createdAt
                    ).toLocaleString()
                  : ""}
              </span>
            </div>

            <div className="whitespace-pre-wrap text-gray-200 leading-7">
              {latestSummary.summary}
            </div>
          </div>

          {summaries.length > 1 && (
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
              <h3 className="font-bold mb-3">
                Summary History
              </h3>

              <div className="space-y-3 max-h-[260px] overflow-y-auto">
                {summaries
                  .slice(0, -1)
                  .reverse()
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-900 p-4 rounded-xl text-sm text-gray-300"
                    >
                      <div className="text-xs text-gray-500 mb-2">
                        {item.createdAt
                          ? new Date(
                              item.createdAt
                            ).toLocaleString()
                          : ""}
                      </div>

                      <p className="line-clamp-3">
                        {item.summary}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-gray-300">
          No summary saved yet. Open a meeting room, collect
          transcript lines, click Generate in the Summary panel,
          then return here.
        </div>
      )}
    </div>
  );

};

export default Summary;
