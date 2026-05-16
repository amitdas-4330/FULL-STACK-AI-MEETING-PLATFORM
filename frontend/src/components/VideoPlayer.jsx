const VideoPlayer = ({
  stream,
  name,
  muted = false,
}) => {

  return (

    <div
      className="
        bg-slate-900
        rounded-3xl
        overflow-hidden
        border
        border-slate-800
        relative
      "
    >

      <video
        ref={(video) => {

          if (video) {
            video.srcObject = stream;
          }

        }}
        autoPlay
        playsInline
        muted={muted}
        className="
          w-full
          h-[250px]
          object-cover
          bg-black
        "
      />

      {/* USER NAME */}

      <div
        className="
          absolute
          bottom-3
          left-3
          bg-black/60
          px-4
          py-2
          rounded-xl
          text-sm
          font-semibold
        "
      >
        {name}
      </div>

    </div>

  );

};

export default VideoPlayer;