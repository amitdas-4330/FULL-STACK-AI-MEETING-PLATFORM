const Transcript = () => {
  return (
    <div className="bg-slate-900 rounded-3xl p-8 min-h-[500px]">

      <h1 className="text-4xl font-bold mb-8">
        Live Transcript
      </h1>

      <div className="space-y-5">

        <div className="bg-slate-800 p-5 rounded-2xl">

          <div className="flex items-center justify-between mb-3">

            <h3 className="text-green-400 font-bold">
              Amit
            </h3>

            <span className="text-gray-400">
              10:32 AM
            </span>

          </div>

          <p>
            Welcome everyone to the meeting.
          </p>

        </div>

      </div>

    </div>
  );
};

export default Transcript;