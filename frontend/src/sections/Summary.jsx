import { useEffect, useState } from "react";
import { FaDownload } from "react-icons/fa";

import { getLatestMeetingRoom } from "../utils/meetingHistory";
import { downloadMeetingReport } from "../utils/meetingReportPdf";

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

  const handleDownloadPdf = () => {

    if (!latestRoom || !latestSummary) {
      return;
    }

    downloadMeetingReport({
      roomId: latestRoom.roomId,
      summary: latestSummary.summary,
      summaryCreatedAt: latestSummary.createdAt,
      attendance: latestRoom.attendance || [],
      endedAt:
        latestRoom.updatedAt ||
        latestSummary.createdAt ||
        new Date().toISOString(),
    });

  };

  return (
    <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-800">
      <div className="flex flex-col gap-2 mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold">
          AI Summary
        </h1>

        <p className="text-gray-400 text-sm max-w-3xl leading-6">
          {latestRoom
            ? `Latest saved room: ${latestRoom.roomId}`
            : "Generate a summary inside a meeting to see it here."}
        </p>
      </div>

      {latestSummary ? (
        <div className="space-y-4">
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h3 className="text-indigo-300 font-bold">
                Short Summary
              </h3>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {latestSummary.createdAt
                    ? new Date(
                        latestSummary.createdAt
                      ).toLocaleString()
                    : ""}
                </span>

                <button
                  onClick={handleDownloadPdf}
                  className="bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  <FaDownload />
                  PDF
                </button>
              </div>
            </div>

            <div className="whitespace-pre-wrap text-gray-200 text-sm leading-6">
              {latestSummary.summary}
            </div>
          </div>

          {summaries.length > 1 && (
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
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
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 text-gray-300">
          No summary saved yet. Open a meeting room, collect
          transcript lines, click Generate in the Summary panel,
          then return here.
        </div>
      )}
    </div>
  );

};

export default Summary;
