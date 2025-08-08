import { useParams, useLocation, useNavigate } from "react-router-dom";
import { videoData } from "../constants";
import { motion } from "framer-motion";
import { ArrowLeft,Play } from "lucide-react";

const VideoList = () => {
  const { categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get category name from navigation state or fallback
  const categoryName = location.state?.categoryName || "Demo Videos";
  
  // Filter videos based on the category ID from URL
  const filteredVideos = videoData.filter(
    (video) => video.categoryId === parseInt(categoryId)
  );

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="pt-20 px-6 text-white min-h-screen">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 text-[#05EEFA] hover:text-white transition-colors duration-300 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-2 text-[#05EEFA]">{categoryName}</h1>
      <p className="text-neutral-400 mb-8">Explore our demo videos for this category</p>

      {/* Check if videos exist for this category */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-400 text-lg">No videos available for this category yet.</p>
          <button
            onClick={handleBackClick}
            className="mt-4 bg-gradient-to-r from-[#05EEFA] to-[#003D40] text-white px-6 py-2 rounded-lg hover:scale-105 transition-transform duration-300"
          >
            Back to Categories
          </button>
        </div>
      ) : (
        /* Video Grid */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <motion.div
              key={video.id}
              className="bg-[#1a1a1a] rounded-lg overflow-hidden shadow-md hover:shadow-lg border border-neutral-800 hover:border-[#05EEFA]/50 transition-all"
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: video.id * 0.1 }}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2 text-[#05EEFA]">
                  {video.title}
                </h3>
                <p className="text-sm text-neutral-400 mb-4">{video.description}</p>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#05EEFA] to-[#003D40] text-white px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform duration-300"
                  >
                  <Play size={15} className="group-hover:-translate-x-1 transition-transform duration-300" />
                   Watch Video

                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoList;