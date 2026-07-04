import {
  useContext,
  useEffect,
  useState,
} from "react";
import {
  FaDownload,
  FaFileAlt,
  FaHistory,
  FaLightbulb,
  FaSyncAlt,
} from "react-icons/fa";

import { AuthContext } from "../context/AuthContextValue";
import {
  clearLatestMeetingSummaries,
  getLatestMeetingRoom,
} from "../utils/meetingHistory";
import { downloadMeetingReport } from "../utils/meetingReportPdf";

const Summary = () => {

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

  const summaries = latestRoom?.summaries || [];
  const latestSummary =
    summaries[summaries.length - 1];
  const hasSummary = Boolean(latestSummary);
  const transcriptCount =
    latestRoom?.transcripts?.length || 0;

  const handleRefreshSummary = () => {

    clearLatestMeetingSummaries();
    setLatestRoom(user ? getLatestMeetingRoom() : null);

  };

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
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/20 sm:p-7 lg:p-8">
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-sm font-semibold text-indigo-200">
            <FaLightbulb />
            AI notes
          </div>

          <h1 className="text-2xl font-bold sm:text-3xl">
            Meeting Summary
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400 sm:text-base">
            {latestRoom
              ? `Review the latest AI summary from room ${latestRoom.roomId}.`
              : "Generate a summary inside a meeting to see concise notes here."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasSummary && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-indigo-500"
            >
              <FaDownload />
              PDF
            </button>
          )}

          <button
            type="button"
            onClick={handleRefreshSummary}
            disabled={!hasSummary}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaSyncAlt />
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-indigo-200">
            <FaFileAlt />
            Summaries
          </div>
          <p className="text-2xl font-bold">
            {summaries.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-cyan-200">
            <FaHistory />
            Transcript lines
          </div>
          <p className="text-2xl font-bold">
            {transcriptCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-emerald-200">
            <FaLightbulb />
            Updated
          </div>
          <p className="truncate text-lg font-bold">
            {latestSummary?.createdAt
              ? new Date(
                  latestSummary.createdAt
                ).toLocaleDateString()
              : "--"}
          </p>
        </div>
      </div>

      {hasSummary ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-indigo-200">
                  Latest Summary
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  {latestSummary.createdAt
                    ? new Date(
                        latestSummary.createdAt
                      ).toLocaleString()
                    : "Recently generated"}
                </p>
              </div>
            </div>

            <div className="whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-sm leading-7 text-gray-200">
              {latestSummary.summary}
            </div>
          </div>

          {summaries.length > 1 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold">
                  <FaHistory className="text-indigo-300" />
                  Summary History
                </h3>

                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-gray-400">
                  {summaries.length - 1} older
                </span>
              </div>

              <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                {summaries
                  .slice(0, -1)
                  .reverse()
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-gray-300 transition hover:border-slate-600"
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
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-400/10 text-indigo-200">
            <FaLightbulb size={22} />
          </div>

          <h2 className="text-xl font-bold">
            No summary saved yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
            Open a meeting room, collect transcript lines, click
            Generate in the Summary panel, then return here.
          </p>
        </div>
      )}
    </div>
  );

};

export default Summary;
