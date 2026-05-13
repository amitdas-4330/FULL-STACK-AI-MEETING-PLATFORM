import { useEffect, useState } from "react";

import socket from "../socket";

const MeetingRoom = () => {

  const [users, setUsers] = useState([]);

  const roomId = "AI-MEETING-001";

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  useEffect(() => {

    if (!user) return;

    socket.emit("join-meeting", {
      roomId,
      user: user.user,
    });

    socket.on("meeting-users", (data) => {
      setUsers(data);
    });

    return () => {
      socket.off("meeting-users");
    };

  }, []);

  return (

    <div className="min-h-screen bg-slate-950 text-white p-8">

      {/* HEADER */}

      <div className="flex items-center justify-between mb-10">

        <div>

          <h1 className="text-4xl font-bold">
            Live Meeting Room
          </h1>

          <p className="text-gray-400 mt-2">
            Room ID: {roomId}
          </p>

        </div>

        <div className="bg-green-600 px-5 py-3 rounded-2xl">
          {users.length} Participants
        </div>

      </div>

      {/* PARTICIPANTS */}

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4
          gap-6
        "
      >

        {
          users.map((participant) => (

            <div
              key={participant.socketId}
              className="
                bg-slate-900
                border
                border-slate-700
                rounded-3xl
                p-6
              "
            >

              <div
                className="
                  w-20
                  h-20
                  rounded-full
                  bg-indigo-600
                  flex
                  items-center
                  justify-center
                  text-3xl
                  font-bold
                  mb-5
                "
              >
                {
                  participant.name
                    ?.charAt(0)
                    ?.toUpperCase()
                }
              </div>

              <h2 className="text-2xl font-bold">
                {participant.name}
              </h2>

              <p className="text-green-400 mt-2">
                Connected
              </p>

            </div>

          ))
        }

      </div>

    </div>

  );
};

export default MeetingRoom;