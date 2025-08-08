import { useEffect, useRef, useState } from "react";
import { overviewFeatures } from "../constants";
import centerImage from "../assets/brain.png";

const OverviewSection = () => {
  const [selected, setSelected] = useState(0);
  const [angle, setAngle] = useState(0);
  const spinnerRef = useRef(null);
  const [manualSelection, setManualSelection] = useState(false);
  const [fade, setFade] = useState(true);

  const radius = 150;
  const count = overviewFeatures.length;
  const angleStep = (2 * Math.PI) / count;

  // Smooth rotation
  useEffect(() => {
    let lastTimestamp = null;
    let animationFrame;

    const rotate = (timestamp) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      const speed = 0.0003; // ✅ Slower rotation speed here
      setAngle((prev) => prev + delta * speed);

      animationFrame = requestAnimationFrame(rotate);
    };

    animationFrame = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // Auto-change box every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!manualSelection) {
        setFade(false);
        setTimeout(() => {
          setSelected((prev) => (prev + 1) % count);
          setFade(true);
        }, 400); // fade-out time
      } else {
        setManualSelection(false);
      }
    }, 4000); 

    return () => clearInterval(interval);
  }, [manualSelection]);

  return (
    <div id="Overview" className="mt-20 px-4 pb-20 text-center text-white font-sans">
      <h2 className="text-4xl tracking-wide mb-4">
        Esprit{" "}
        <span className="bg-gradient-to-r from-[#05EEFA] to-[#003D40] text-transparent bg-clip-text">
          Features
        </span>
      </h2>
      <p className="text-xl md:text-2xl text-neutral-300 mb-12 max-w-4xl mx-auto font-light leading-relaxed tracking-wide">
        Introducing our SDK - Unlock ESPRIT's powerful recognition engine for people, vehicles, objects, and intelligent activity monitoring.   
      </p>

      <div className="flex flex-col md:flex-row justify-center items-start gap-12 md:gap-16 mt-10 md:mt-16">
        {/* Spinner */}
        <div className="relative w-[400px] h-[400px]">
          {/* Center Brain Image */}
          <div className="absolute left-1/2 top-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden shadow-xl border border-[#05EEFA]/40 z-20 bg-black">
            <img
              src={centerImage}
              alt="Center"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Icon positioning container (this rotates) */}
          <div
            ref={spinnerRef}
            className="absolute w-full h-full left-0 top-0"
            style={{
              transform: `rotate(${angle}rad)`
            }}
          >
            {overviewFeatures.map((feat, i) => {
              const theta = i * angleStep;
              const x = radius * Math.cos(theta);
              const y = radius * Math.sin(theta);

              const isActive = selected === i;

              return (
                <div
                  key={i}
                  onClick={() => {
                    setFade(false);
                    setTimeout(() => {
                      setSelected(i);
                      setFade(true);
                      setManualSelection(true);
                    }, 200);
                  }}
                  className={`absolute w-16 h-16 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-125
                    ${isActive ? "border-[#05EEFA] text-[#05EEFA] scale-125" : "border-neutral-700 text-white"} bg-black`}
                  style={{
                    left: `calc(50% + ${x}px - 32px)`,
                    top: `calc(50% + ${y}px - 32px)`
                  }}
                >
                  {/* Icon container that counter-rotates to stay upright */}
                  <div 
                    className="text-xl flex items-center justify-center"
                    style={{
                      transform: `rotate(${-angle}rad)`
                    }}
                  >
                    {feat.icon}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side Box */}
        <div
          className={`max-w-md w-full mt-23 md:min-w-[300px] bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364] border border-[#05EEFA]/30 rounded-xl p-8 shadow-2xl text-left transition-opacity duration-700 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-14 w-14 p-3 bg-neutral-800 text-[#05EEFA] items-center justify-center rounded-full">
              {overviewFeatures[selected].icon}
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">
              {overviewFeatures[selected].title}
            </h3>
          </div>
          <p className="text-neutral-200 text-base font-normal leading-loose tracking-wide">
            {overviewFeatures[selected].description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;