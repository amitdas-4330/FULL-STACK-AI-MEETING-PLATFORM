import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useParams } from "react-router-dom";

import Peer from "simple-peer";

import {
  FaClock,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPaperPlane,
  FaRobot,
  FaStop,
  FaUsers,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";

import socket from "../socket";
import {
  saveMeetingSummaries,
  saveMeetingTranscripts,
} from "../utils/meetingHistory";

const ATTENDANCE_OPTIONS = [
  1,
  2,
  5,
  10,
  15,
  30,
  45,
  60,
];

const getStoredUser = () => {

  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }

};

const MeetingRoom = () => {

  const { roomId } = useParams();

  const [guestId] = useState(
    () => `guest-${Date.now()}`
  );

  const storedUser = useMemo(
    () => getStoredUser(),
    []
  );

  const currentUser = useMemo(
    () =>
      storedUser?.user || {
        name: "Guest",
        id: guestId,
        email: "",
      },
    [guestId, storedUser]
  );

  const [stream, setStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [peers, setPeers] = useState([]);
  const [transcripts, setTranscripts] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [meetingSettings, setMeetingSettings] = useState({
    isHost: false,
    attendanceThresholdMinutes: 10,
  });
  const [aiRecording, setAiRecording] = useState(false);
  const [aiStatus, setAiStatus] = useState("");
  const [summaryLoading, setSummaryLoading] =
    useState(false);

  const userVideo = useRef(null);
  const peersRef = useRef([]);
  const recorderRef = useRef(null);
  const recorderTimerRef = useRef(null);
  const recorderChunksRef = useRef([]);
  const recordingActiveRef = useRef(false);

  const refreshPeers = useCallback(() => {

    setPeers(
      peersRef.current.map((item) => ({
        peer: item.peer,
        name: item.name,
        peerId: item.peerId,
      }))
    );

  }, []);

  const createPeer = useCallback(
    (userToSignal, callerId, currentStream) => {

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: currentStream,
      });

      peer.on("signal", (signal) => {

        socket.emit("sending-signal", {
          userToSignal,
          callerId,
          signal,
          name: currentUser.name,
        });

      });

      return peer;

    },
    [currentUser.name]
  );

  const addPeer = useCallback(
    (incomingSignal, callerId, currentStream) => {

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: currentStream,
      });

      peer.on("signal", (signal) => {

        socket.emit("returning-signal", {
          signal,
          callerId,
        });

      });

      peer.signal(incomingSignal);

      return peer;

    },
    []
  );

  const stopAiRecording = useCallback(() => {

    recordingActiveRef.current = false;

    if (recorderTimerRef.current) {
      clearTimeout(recorderTimerRef.current);
      recorderTimerRef.current = null;
    }

    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    recorderRef.current = null;
    recorderChunksRef.current = [];
    setAiRecording(false);

  }, []);

  const startAiRecording = useCallback(() => {

    if (!stream) {
      setAiStatus("Camera and mic are not ready yet.");
      return;
    }

    const audioTracks = stream.getAudioTracks();

    if (!audioTracks.length) {
      setAiStatus("No microphone track found.");
      return;
    }

    const audioStream = new MediaStream(audioTracks);
    const mimeType = MediaRecorder.isTypeSupported(
      "audio/webm;codecs=opus"
    )
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const sendCompleteAudioBlob = async (blob) => {

      if (blob.size < 1000) {
        return;
      }

      const audioChunk = await blob.arrayBuffer();

      socket.emit("audio-chunk", {
        roomId,
        audioChunk,
        mimeType: blob.type || mimeType,
        speaker: currentUser.name,
        userId: currentUser.id,
      });

    };

    const startRecordingSegment = () => {

      if (!recordingActiveRef.current) {
        return;
      }

      recorderChunksRef.current = [];

      const recorder = new MediaRecorder(
        audioStream,
        {
          mimeType,
        }
      );

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {

        if (event.data.size) {
          recorderChunksRef.current.push(event.data);
        }

      };

      recorder.onstop = async () => {

        const chunks = recorderChunksRef.current;

        if (chunks.length) {
          const audioBlob = new Blob(
            chunks,
            {
              type: mimeType,
            }
          );

          await sendCompleteAudioBlob(audioBlob);
        }

        if (recordingActiveRef.current) {
          startRecordingSegment();
        }

      };

      recorder.start();

      recorderTimerRef.current = setTimeout(() => {

        if (recorder.state !== "inactive") {
          recorder.stop();
        }

      }, 8000);

    };

    recordingActiveRef.current = true;
    startRecordingSegment();
    setAiRecording(true);
    setAiStatus("AI transcription is listening.");

  }, [currentUser.id, currentUser.name, roomId, stream]);

  const toggleAiRecording = () => {

    if (aiRecording) {
      stopAiRecording();
      setAiStatus("AI transcription stopped.");
      return;
    }

    startAiRecording();

  };

  useEffect(() => {

    let mounted = true;
    let localStream = null;

    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((currentStream) => {

        if (!mounted) return;

        localStream = currentStream;
        setStream(currentStream);

        if (userVideo.current) {
          userVideo.current.srcObject = currentStream;
        }

        socket.emit("join-meeting", {
          roomId,
          user: currentUser,
        });

        socket.on("meeting-users", (users) => {

          const livePeerIds = users
            .filter((user) => user.socketId !== socket.id)
            .map((user) => user.socketId);

          peersRef.current =
            peersRef.current.filter((item) => {

              const stillLive =
                livePeerIds.includes(item.peerId);

              if (!stillLive) {
                item.peer.destroy();
              }

              return stillLive;

            });

          users.forEach((user) => {

            if (user.socketId === socket.id) return;

            const existingPeer =
              peersRef.current.find(
                (item) =>
                  item.peerId === user.socketId
              );

            if (existingPeer) {
              existingPeer.name = user.name;
              return;
            }

            const peer = createPeer(
              user.socketId,
              socket.id,
              currentStream
            );

            peersRef.current.push({
              peerId: user.socketId,
              peer,
              name: user.name,
            });

          });

          refreshPeers();

        });

        socket.on("user-joined", (payload) => {

          const existingPeer =
            peersRef.current.find(
              (item) =>
                item.peerId === payload.callerId
            );

          if (existingPeer) return;

          const peer = addPeer(
            payload.signal,
            payload.callerId,
            currentStream
          );

          peersRef.current.push({
            peerId: payload.callerId,
            peer,
            name: payload.name,
          });

          refreshPeers();

        });

        socket.on(
          "receiving-returned-signal",
          (payload) => {

            const item =
              peersRef.current.find(
                (peerItem) =>
                  peerItem.peerId === payload.id
              );

            if (item) {
              item.peer.signal(payload.signal);
            }

          }
        );

      })
      .catch(() => {
        setAiStatus("Camera or microphone permission failed.");
      });

    return () => {

      mounted = false;
      stopAiRecording();

      socket.off("meeting-users");
      socket.off("user-joined");
      socket.off("receiving-returned-signal");

      peersRef.current.forEach((item) => {
        item.peer.destroy();
      });

      peersRef.current = [];

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }

    };

  }, [
    addPeer,
    createPeer,
    currentUser,
    refreshPeers,
    roomId,
    stopAiRecording,
  ]);

  useEffect(() => {

    socket.on("chat-history", (history) => {
      setMessages(history);
    });

    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("transcript-history", (history) => {
      setTranscripts(history);
      saveMeetingTranscripts(roomId, history);
    });

    socket.on("receive-transcript", (data) => {
      setTranscripts((prev) => {
        const next = [...prev, data];
        saveMeetingTranscripts(roomId, next);
        return next;
      });
    });

    socket.on("summary-history", (history) => {
      setSummaries(history);
      saveMeetingSummaries(roomId, history);
    });

    socket.on("receive-summary", (data) => {
      setSummaryLoading(false);
      setSummaries((prev) => {
        const next = [...prev, data];
        saveMeetingSummaries(roomId, next);
        return next;
      });
    });

    socket.on("attendance-update", (data) => {
      setAttendance(data);
    });

    socket.on("meeting-settings", (data) => {
      setMeetingSettings(data);
    });

    socket.on("ai-error", (data) => {
      setSummaryLoading(false);
      setAiStatus(data.message);
    });

    socket.on("attendance-error", (data) => {
      setAiStatus(data.message);
    });

    return () => {
      socket.off("chat-history");
      socket.off("receive-message");
      socket.off("transcript-history");
      socket.off("receive-transcript");
      socket.off("summary-history");
      socket.off("receive-summary");
      socket.off("attendance-update");
      socket.off("meeting-settings");
      socket.off("ai-error");
      socket.off("attendance-error");
    };

  }, [roomId]);

  const sendMessage = () => {

    if (!message.trim()) return;

    socket.emit("send-message", {
      roomId,
      sender: currentUser.name,
      message,
    });

    setMessage("");

  };

  const toggleMic = () => {

    if (!stream) return;

    stream.getAudioTracks().forEach((track) => {
      track.enabled = !micOn;
    });

    setMicOn((prev) => !prev);

  };

  const toggleCamera = () => {

    if (!stream) return;

    stream.getVideoTracks().forEach((track) => {
      track.enabled = !cameraOn;
    });

    setCameraOn((prev) => !prev);

  };

  const updateAttendanceThreshold = (minutes) => {

    socket.emit("update-attendance-threshold", {
      roomId,
      minutes,
    });

  };

  const generateSummary = () => {

    setSummaryLoading(true);

    socket.emit("generate-meeting-summary", {
      roomId,
    });

  };

  const latestSummary =
    summaries[summaries.length - 1]?.summary;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <div className="p-5 border-b border-slate-800 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            AI Meeting Room
          </h1>

          <p className="text-gray-400 break-all">
            Room: {roomId}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-green-400">
            {peers.length + 1} Participants
          </div>

          <button
            onClick={toggleAiRecording}
            className={`px-4 py-3 rounded-xl flex items-center gap-2 ${
              aiRecording
                ? "bg-red-600"
                : "bg-indigo-600"
            }`}
          >
            {aiRecording ? <FaStop /> : <FaRobot />}
            {aiRecording ? "Stop AI" : "Start AI"}
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 p-5">

        <div className="xl:col-span-3">

          <div className="grid md:grid-cols-2 gap-5">

            <div className="bg-slate-900 rounded-3xl overflow-hidden relative border border-indigo-500">
              <video
                muted
                ref={userVideo}
                autoPlay
                playsInline
                className="w-full h-[300px] object-cover bg-black"
              />

              <div className="absolute bottom-3 left-3 bg-black/70 px-4 py-2 rounded-xl">
                You
              </div>
            </div>

            {peers.map((peerData) => (
              <PeerVideo
                key={peerData.peerId}
                peer={peerData.peer}
                name={peerData.name}
              />
            ))}

          </div>

          <div className="flex justify-center gap-5 mt-6">
            <button
              onClick={toggleMic}
              className={`p-5 rounded-full ${
                micOn ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {micOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
            </button>

            <button
              onClick={toggleCamera}
              className={`p-5 rounded-full ${
                cameraOn ? "bg-indigo-600" : "bg-red-600"
              }`}
            >
              {cameraOn ? <FaVideo /> : <FaVideoSlash />}
            </button>
          </div>

          {aiStatus && (
            <p className="text-center text-sm text-gray-400 mt-4">
              {aiStatus}
            </p>
          )}

        </div>

        <div className="xl:col-span-2 space-y-5">

          <section className="bg-slate-900 rounded-3xl border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaClock />
                Attendance
              </h2>

              <span className="text-sm text-indigo-300">
                {meetingSettings.attendanceThresholdMinutes} min
              </span>
            </div>

            {meetingSettings.isHost && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                {ATTENDANCE_OPTIONS.map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() =>
                      updateAttendanceThreshold(minutes)
                    }
                    className={`py-2 rounded-xl text-sm ${
                      meetingSettings.attendanceThresholdMinutes ===
                      minutes
                        ? "bg-indigo-600"
                        : "bg-slate-800"
                    }`}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3 max-h-[220px] overflow-y-auto">
              {attendance.map((user) => (
                <div
                  key={user.socketId || user.userId}
                  className="bg-slate-800 p-3 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs text-gray-400">
                      {user.elapsedMinutes || 0} minutes
                    </p>
                  </div>

                  <span
                    className={`text-sm ${
                      user.present
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {user.present ? "Present" : "Waiting"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 rounded-3xl border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Live Transcript
              </h2>

              <span className="text-sm text-gray-400">
                {transcripts.length}
              </span>
            </div>

            <div className="space-y-3 max-h-[260px] overflow-y-auto">
              {transcripts.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-800 p-3 rounded-2xl"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="font-bold text-green-400">
                      {item.speaker}
                    </h3>

                    <span className="text-xs text-gray-400">
                      {item.language || "unknown"}
                    </span>
                  </div>

                  <p className="text-sm text-gray-200">
                    {item.transcript}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 rounded-3xl border border-slate-800 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaRobot />
                Summary
              </h2>

              <button
                onClick={generateSummary}
                disabled={summaryLoading}
                className="bg-indigo-600 disabled:bg-slate-700 px-4 py-2 rounded-xl text-sm"
              >
                {summaryLoading ? "Working" : "Generate"}
              </button>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4 min-h-[120px] whitespace-pre-wrap text-sm text-gray-200">
              {latestSummary ||
                "Start AI transcription, then generate a meeting summary."}
            </div>
          </section>

          <section className="bg-slate-900 rounded-3xl border border-slate-800 flex flex-col h-[420px]">
            <div className="p-5 border-b border-slate-800 text-xl font-bold flex items-center gap-2">
              <FaUsers />
              Chat
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-slate-800 p-4 rounded-2xl"
                >
                  <div className="flex justify-between mb-2">
                    <h3 className="font-bold">
                      {msg.sender}
                    </h3>

                    <span className="text-xs text-gray-400">
                      {msg.time}
                    </span>
                  </div>

                  <p>{msg.message}</p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-800 flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendMessage();
                  }
                }}
                placeholder="Type message..."
                className="flex-1 bg-slate-800 px-4 py-3 rounded-2xl outline-none min-w-0"
              />

              <button
                onClick={sendMessage}
                className="bg-indigo-600 px-5 rounded-2xl"
              >
                <FaPaperPlane />
              </button>
            </div>
          </section>

        </div>

      </div>

    </div>
  );

};

const PeerVideo = ({
  peer,
  name,
}) => {

  const ref = useRef(null);

  useEffect(() => {

    const handleStream = (remoteStream) => {

      if (ref.current) {
        ref.current.srcObject = remoteStream;
      }

    };

    peer.on("stream", handleStream);

    return () => {
      peer.off("stream", handleStream);
    };

  }, [peer]);

  return (
    <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 relative">
      <video
        playsInline
        autoPlay
        ref={ref}
        className="w-full h-[300px] object-cover bg-black"
      />

      <div className="absolute bottom-3 left-3 bg-black/70 px-4 py-2 rounded-xl">
        {name}
      </div>
    </div>
  );

};

export default MeetingRoom;
