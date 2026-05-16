import { useEffect, useMemo, useState } from "react";
import {
  FaBars,
  FaCheckCircle,
  FaClock,
  FaTimes,
} from "react-icons/fa";
import { MdHistory } from "react-icons/md";

import { readMeetingHistory } from "../utils/meetingHistory";

const getHistoryRooms = () => {

  const history = readMeetingHistory();

  return Object.values(history.rooms || {}).sort(
    (a, b) =>
      new Date(b.updatedAt || 0) -
      new Date(a.updatedAt || 0)
  );

};

const formatSummaryTitle = (summary) => {

  const firstLine =
    summary?.split("\n").find((line) => line.trim()) ||
    "Meeting summary";

  return firstLine.length > 56
    ? `${firstLine.slice(0, 56)}...`
    : firstLine;

};

const SidebarContent = ({
  latestRoom,
  attendance,
  presentCount,
  summaryHistory,
  onNavigate,
}) => (
  <>
    <section className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-bold flex items-center gap-2">
          <FaClock className="text-green-300" />
          Attendance
        </h2>

        <span className="text-xs text-gray-400">
          {presentCount}/{attendance.length}
        </span>
      </div>

      {latestRoom && (
        <p className="text-xs text-gray-500 break-all mb-3">
          {latestRoom.roomId}
        </p>
      )}

      {attendance.length > 0 ? (
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {attendance.map((user) => (
            <div
              key={user.socketId || user.userId || user.name}
              className="bg-slate-900 rounded-lg px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm truncate">
                  {user.name || "Guest"}
                </p>

                {user.present && (
                  <FaCheckCircle className="text-green-400 shrink-0" />
                )}
              </div>

              <p className="text-xs text-gray-400 mt-1">
                {user.elapsedMinutes || 0} min -{" "}
                {user.present ? "Present" : "Waiting"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 leading-5">
          Attendance appears here after someone joins a meeting.
        </p>
      )}
    </section>

    <section className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between px-1 mb-3">
        <h2 className="font-bold flex items-center gap-2">
          <MdHistory className="text-indigo-300" size={20} />
          Summary History
        </h2>

        <span className="text-xs text-gray-500">
          {summaryHistory.length}
        </span>
      </div>

      {summaryHistory.length > 0 ? (
        <div className="space-y-2 overflow-y-auto pr-1">
          {summaryHistory.map((item) => (
            <a
              key={`${item.roomId}-${item.id}`}
              href="#summary"
              onClick={onNavigate}
              className="block bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-3 transition"
            >
              <p className="text-sm font-medium leading-5">
                {formatSummaryTitle(item.summary)}
              </p>

              <p className="text-xs text-gray-500 mt-2 break-all">
                {item.roomId}
              </p>
            </a>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-gray-400 leading-5">
          Generated meeting summaries will appear here.
        </div>
      )}
    </section>
  </>
);

const Sidebar = () => {

  const [rooms, setRooms] = useState(() => getHistoryRooms());
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {

    const refreshHistory = () => {
      setRooms(getHistoryRooms());
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

  const latestRoom = rooms[0];
  const attendance = latestRoom?.attendance || [];

  const summaryHistory = useMemo(
    () =>
      rooms.flatMap((room) =>
        (room.summaries || [])
          .slice()
          .reverse()
          .map((summary) => ({
            ...summary,
            roomId: room.roomId,
          }))
      ),
    [rooms]
  );

  const presentCount = attendance.filter(
    (user) => user.present
  ).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed left-4 top-[86px] z-40 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-lg"
        aria-label="Open sidebar"
      >
        <FaBars />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/60"
          />

          <aside className="absolute left-0 top-0 h-full w-[min(86vw,320px)] bg-slate-900 border-r border-slate-700 p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="font-bold">
                Meeting Tools
              </h2>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg"
                aria-label="Close sidebar"
              >
                <FaTimes />
              </button>
            </div>

            <SidebarContent
              latestRoom={latestRoom}
              attendance={attendance}
              presentCount={presentCount}
              summaryHistory={summaryHistory}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <aside
        className="hidden lg:flex fixed left-0 top-[80px] w-[250px] h-[calc(100vh-80px)] bg-slate-900 border-r border-slate-700 p-4 flex-col gap-4"
      >
        <SidebarContent
          latestRoom={latestRoom}
          attendance={attendance}
          presentCount={presentCount}
          summaryHistory={summaryHistory}
        />
      </aside>
    </>
  );

};

export default Sidebar;
