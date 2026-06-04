import { FaPlayCircle, FaRobot, FaVideo } from "react-icons/fa";

const featureVideos = [
  {
    src: "/video/video-1.mp4",
    title: "AI meeting features",
    text: "Showcase transcripts, summaries, attendance, and report-ready meeting insights.",
    icon: FaRobot,
  },
  {
    src: "/video/video-2.mp4",
    title: "Meeting room experience",
    text: "Preview how users start a room, connect with others, and manage a live meeting.",
    icon: FaVideo,
  },
];

const FeatureVideos = () => {
  return (
    <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 lg:p-6 border border-slate-800 overflow-hidden">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-sky-300 text-sm mb-3">
            <FaPlayCircle />
            Product demo
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
            See MeetAI in action
          </h1>

          <p className="text-gray-400 text-sm sm:text-base mt-2 leading-6 max-w-3xl">
            Watch quick previews of the meeting workflow and the AI
            features that help turn conversations into useful notes.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {featureVideos.map((video) => {
          const Icon = video.icon;

          return (
            <article
              key={video.src}
              className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden"
            >
              <div className="bg-slate-950">
                <video
                  className="aspect-video w-full bg-slate-950 object-cover"
                  controls
                  muted
                  preload="metadata"
                  playsInline
                >
                  <source src={video.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sky-300">
                    <Icon />
                  </span>

                  <div className="min-w-0">
                    <h2 className="font-bold text-base sm:text-lg">
                      {video.title}
                    </h2>

                    <p className="text-sm text-gray-400 leading-6 mt-1">
                      {video.text}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default FeatureVideos;
