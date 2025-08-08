import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Intrusion from "./components/Intrusion";
import Categories from "./components/Categories";
import Overview from "./components/Overview";
import DemoRequest from "./components/DemoRequest";
import Footer from "./components/Footer";
import VideoList from "./components/VideoList";

const HomePage = () => (
  <>
    <HeroSection />
    <Intrusion />
    <Categories />
    <Overview />
    <DemoRequest />
    <Footer />
  </>
);

const App = () => {
  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto pt-20 px-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Updated route to accept categoryId as parameter */}
          <Route path="/video-list/:categoryId" element={<VideoList />} />
        </Routes>
      </div>
    </>
  );
};

export default App;