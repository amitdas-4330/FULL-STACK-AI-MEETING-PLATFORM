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
  FaComments,
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

const AI_TRANSCRIPT_SEGMENT_MS = 3500;
const AI_TRANSCRIPT_MIN_BLOB_SIZE = 1000;
const AI_TRANSCRIPT_AUDIO_BITS_PER_SECOND = 96000;

const MICROPHONE_AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: {
    ideal: 1,
  },
};

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

const getTurnConfigLabel = () =>
  hasUsableTurnConfig()
    ? `TURN ready (${getTurnUrls().length})`
    : "TURN missing";

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

const getMeetingMediaStream = async () => {

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: MICROPHONE_AUDIO_CONSTRAINTS,
    });
  } catch (error) {
    if (error?.name === "NotAllowedError") {
      throw error;
    }

    return navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
  }

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
  const [chatOpen, setChatOpen] = useState(false);
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
  const [peerStatusById, setPeerStatusById] = useState({});
  const [summaryLoading, setSummaryLoading] =
    useState(false);

  const userVideo = useRef(null);
  const peersRef = useRef([]);
  const knownUsersRef = useRef([]);
  const pendingSignalsRef = useRef({});
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

  const setPeerStatusForId = useCallback((peerId, status) => {

    if (!peerId) {
      return;
    }

    setPeerStatusById((prev) => ({
      ...prev,
      [peerId]: status,
    }));

  }, []);

  const queuePeerSignal = useCallback(
    (peerId, signal) => {

      if (!peerId || !signal) {
        return;
      }

      pendingSignalsRef.current[peerId] = [
        ...(pendingSignalsRef.current[peerId] || []),
        signal,
      ];

      setPeerStatusForId(peerId, "Waiting for peer...");

    },
    [setPeerStatusForId]
  );

  const flushPeerSignals = useCallback(
    (peerId, peer) => {

      const signals =
        pendingSignalsRef.current[peerId] || [];

      if (!signals.length) {
        return;
      }

      delete pendingSignalsRef.current[peerId];

      signals.forEach((signal) => {

        try {
          peer.signal(signal);
        } catch (error) {
          setPeerStatusForId(
            peerId,
            error?.message || "Could not apply signal."
          );
        }

      });

    },
    [setPeerStatusForId]
  );

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
      setPeerStatusForId(peerId, "");

    },
    [refreshPeers, setPeerStatusForId]
  );

  const addPeerEvents = useCallback(
    (peer, peerId) => {

      peer.on("error", () => {
        setPeerStatusForId(peerId, "Peer error.");
        setAiStatus(
          `Video connection failed for ${peerId}. Try Retry video.`
        );
      });

      peer.on("close", () => {
        setPeerStatusForId(peerId, "Peer closed.");
        setAiStatus(
          `Video connection closed for ${peerId}. Try Retry video.`
        );
      });

    },
    [setPeerStatusForId]
  );

  useEffect(() => {

    transcriptsRef.current = transcripts;

  }, [transcripts]);

  useEffect(() => {

    summariesRef.current = summaries;

  }, [summaries]);

  const createPeer = useCallback(
    (userToSignal, callerId, currentStream) => {

      setPeerStatusForId(userToSignal, "Creating offer...");

      const peer = new Peer({
        initiator: true,
        trickle: true,
        stream: currentStream,
        config: getConfiguredIceServers(),
      });

      addPeerEvents(peer, userToSignal);

      peer.on("signal", (signal) => {

        setPeerStatusForId(userToSignal, "Offer sent.");

        socket.emit("sending-signal", {
          userToSignal,
          callerId,
          signal,
          name: currentUser.name,
        });

      });

      return peer;

    },
    [addPeerEvents, currentUser.name, setPeerStatusForId]
  );

  const addPeer = useCallback(
    (incomingSignal, callerId, currentStream) => {

      setPeerStatusForId(callerId, "Answering offer...");

      const peer = new Peer({
        initiator: false,
        trickle: true,
        stream: currentStream,
        config: getConfiguredIceServers(),
      });

      addPeerEvents(peer, callerId);

      peer.on("signal", (signal) => {

        setPeerStatusForId(callerId, "Answer sent.");

        socket.emit("returning-signal", {
          signal,
          callerId,
        });

      });

      peer.signal(incomingSignal);
      setPeerStatusForId(callerId, "Offer received.");

      return peer;

    },
    [addPeerEvents, setPeerStatusForId]
  );

  const createPeerForUser = useCallback(
    (targetUser, currentStream) => {

      if (!targetUser?.socketId || !currentStream) {
        setPeerStatusForId(
          targetUser?.socketId,
          "Camera/mic stream not ready."
        );
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
        setPeerStatusForId(
          targetUser.socketId,
          "Peer already created."
        );
        refreshPeers();
        return;
      }

      let peer;

      try {
        peer = createPeer(
          targetUser.socketId,
          socket.id,
          currentStream
        );
      } catch (error) {
        setPeerStatusForId(
          targetUser.socketId,
          error?.message || "Could not create peer."
        );
        return;
      }

      peersRef.current.push({
        peerId: targetUser.socketId,
        peer,
        name: targetUser.name,
      });

      flushPeerSignals(targetUser.socketId, peer);
      refreshPeers();

    },
    [
      createPeer,
      flushPeerSignals,
      refreshPeers,
      setPeerStatusForId,
    ]
  );

  const reconnectToParticipant = useCallback(
    (participant, options = {}) => {

      const targetSocketId = participant?.socketId;

      if (!targetSocketId) {
        return;
      }

      const targetParticipant =
        knownUsersRef.current.find(
          (knownUser) =>
            knownUser.socketId === targetSocketId
        ) ||
        attendance.find(
          (item) => item.socketId === targetSocketId
        ) ||
        participant;

      setPeerStatusForId(
        targetSocketId,
        "Retry requested..."
      );

      delete pendingSignalsRef.current[targetSocketId];
      removePeer(targetSocketId);

      if (!options.remoteRequest) {
        socket.emit("retry-video", {
          roomId,
          targetSocketId,
        });
      }

      socket.emit("sync-meeting-users", {
        roomId,
      });

      setTimeout(() => {
        createPeerForUser(
          targetParticipant,
          localStreamRef.current
        );
      }, options.delayMs ?? 250);

    },
    [
      attendance,
      createPeerForUser,
      removePeer,
      roomId,
      setPeerStatusForId,
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
    const recorderOptions = {
      audioBitsPerSecond:
        AI_TRANSCRIPT_AUDIO_BITS_PER_SECOND,
      ...(supportedMimeType
        ? {
            mimeType: supportedMimeType,
          }
        : {}),
    };

    const sendCompleteAudioBlob = async (blob) => {

      if (blob.size < AI_TRANSCRIPT_MIN_BLOB_SIZE) {
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

        if (recorderTimerRef.current) {
          clearTimeout(recorderTimerRef.current);
          recorderTimerRef.current = null;
        }

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

      }, AI_TRANSCRIPT_SEGMENT_MS);

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
      state: {
        showFeedback: true,
      },
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

    getMeetingMediaStream()
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

        socket.on("retry-video-requested", (payload) => {

          const requesterSocketId =
            payload?.requesterSocketId;

          if (!requesterSocketId) {
            return;
          }

          delete pendingSignalsRef.current[requesterSocketId];
          removePeer(requesterSocketId);
          setPeerStatusForId(
            requesterSocketId,
            "Waiting for retry offer..."
          );

        });

        socket.on("user-joined", (payload) => {

          const existingPeer =
            peersRef.current.find(
              (item) =>
                item.peerId === payload.callerId
          );

          if (existingPeer) {
            try {
              existingPeer.peer.signal(payload.signal);
              setPeerStatusForId(
                payload.callerId,
                "Remote signal received."
              );
            } catch (error) {
              setPeerStatusForId(
                payload.callerId,
                error?.message || "Could not apply signal."
              );
            }
            return;
          }

          if (payload.signal?.candidate) {
            queuePeerSignal(
              payload.callerId,
              payload.signal
            );
            return;
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

          flushPeerSignals(payload.callerId, peer);
          refreshPeers();

        });

        socket.on(
          "receiving-returned-signal",
          (payload) => {

            setPeerStatusForId(payload.id, "Answer received.");

            const item =
              peersRef.current.find(
                (peerItem) =>
                  peerItem.peerId === payload.id
              );

            if (item) {
              try {
                item.peer.signal(payload.signal);
                setPeerStatusForId(payload.id, "Connecting media...");
              } catch (error) {
                setPeerStatusForId(
                  payload.id,
                  error?.message || "Could not apply signal."
                );
              }
            } else {
              queuePeerSignal(payload.id, payload.signal);
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
      socket.off("retry-video-requested");
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
    flushPeerSignals,
    queuePeerSignal,
    removePeer,
    refreshPeers,
    roomId,
    setPeerStatusForId,
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

      missingParticipants.forEach((participant) => {

        setPeerStatusForId(
          participant.socketId,
          "Waiting for video offer..."
        );

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
        state: {
          showFeedback: true,
        },
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

  }, [
    createPeerForUser,
    navigate,
    roomId,
    setPeerStatusForId,
    stopLocalMeeting,
  ]);

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
    <div className="min-h-screen bg-[#05070d] text-white">

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080b12]/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-sky-300">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Live meeting
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 normal-case text-gray-300">
                {participantCount} participants
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-normal md:text-3xl">
                AI Meeting Room
              </h1>

              <span className="max-w-full truncate rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 sm:max-w-xs">
                Room: {roomId}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={copyMeetingLink}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-gray-100 transition hover:border-sky-400/60 hover:bg-white/10"
                  title="Copy meeting link"
                >
                  <FaCopy />
                  Copy ID
                </button>

                <button
                  onClick={shareMeetingLink}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-gray-100 transition hover:border-sky-400/60 hover:bg-white/10"
                  title="Share meeting link"
                >
                  <FaShareAlt />
                  Share
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setChatOpen((open) => !open)}
              aria-expanded={chatOpen}
              className={`inline-flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-black tracking-wide shadow-lg transition hover:-translate-y-0.5 ${
                chatOpen
                  ? "bg-sky-300 text-slate-950 shadow-sky-500/25 ring-2 ring-sky-200/70"
                  : "bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 text-slate-950 shadow-sky-500/25 hover:shadow-sky-400/35"
              }`}
              title={chatOpen ? "Hide chat" : "Open chat"}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-950/15">
                <FaComments />
              </span>
              CHAT
              <span className="rounded-md bg-slate-950/15 px-2 py-0.5 text-xs font-black text-slate-950">
                {messages.length}
              </span>
            </button>

            <button
              onClick={toggleAiRecording}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                aiRecording
                  ? "bg-red-500 text-white hover:bg-red-400"
                  : "bg-sky-500 text-slate-950 hover:bg-sky-400"
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
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500"
            >
              <FaStop />
              Stop
            </button>

            <button
              onClick={leaveMeeting}
              title="Leave this meeting"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              <FaSignOutAlt />
              Leave
            </button>
          </div>
        </div>

        {(shareStatus || aiStatus) && (
          <div className="mx-auto mt-3 max-w-[1600px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300">
            {shareStatus || aiStatus}
          </div>
        )}
      </header>

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_420px] md:p-6">

        <section className="min-w-0">
          <div className="grid gap-4 md:grid-cols-2">

            <div className="relative overflow-hidden rounded-lg border border-sky-400/50 bg-black shadow-2xl shadow-black/35">
              <video
                muted
                ref={userVideo}
                autoPlay
                playsInline
                className="aspect-video w-full min-h-[260px] object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {screenSharing ? "You are sharing" : "You"}
                  </p>
                  <p className="text-xs text-gray-300">
                    {micOn ? "Mic on" : "Mic muted"} -{" "}
                    {cameraOn ? "Camera on" : "Camera off"}
                  </p>
                </div>

                <span className="rounded-md bg-sky-400 px-2 py-1 text-xs font-bold text-slate-950">
                  Local
                </span>
              </div>
            </div>

            {peers.map((peerData) => (
              <PeerVideo
                key={peerData.peerId}
                peer={peerData.peer}
                name={peerData.name}
                onReconnect={() => {
                  const participant =
                    attendance.find(
                      (item) =>
                        item.socketId === peerData.peerId
                    ) ||
                    knownUsersRef.current.find(
                      (item) =>
                        item.socketId === peerData.peerId
                    ) || {
                      socketId: peerData.peerId,
                      name: peerData.name,
                    };

                  reconnectToParticipant(participant);
                }}
              />
            ))}

            {pendingParticipants.map((participant) => (
              <PendingParticipant
                key={participant.socketId || participant.userId}
                name={participant.name}
                status={
                  peerStatusById[participant.socketId] ||
                  "Connecting video and audio..."
                }
                turnConfigured={turnConfigured}
                onReconnect={() => {
                  reconnectToParticipant(participant);
                }}
              />
            ))}

          </div>

          <div className="sticky bottom-4 z-20 mx-auto mt-5 flex w-fit items-center justify-center gap-3 rounded-lg border border-white/10 bg-[#080b12]/90 p-3 shadow-2xl shadow-black/40 backdrop-blur">
            <button
              onClick={toggleMic}
              title={micOn ? "Mute microphone" : "Unmute microphone"}
              className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg transition ${
                micOn
                  ? "bg-green-500 text-slate-950 hover:bg-green-400"
                  : "bg-red-500 text-white hover:bg-red-400"
              }`}
            >
              {micOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
            </button>

            <button
              onClick={toggleCamera}
              className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg transition ${
                cameraOn
                  ? "bg-sky-500 text-slate-950 hover:bg-sky-400"
                  : "bg-red-500 text-white hover:bg-red-400"
              }`}
              title={
                cameraOn ? "Turn camera off" : "Turn camera on"
              }
            >
              {cameraOn ? <FaVideo /> : <FaVideoSlash />}
            </button>

            <button
              onClick={toggleScreenSharing}
              className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg transition ${
                screenSharing
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                  : "bg-white/10 text-white hover:bg-white/15"
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
        </section>

        <aside className="min-w-0 space-y-4">

          {chatOpen && (
            <section className="flex h-[420px] flex-col rounded-lg border border-white/10 bg-[#0b0f18]">
              <div className="flex items-center gap-2 border-b border-white/10 p-4 text-base font-bold">
                <FaComments />
                Chat
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="mb-2 flex justify-between gap-3">
                      <h3 className="truncate text-sm font-bold">
                        {msg.sender}
                      </h3>

                      <span className="text-xs text-gray-400">
                        {msg.time}
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-gray-200">
                      {msg.message}
                    </p>
                  </div>
                ))}

                {!messages.length && (
                  <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-gray-400">
                    Team messages will appear here.
                  </p>
                )}
              </div>

              <div className="flex gap-3 border-t border-white/10 p-4">
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
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                />

                <button
                  onClick={sendMessage}
                  className="rounded-lg bg-sky-500 px-4 text-slate-950 transition hover:bg-sky-400"
                  title="Send message"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </section>
          )}

          <section className="rounded-lg border border-white/10 bg-[#0b0f18] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <FaClock />
                Attendance
              </h2>

              <span className="rounded-md bg-sky-400/10 px-2 py-1 text-xs font-semibold text-sky-200">
                {meetingSettings.attendanceThresholdMinutes} min
              </span>
            </div>

            <div className="mb-4 grid grid-cols-4 gap-2">
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
                  className={`rounded-lg py-2 text-sm ${
                    meetingSettings.attendanceThresholdMinutes ===
                    minutes
                      ? "bg-sky-500 text-slate-950"
                      : "bg-white/5 text-gray-300 hover:bg-white/10"
                  } transition disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {minutes}m
                </button>
              ))}
            </div>

            <div className="max-h-[210px] space-y-2 overflow-y-auto pr-1">
              {attendance.map((user) => (
                <div
                  key={user.socketId || user.userId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {user.elapsedMinutes || 0} minutes
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${
                      user.present
                        ? "bg-green-400/10 text-green-300"
                        : "bg-amber-400/10 text-amber-300"
                    }`}
                  >
                    {user.present ? "Present" : "Waiting"}
                  </span>
                </div>
              ))}

              {!attendance.length && (
                <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-gray-400">
                  Attendance appears when participants join.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#0b0f18] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">
                Live Transcript
              </h2>

              <span className="rounded-md bg-white/5 px-2 py-1 text-xs font-semibold text-gray-300">
                {transcripts.length}
              </span>
            </div>

            <div className="max-h-[230px] space-y-2 overflow-y-auto pr-1">
              {transcripts.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="truncate text-sm font-bold text-green-300">
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

              {!transcripts.length && (
                <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-gray-400">
                  Start AI to capture live transcript notes.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#0b0f18] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <FaRobot />
                Summary
              </h2>

              <button
                onClick={generateSummary}
                disabled={summaryLoading}
                className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:bg-white/10 disabled:text-gray-500"
              >
                {summaryLoading ? "Working" : "Generate"}
              </button>
            </div>

            <div className="min-h-[110px] whitespace-pre-wrap rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-gray-200">
              {latestSummary ||
                "Generate a short summary from the meeting transcript."}
            </div>
          </section>

        </aside>

      </main>

    </div>
  );

};

const PeerVideo = ({
  peer,
  name,
  onReconnect,
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
      setHasRemoteStream(false);
      setPeerStatus("Connection failed. Check console.");
    };

    const handleClose = () => {
      setHasRemoteStream(false);

      const iceState =
        peerConnection?.iceConnectionState || "unknown";
      const connectionState =
        peerConnection?.connectionState || "unknown";

      setPeerStatus(
        `Connection closed. ICE: ${iceState}. Peer: ${connectionState}. ${getTurnConfigLabel()}.`
      );
    };

    peer.on("connect", handleConnect);
    peer.on("error", handleError);
    peer.on("close", handleClose);

    const peerConnection = peer._pc;
    const handleIceChange = () => {

      const iceState =
        peerConnection?.iceConnectionState || "unknown";
      const connectionState =
        peerConnection?.connectionState || "unknown";

      if (
        iceState === "failed" ||
        iceState === "disconnected"
      ) {
        setPeerStatus(
          `Network blocked media. ICE: ${iceState}. Peer: ${connectionState}. ${getTurnConfigLabel()}.`
        );
        return;
      }

      setPeerStatus(
        `Connecting video... ICE: ${iceState}. Peer: ${connectionState}. ${getTurnConfigLabel()}.`
      );

    };

    peerConnection?.addEventListener?.(
      "iceconnectionstatechange",
      handleIceChange
    );
    peerConnection?.addEventListener?.(
      "connectionstatechange",
      handleIceChange
    );
    handleIceChange();

    const existingStream = peer._remoteStreams?.[0];

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
      peerConnection?.removeEventListener?.(
        "connectionstatechange",
        handleIceChange
      );
    };

  }, [peer]);

  const showStatus =
    !hasRemoteStream ||
    /closed|failed|blocked/i.test(peerStatus);

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black shadow-2xl shadow-black/30">
      <video
        playsInline
        autoPlay
        ref={ref}
        muted={false}
        className="aspect-video w-full min-h-[260px] object-cover"
      />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <p className="truncate font-semibold">
          {name}
        </p>
      </div>

      {showStatus && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#05070d]/88 px-5 text-center text-sm text-gray-300 backdrop-blur">
          <p className="max-w-sm leading-6">
            {peerStatus}
          </p>

          {/closed|failed|blocked/i.test(peerStatus) && (
            <button
              onClick={onReconnect}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Retry video
            </button>
          )}
        </div>
      )}
    </div>
  );

};

const PendingParticipant = ({
  name,
  status,
  turnConfigured,
  onReconnect,
}) => (
  <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#0b0f18]">
    <div className="text-center px-5">
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-2xl font-bold text-sky-200">
        {name?.charAt(0)?.toUpperCase() || "?"}
      </div>

      <p className="font-semibold">{name}</p>

      <p className="mt-1 text-sm text-gray-400">
        {turnConfigured
          ? status
          : "TURN relay is not configured."}
      </p>

      <button
        onClick={onReconnect}
        className="mt-4 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
      >
        Retry video
      </button>
    </div>
  </div>
);

export default MeetingRoom;
