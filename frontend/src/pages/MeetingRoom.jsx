import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Peer from "simple-peer";
import { useContext } from "react";

import {
  FaClock,
  FaCopy,
  FaDesktop,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPaperPlane,
  FaRobot,
  FaShareAlt,
  FaSignOutAlt,
  FaStop,
  FaUsers,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";

import socket from "../socket";
import { AuthContext } from "../context/AuthContextValue";
import {
  saveMeetingAttendance,
  saveMeetingReport,
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

const PEER_CONFIG = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
    {
      urls: "stun:global.stun.twilio.com:3478",
    },
  ],
};

const TURN_PLACEHOLDER_PATTERN =
  /YOUR_|example|localhost/i;

const getTurnUrls = () =>
  (import.meta.env.VITE_TURN_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

const hasUsableTurnConfig = () => {

  const urls = getTurnUrls();
  const username = import.meta.env.VITE_TURN_USERNAME || "";
  const credential =
    import.meta.env.VITE_TURN_CREDENTIAL || "";

  return (
    urls.some((url) => /^turns?:/i.test(url)) &&
    Boolean(username) &&
    Boolean(credential) &&
    ![...urls, username, credential].some((value) =>
      TURN_PLACEHOLDER_PATTERN.test(value)
    )
  );

};

const getConfiguredIceServers = () => {

  const turnUrls = getTurnUrls();

  if (!hasUsableTurnConfig()) {
    return PEER_CONFIG;
  }

  return {
    iceServers: [
      {
        urls: "stun:stun.relay.metered.ca:80",
      },
      ...PEER_CONFIG.iceServers,
      ...turnUrls.map((url) => ({
        urls: url,
        username: import.meta.env.VITE_TURN_USERNAME || "",
        credential: import.meta.env.VITE_TURN_CREDENTIAL || "",
      })),
    ],
  };

};

const getStoredUser = () => {

  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }

};

const setMediaTrackEnabled = (track, enabled) => {

  if (track) {
    track.enabled = enabled;
  }

};

const playVideo = (video) => {

  video?.play?.().catch(() => {});

};

const MeetingRoom = () => {

  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

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
  const [screenSharing, setScreenSharing] = useState(false);
  const [aiStatus, setAiStatus] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [summaryLoading, setSummaryLoading] =
    useState(false);

  const userVideo = useRef(null);
  const peersRef = useRef([]);
  const knownUsersRef = useRef([]);
  const reconnectTimersRef = useRef({});
  const localStreamRef = useRef(null);
  const cameraVideoTrackRef = useRef(null);
  const screenVideoTrackRef = useRef(null);
  const screenStreamRef = useRef(null);
  const transcriptsRef = useRef([]);
  const summariesRef = useRef([]);
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

  const attachLocalPreview = useCallback((nextStream) => {

    if (userVideo.current) {
      userVideo.current.srcObject = nextStream;
      playVideo(userVideo.current);
    }

  }, []);

  const replaceOutgoingVideoTrack = useCallback(
    (oldTrack, newTrack, activeStream) => {

      if (!oldTrack || !newTrack || !activeStream) {
        return;
      }

      peersRef.current.forEach((item) => {

        try {
          item.peer.replaceTrack(
            oldTrack,
            newTrack,
            activeStream
          );
        } catch {
          setAiStatus(
            "Could not update video for one participant."
          );
        }

      });

    },
    []
  );

  const removePeer = useCallback(
    (peerId) => {

      peersRef.current =
        peersRef.current.filter((item) => {

          if (item.peerId === peerId) {
            item.peer.destroy();
            return false;
          }

          return true;

        });

      refreshPeers();

    },
    [refreshPeers]
  );

  const addPeerEvents = useCallback(
    (peer, peerId) => {

      peer.on("error", () => {
        setAiStatus(
          `Video connection failed for ${peerId}. Try Retry video.`
        );
      });

      peer.on("close", () => {
        setAiStatus(
          `Video connection closed for ${peerId}. Try Retry video.`
        );
      });

    },
    []
  );

  useEffect(() => {

    transcriptsRef.current = transcripts;

  }, [transcripts]);

  useEffect(() => {

    summariesRef.current = summaries;

  }, [summaries]);

  const createPeer = useCallback(
    (userToSignal, callerId, currentStream) => {

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: currentStream,
        config: getConfiguredIceServers(),
      });

      addPeerEvents(peer, userToSignal);

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
    [addPeerEvents, currentUser.name]
  );

  const addPeer = useCallback(
    (incomingSignal, callerId, currentStream) => {

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: currentStream,
        config: getConfiguredIceServers(),
      });

      addPeerEvents(peer, callerId);

      peer.on("signal", (signal) => {

        socket.emit("returning-signal", {
          signal,
          callerId,
        });

      });

      peer.signal(incomingSignal);

      return peer;

    },
    [addPeerEvents]
  );

  const createPeerForUser = useCallback(
    (targetUser, currentStream) => {

      if (!targetUser?.socketId || !currentStream) {
        return;
      }

      if (targetUser.socketId === socket.id) {
        return;
      }

      const existingPeer =
        peersRef.current.find(
          (item) =>
            item.peerId === targetUser.socketId
        );

      if (existingPeer) {
        existingPeer.name = targetUser.name;
        refreshPeers();
        return;
      }

      const peer = createPeer(
        targetUser.socketId,
        socket.id,
        currentStream
      );

      peersRef.current.push({
        peerId: targetUser.socketId,
        peer,
        name: targetUser.name,
      });

      refreshPeers();

    },
    [
      createPeer,
      refreshPeers,
    ]
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

  const stopScreenSharing = useCallback(() => {

    const activeStream = localStreamRef.current;
    const screenTrack = screenVideoTrackRef.current;
    const cameraTrack = cameraVideoTrackRef.current;

    if (!activeStream || !screenTrack || !cameraTrack) {
      screenStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
      screenStreamRef.current = null;
      screenVideoTrackRef.current = null;
      setScreenSharing(false);
      return;
    }

    replaceOutgoingVideoTrack(
      screenTrack,
      cameraTrack,
      activeStream
    );

    activeStream.removeTrack(screenTrack);

    if (!activeStream.getVideoTracks().includes(cameraTrack)) {
      activeStream.addTrack(cameraTrack);
    }

    setMediaTrackEnabled(cameraTrack, cameraOn);
    screenTrack.onended = null;
    screenTrack.stop();
    screenStreamRef.current?.getTracks().forEach((track) => {
      if (track !== screenTrack) {
        track.stop();
      }
    });

    screenStreamRef.current = null;
    screenVideoTrackRef.current = null;
    attachLocalPreview(activeStream);
    setStream(activeStream);
    setScreenSharing(false);
    setAiStatus("Screen sharing stopped.");

  }, [
    attachLocalPreview,
    cameraOn,
    replaceOutgoingVideoTrack,
  ]);

  const startScreenSharing = useCallback(async () => {

    if (!stream || !localStreamRef.current) {
      setAiStatus("Camera and mic are not ready yet.");
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setAiStatus(
        "Your browser does not support screen sharing."
      );
      return;
    }

    try {

      const displayStream =
        await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

      const screenTrack = displayStream.getVideoTracks()[0];
      const activeStream = localStreamRef.current;
      const currentVideoTrack =
        screenVideoTrackRef.current ||
        activeStream.getVideoTracks()[0];
      const cameraTrack =
        cameraVideoTrackRef.current ||
        currentVideoTrack;

      if (!screenTrack || !currentVideoTrack) {
        displayStream.getTracks().forEach((track) => {
          track.stop();
        });
        setAiStatus("No screen video track was selected.");
        return;
      }

      cameraVideoTrackRef.current = cameraTrack;
      replaceOutgoingVideoTrack(
        currentVideoTrack,
        screenTrack,
        activeStream
      );

      activeStream.removeTrack(currentVideoTrack);
      activeStream.addTrack(screenTrack);

      screenStreamRef.current = displayStream;
      screenVideoTrackRef.current = screenTrack;
      screenTrack.onended = () => {
        stopScreenSharing();
      };

      attachLocalPreview(activeStream);
      setStream(activeStream);
      setScreenSharing(true);
      setAiStatus("Screen sharing is active.");

    } catch {
      setAiStatus("Screen sharing was cancelled.");
    }

  }, [
    attachLocalPreview,
    replaceOutgoingVideoTrack,
    stopScreenSharing,
    stream,
  ]);

  const toggleScreenSharing = () => {

    if (screenSharing) {
      stopScreenSharing();
      return;
    }

    startScreenSharing();

  };

  const startAiRecording = useCallback(() => {

    if (recordingActiveRef.current) {
      return;
    }

    if (!stream) {
      setAiStatus("Camera and mic are not ready yet.");
      return;
    }

    if (!window.MediaRecorder) {
      setAiStatus("Your browser does not support audio recording.");
      return;
    }

    const audioTracks = stream.getAudioTracks();

    if (!audioTracks.length) {
      setAiStatus("No microphone track found.");
      return;
    }

    const audioStream = new MediaStream(audioTracks);
    const supportedMimeType = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
    ].find((type) => MediaRecorder.isTypeSupported(type));
    const mimeType = supportedMimeType || "audio/webm";
    const recorderOptions = supportedMimeType
      ? {
          mimeType: supportedMimeType,
        }
      : undefined;

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

      let recorder;

      try {
        recorder = new MediaRecorder(
          audioStream,
          recorderOptions
        );
      } catch {
        recordingActiveRef.current = false;
        setAiRecording(false);
        setAiStatus("Could not start audio recording.");
        return;
      }

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

  const stopLocalMeeting = useCallback(() => {

    stopAiRecording();

    peersRef.current.forEach((item) => {
      item.peer.destroy();
    });

    peersRef.current = [];
    refreshPeers();

    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    screenStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    cameraVideoTrackRef.current?.stop();
    localStreamRef.current = null;
    screenStreamRef.current = null;
    screenVideoTrackRef.current = null;
    cameraVideoTrackRef.current = null;

  }, [refreshPeers, stopAiRecording, stream]);

  const stopMeeting = () => {

    if (!meetingSettings.isHost) {
      setAiStatus("Only the host can stop the meeting.");
      return;
    }

    setAiStatus("Stopping meeting...");

    socket.emit("stop-meeting", {
      roomId,
    });

  };

  const leaveMeeting = () => {

    socket.emit("leave-meeting", {
      roomId,
    });

    stopLocalMeeting();

    navigate("/", {
      replace: true,
    });

  };

  const toggleAiRecording = () => {

    if (aiRecording) {
      stopAiRecording();
      setAiStatus("AI transcription stopped.");
      return;
    }

    startAiRecording();

  };

  useEffect(() => {

    if (!user) {
      navigate("/", {
        replace: true,
      });
      return;
    }

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
        localStreamRef.current = currentStream;
        cameraVideoTrackRef.current =
          currentStream.getVideoTracks()[0] || null;
        setStream(currentStream);

        attachLocalPreview(currentStream);

        socket.on("meeting-users", (users) => {

          knownUsersRef.current = users;

          users.forEach((user) => {

            createPeerForUser(user, currentStream);

          });

        });

        socket.on("user-left", (socketId) => {

          removePeer(socketId);

        });

        socket.on("user-joined", (payload) => {

          const existingPeer =
            peersRef.current.find(
              (item) =>
                item.peerId === payload.callerId
          );

          if (existingPeer) {
            removePeer(payload.callerId);
          }

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

        socket.emit("join-meeting", {
          roomId,
          user: currentUser,
        });

      })
      .catch(() => {
        setAiStatus("Camera or microphone permission failed.");
      });

    return () => {

      mounted = false;
      stopAiRecording();

      socket.off("meeting-users");
      socket.off("user-left");
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

      screenStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
      cameraVideoTrackRef.current?.stop();
      localStreamRef.current = null;
      screenStreamRef.current = null;
      screenVideoTrackRef.current = null;
      cameraVideoTrackRef.current = null;

    };

  }, [
    addPeer,
    attachLocalPreview,
    createPeerForUser,
    createPeer,
    currentUser,
    removePeer,
    refreshPeers,
    roomId,
    stopAiRecording,
    user,
    navigate,
  ]);

  useEffect(() => {

    socket.on("chat-history", (history) => {
      setMessages(history);
    });

    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("transcript-history", (history) => {
      transcriptsRef.current = history;
      setTranscripts(history);
      saveMeetingTranscripts(roomId, history);
    });

    socket.on("receive-transcript", (data) => {
      setTranscripts((prev) => {
        const next = [...prev, data];
        transcriptsRef.current = next;
        saveMeetingTranscripts(roomId, next);
        return next;
      });
    });

    socket.on("summary-history", (history) => {
      summariesRef.current = history;
      setSummaries(history);
      saveMeetingSummaries(roomId, history);
    });

    socket.on("receive-summary", (data) => {
      setSummaryLoading(false);
      setSummaries((prev) => {
        const next = [...prev, data];
        summariesRef.current = next;
        saveMeetingSummaries(roomId, next);
        return next;
      });
    });

    socket.on("attendance-update", (data) => {
      setAttendance(data);
      saveMeetingAttendance(roomId, data);

      const missingParticipants = data.filter(
        (participant) =>
          participant.socketId &&
          participant.socketId !== socket.id &&
          !peersRef.current.some(
            (peerItem) =>
              peerItem.peerId === participant.socketId
          )
      );

      Object.keys(reconnectTimersRef.current).forEach(
        (socketId) => {

          const stillMissing =
            missingParticipants.some(
              (participant) =>
                participant.socketId === socketId
            );

          if (!stillMissing) {
            clearTimeout(
              reconnectTimersRef.current[socketId]
            );
            delete reconnectTimersRef.current[socketId];
          }

        }
      );

      if (missingParticipants.length && localStreamRef.current) {
        socket.emit("sync-meeting-users", {
          roomId,
        });
      }

      missingParticipants.forEach((participant) => {

        if (reconnectTimersRef.current[participant.socketId]) {
          return;
        }

        reconnectTimersRef.current[participant.socketId] =
          setTimeout(() => {

            delete reconnectTimersRef.current[
              participant.socketId
            ];

            const userToConnect =
              knownUsersRef.current.find(
                (knownUser) =>
                  knownUser.socketId === participant.socketId
              ) || participant;

            createPeerForUser(
              userToConnect,
              localStreamRef.current
            );

          }, 1000);

      });
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

    socket.on("meeting-error", (data) => {
      setAiStatus(data.message);
    });

    socket.on("meeting-ended", (data) => {
      const report = data.report || {};
      const reportRoomId = report.roomId || roomId;
      const finalAttendance = report.attendance || [];
      const endedAt =
        data.endedAt || new Date().toISOString();
      const savedTranscripts = transcriptsRef.current;
      const savedSummaries = summariesRef.current;

      const finalSummaries = report.summary
        ? [
            ...savedSummaries.filter(
              (item) =>
                item.summary !== report.summary
            ),
            {
              id: Date.now(),
              summary: report.summary,
              createdAt:
                report.summaryCreatedAt || endedAt,
            },
          ]
        : savedSummaries;

      saveMeetingReport(reportRoomId, {
        transcripts: savedTranscripts,
        summaries: finalSummaries,
        attendance: finalAttendance,
        updatedAt: endedAt,
      });

      if (finalAttendance.length) {
        setAttendance(finalAttendance);
        saveMeetingAttendance(
          reportRoomId,
          finalAttendance
        );
      }

      if (report.summary) {
        summariesRef.current = finalSummaries;
        setSummaries(finalSummaries);
        saveMeetingSummaries(
          reportRoomId,
          finalSummaries
        );
      }

      setAiStatus("Meeting ended. Report saved.");
      stopLocalMeeting();
      navigate("/", {
        replace: true,
      });
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
      socket.off("meeting-error");
      socket.off("meeting-ended");

      Object.values(reconnectTimersRef.current).forEach(
        (timer) => {
          clearTimeout(timer);
        }
      );
      reconnectTimersRef.current = {};
    };

  }, [createPeerForUser, navigate, roomId, stopLocalMeeting]);

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
      setMediaTrackEnabled(track, !micOn);
    });

    setMicOn((prev) => !prev);

  };

  const toggleCamera = () => {

    if (!stream) return;

    const nextCameraState = !cameraOn;
    const cameraTrack =
      cameraVideoTrackRef.current ||
      stream.getVideoTracks()[0];

    setMediaTrackEnabled(cameraTrack, nextCameraState);

    setCameraOn(nextCameraState);

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

  const meetingLink =
    typeof window !== "undefined"
      ? window.location.href
      : "";

  const copyMeetingLink = async () => {

    try {
      await navigator.clipboard.writeText(meetingLink || roomId);
      setShareStatus("Meeting link copied.");
    } catch {
      setShareStatus("Copy failed. Select the room ID manually.");
    }

  };

  const shareMeetingLink = async () => {

    const shareData = {
      title: "AI Meeting Room",
      text: `Join my meeting: ${roomId}`,
      url: meetingLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareStatus("Meeting link shared.");
      } catch {
        setShareStatus("");
      }
      return;
    }

    copyMeetingLink();

  };

  const latestSummary =
    summaries[summaries.length - 1]?.summary;

  const participantCount = Math.max(
    attendance.length,
    peers.length + 1
  );

  const connectedPeerIds = new Set(
    peers.map((peerData) => peerData.peerId)
  );

  const pendingParticipants = attendance.filter(
    (participant) =>
      participant.socketId !== socket.id &&
      !connectedPeerIds.has(participant.socketId)
  );

  const turnConfigured = hasUsableTurnConfig();

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">
            Login required
          </h1>

          <p className="text-gray-400 text-sm">
            Please login before starting or joining a meeting.
          </p>
        </div>
      </div>
    );
  }

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

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={copyMeetingLink}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-sm text-gray-100 hover:bg-slate-700"
              title="Copy meeting link"
            >
              <FaCopy />
              Copy ID
            </button>

            <button
              onClick={shareMeetingLink}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-sm text-gray-100 hover:bg-slate-700"
              title="Share meeting link"
            >
              <FaShareAlt />
              Share
            </button>

            {shareStatus && (
              <span className="text-sm text-green-300">
                {shareStatus}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-green-400">
            {participantCount} Participants
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

          <button
            onClick={stopMeeting}
            disabled={!meetingSettings.isHost}
            title={
              meetingSettings.isHost
                ? "Stop meeting for everyone"
                : "Only the host can stop the meeting"
            }
            className="px-4 py-3 rounded-xl flex items-center gap-2 bg-red-700 disabled:bg-slate-700 disabled:text-gray-400"
          >
            <FaStop />
            Stop Meeting
          </button>

          <button
            onClick={leaveMeeting}
            title="Leave this meeting"
            className="px-4 py-3 rounded-xl flex items-center gap-2 bg-amber-600 hover:bg-amber-500"
          >
            <FaSignOutAlt />
            Leave
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
                {screenSharing ? "You are sharing" : "You"}
              </div>
            </div>

            {peers.map((peerData) => (
              <PeerVideo
                key={peerData.peerId}
                peer={peerData.peer}
                name={peerData.name}
              />
            ))}

            {pendingParticipants.map((participant) => (
              <PendingParticipant
                key={participant.socketId || participant.userId}
                name={participant.name}
                turnConfigured={turnConfigured}
                onReconnect={() => {
                  socket.emit("sync-meeting-users", {
                    roomId,
                  });
                  createPeerForUser(
                    participant,
                    localStreamRef.current
                  );
                }}
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
              title={
                cameraOn ? "Turn camera off" : "Turn camera on"
              }
            >
              {cameraOn ? <FaVideo /> : <FaVideoSlash />}
            </button>

            <button
              onClick={toggleScreenSharing}
              className={`p-5 rounded-full ${
                screenSharing
                  ? "bg-amber-500"
                  : "bg-sky-600"
              }`}
              title={
                screenSharing
                  ? "Stop presenting"
                  : "Share screen"
              }
            >
              <FaDesktop />
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

            <div className="grid grid-cols-4 gap-2 mb-4">
              {ATTENDANCE_OPTIONS.map((minutes) => (
                <button
                  key={minutes}
                  onClick={() =>
                    updateAttendanceThreshold(minutes)
                  }
                  disabled={!meetingSettings.isHost}
                  title={
                    meetingSettings.isHost
                      ? `Set attendance time to ${minutes} minutes`
                      : "Only the host can change attendance time"
                  }
                  className={`py-2 rounded-xl text-sm ${
                    meetingSettings.attendanceThresholdMinutes ===
                    minutes
                      ? "bg-indigo-600"
                      : "bg-slate-800"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {minutes}m
                </button>
              ))}
            </div>

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
                "Generate a short summary from the meeting transcript."}
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
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [peerStatus, setPeerStatus] = useState(
    "Connecting video..."
  );

  useEffect(() => {

    const handleStream = (remoteStream) => {

      setHasRemoteStream(true);

      if (ref.current) {
        ref.current.srcObject = remoteStream;
        ref.current.muted = false;
        ref.current.volume = 1;
        playVideo(ref.current);
      }

    };

    peer.on("stream", handleStream);

    const handleTrack = (track, remoteStream) => {

      if (remoteStream) {
        handleStream(remoteStream);
        return;
      }

      handleStream(new MediaStream([track]));

    };

    peer.on("track", handleTrack);

    const handleConnect = () => {
      setPeerStatus("Connected. Waiting for media...");
    };

    const handleError = () => {
      setPeerStatus("Connection failed.");
    };

    const handleClose = () => {
      setPeerStatus("Connection closed.");
    };

    peer.on("connect", handleConnect);
    peer.on("error", handleError);
    peer.on("close", handleClose);

    const peerConnection = peer._pc;
    const handleIceChange = () => {

      const iceState =
        peerConnection?.iceConnectionState ||
        peerConnection?.connectionState;

      if (
        iceState === "failed" ||
        iceState === "disconnected"
      ) {
        setPeerStatus("Network blocked media connection.");
      }

    };

    peerConnection?.addEventListener?.(
      "iceconnectionstatechange",
      handleIceChange
    );

    const existingStream =
      peer.streams?.[0] ||
      peer._remoteStreams?.[0];

    if (existingStream) {
      handleStream(existingStream);
    }

    return () => {
      peer.off("stream", handleStream);
      peer.off("track", handleTrack);
      peer.off("connect", handleConnect);
      peer.off("error", handleError);
      peer.off("close", handleClose);
      peerConnection?.removeEventListener?.(
        "iceconnectionstatechange",
        handleIceChange
      );
    };

  }, [peer]);

  return (
    <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 relative">
      <video
        playsInline
        autoPlay
        ref={ref}
        muted={false}
        className="w-full h-[300px] object-cover bg-black"
      />

      <div className="absolute bottom-3 left-3 bg-black/70 px-4 py-2 rounded-xl">
        {name}
      </div>

      {!hasRemoteStream && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-sm text-gray-300">
          {peerStatus}
        </div>
      )}
    </div>
  );

};

const PendingParticipant = ({
  name,
  turnConfigured,
  onReconnect,
}) => (
  <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 relative min-h-[300px] flex items-center justify-center">
    <div className="text-center px-5">
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-2xl font-bold text-indigo-200">
        {name?.charAt(0)?.toUpperCase() || "?"}
      </div>

      <p className="font-semibold">{name}</p>

      <p className="mt-1 text-sm text-gray-400">
        {turnConfigured
          ? "Connecting video and audio..."
          : "TURN relay is not configured."}
      </p>

      <button
        onClick={onReconnect}
        className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Retry video
      </button>
    </div>
  </div>
);

export default MeetingRoom;
