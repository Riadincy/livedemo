import React from "react";
import AIVideo from "../assets/AI.mp4";

const HeroSection = () => {
  const handleScrollToDemo = () => {
    const demoSection = document.getElementById("DemoRequest");
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
<div className="relative w-full h-[90vh] overflow-hidden m-0 p-0">
{/* Fullscreen AI Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        >
        <source src={AIVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Bottom-left Text + Button */}
      <div className="absolute bottom-10 left-10 text-white">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-wide max-w-xl">
          Explore our{" "}
          <span className="bg-gradient-to-r from-[#05EEFA] to-[#003D40] text-transparent bg-clip-text">
            AI Powered Products
          </span>
        </h1>
        <p className="mt-4 text-lg text-neutral-200 max-w-lg">
          Each Demo showcases Advanced AI Detection & Monitoring Solutions
        </p>

        <button
          onClick={handleScrollToDemo}
          className="mt-6 px-6 py-3 rounded-lg bg-gradient-to-r from-[#05EEFA] to-[#003D40] text-white font-semibold shadow-md hover:opacity-90 transition duration-300"
        >
          Request a Demo
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
