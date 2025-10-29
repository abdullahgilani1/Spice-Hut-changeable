import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Use public media path for large video to avoid bundling it
const videoSrc = '/media/intro.mp4';

export default function Intro() {
  const navigate = useNavigate();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 2000); // show after 2 s
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-black min-h-screen flex items-center justify-center relative overflow-hidden">
      <video
        src={videoSrc}
        alt="Intro Video"
        autoPlay
        muted
        loop
        playsInline
        className={`w-full h-auto max-h-screen object-contain sm:object-cover transition-opacity duration-1000 ${
          showButton ? "opacity-50" : "opacity-100"
        }`}
      />

      {/* Centered Button */}
      <button
        onClick={() => navigate("/user/menu")}
        className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 
          bg-[#FF6A00] text-white font-bold text-sm sm:text-base md:text-lg 
          px-6 py-3 sm:px-8 sm:py-3.5 md:px-10 md:py-4 rounded-full shadow-lg 
          transition-opacity duration-1000 ${
            showButton ? "opacity-100" : "opacity-0 pointer-events-none"
          } hover:bg-[#FFB366] hover:text-black`}
      >
        Start Ordering
      </button>
    </div>
  );
}