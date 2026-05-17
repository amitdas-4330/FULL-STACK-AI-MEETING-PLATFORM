const HISTORY_KEY = "meetai-meeting-history";

const emptyHistory = {
  rooms: {},
  latestRoomId: "",
};

export const readMeetingHistory = () => {

  try {

    const storedHistory =
      localStorage.getItem(HISTORY_KEY);

    return storedHistory
      ? JSON.parse(storedHistory)
      : emptyHistory;

  } catch {

    localStorage.removeItem(HISTORY_KEY);
    return emptyHistory;

  }

};

const writeMeetingHistory = (history) => {

  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(history)
  );

  window.dispatchEvent(
    new CustomEvent("meeting-history-updated")
  );

};

export const clearMeetingHistory = () => {

  localStorage.removeItem(HISTORY_KEY);

  window.dispatchEvent(
    new CustomEvent("meeting-history-updated")
  );

};

export const getLatestMeetingRoom = () => {

  const history = readMeetingHistory();

  return history.rooms[history.latestRoomId] || null;

};

export const saveMeetingTranscripts = (
  roomId,
  transcripts
) => {

  const history = readMeetingHistory();
  const existingRoom = history.rooms[roomId] || {};

  history.rooms[roomId] = {
    ...existingRoom,
    roomId,
    transcripts,
    summaries: existingRoom.summaries || [],
    updatedAt: new Date().toISOString(),
  };
  history.latestRoomId = roomId;

  writeMeetingHistory(history);

};

export const saveMeetingSummaries = (
  roomId,
  summaries
) => {

  const history = readMeetingHistory();
  const existingRoom = history.rooms[roomId] || {};

  history.rooms[roomId] = {
    ...existingRoom,
    roomId,
    transcripts: existingRoom.transcripts || [],
    summaries,
    updatedAt: new Date().toISOString(),
  };
  history.latestRoomId = roomId;

  writeMeetingHistory(history);

};

export const saveMeetingAttendance = (
  roomId,
  attendance
) => {

  const history = readMeetingHistory();
  const existingRoom = history.rooms[roomId] || {};

  history.rooms[roomId] = {
    ...existingRoom,
    roomId,
    transcripts: existingRoom.transcripts || [],
    summaries: existingRoom.summaries || [],
    attendance,
    updatedAt: new Date().toISOString(),
  };
  history.latestRoomId = roomId;

  writeMeetingHistory(history);

};

export const saveMeetingReport = (
  roomId,
  {
    transcripts = [],
    summaries = [],
    attendance = [],
    updatedAt = new Date().toISOString(),
  }
) => {

  const history = readMeetingHistory();
  const existingRoom = history.rooms[roomId] || {};

  history.rooms[roomId] = {
    ...existingRoom,
    roomId,
    transcripts:
      transcripts.length > 0
        ? transcripts
        : existingRoom.transcripts || [],
    summaries:
      summaries.length > 0
        ? summaries
        : existingRoom.summaries || [],
    attendance:
      attendance.length > 0
        ? attendance
        : existingRoom.attendance || [],
    updatedAt,
  };
  history.latestRoomId = roomId;

  writeMeetingHistory(history);

};
