import { category } from "../constants";
import { useNavigate } from "react-router-dom";

const FeatureSection = () => {
  const navigate = useNavigate();

  const handleSeeInAction = (categoryId, categoryName) => {
    // Navigate to video list with category ID and name as parameters
    navigate(`/video-list/${categoryId}`, { 
      state: { categoryName } 
    });
  };

  return (
    <div id="Category" className="relative mt-20 min-h-[800px]">
      <div className="text-center">
        <h2 className="text-3xl sm:text-5xl lg:text-4xl mt-10 lg:mt-20 tracking-wide">
          Demo{" "}
          <span className="bg-gradient-to-r from-[#05EEFA] to-[#003D40] text-transparent bg-clip-text">
            Highlights
          </span>
        </h2>
      </div>

      <div className="mt-10 flex flex-col gap-16">
        {category.map((category, index) => (
          <div
            key={index}
            className={`flex flex-col lg:flex-row ${
              index % 2 === 1 ? "lg:flex-row-reverse" : ""
            } items-center justify-between gap-6 lg:gap-10`}
          >
            {/* category Box */}
            <div className="w-full lg:w-1/2 group border border-neutral-700 rounded-2xl p-6 hover:border-[#05EEFA]/50 transition duration-300 min-h-[250px] flex flex-col justify-between shadow-md bg-neutral-900">
              {/* Icon and Title in same line */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 p-2 bg-[#1a1a1a] text-[#05EEFA] justify-center items-center rounded-full flex-shrink-0 group-hover:bg-[#05EEFA]/10 transition-colors duration-300">
                  {category.icon}
                </div>
                <h5 className="text-2xl font-semibold group-hover:text-[#05EEFA] transition-colors duration-300">
                  {category.text}
                </h5>
              </div>

              {/* Image with button inside bottom-left corner */}
              <div className="relative mt-4 w-full h-[220px] rounded-lg overflow-hidden">
                <img
                  src={category.image}
                  alt={category.text}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 brightness-90 contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                {/* Button inside image */}
                <button 
                  onClick={() => handleSeeInAction(category.id, category.text)}
                  className="absolute bottom-3 left-3 bg-gradient-to-r from-[#05EEFA] to-[#003D40] text-white font-semibold py-2 px-4 rounded-lg transition-transform duration-300 hover:scale-105 shadow-md"
                >
                  See in Action
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="w-full lg:w-1/2 text-neutral-400 text-md p-4 leading-relaxed">
              {category.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureSection;