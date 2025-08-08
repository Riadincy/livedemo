import { Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "../assets/logo.png";
import neologo from "../assets/neo.png";

import { navItems } from "../constants";

const Navbar = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const toggleNavbar = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();

    // Add debug logging
    console.log('Trying to scroll to section:', sectionId);

    const section = document.getElementById(sectionId);
    console.log('Found section:', section);

    if (section) {
      const navbarHeight = 80;
      const elementPosition = section.offsetTop;
      const offsetPosition = elementPosition - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      window.history.pushState(null, null, `#${sectionId}`);

      if (mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    } else {
      console.error(`Could not find section with id: ${sectionId}`);
      console.log('Available IDs:',
        Array.from(document.querySelectorAll('[id]')).map(el => el.id)
      );
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-3 backdrop-blur-lg border-b border-neutral-700/80">
      <div className="container px-4 mx-auto relative lg:text-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center flex-shrink-0">
            <img className="h-10 w-40 mr-2" src={neologo} alt="Logo" />
          </div>
          <ul className="hidden lg:flex ml-14 space-x-12">
            {navItems.map((item, index) => (
              <li key={index}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className="hover:text-[#05EEFA] transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="hidden lg:flex justify-center space-x-6 items-center">
            <button
              onClick={(e) => handleNavClick(e, "Intrusion")}
              className="border border-white text-white px-4 py-2 rounded-md hover:bg-white hover:text-black transition-all duration-300 mr-4"
            >
              Start for free
            </button>
            <button
              onClick={(e) => handleNavClick(e, "DemoRequest")}
              className="bg-gradient-to-r from-[#05EEFA] to-[#003D40] py-2 px-3 rounded-md cursor-pointer"
            >
              Request a Demo
            </button>
          </div>
          <div className="lg:hidden md:flex flex-col justify-end">
            <button onClick={toggleNavbar}>
              {mobileDrawerOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {mobileDrawerOpen && (
          <div className="fixed right-0 z-20 bg-neutral-900 w-full p-12 flex flex-col justify-center items-center lg:hidden">
            <ul>
              {navItems.map((item, index) => (
                <li key={index} className="py-4">
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => handleNavClick(e, item.id)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex flex-col items-center space-y-4 mt-6">
              <button
                onClick={(e) => handleNavClick(e, "Intrusion")}
                className="border border-white text-white px-4 py-2 rounded-md hover:bg-[#05EEFA] hover:text-black transition-all duration-300 w-full text-center"
              >
                Start for free
              </button>
              <button
                onClick={(e) => handleNavClick(e, "DemoRequest")}
                className="bg-gradient-to-r from-[#05EEFA] to-[#003D40] py-2 px-3 rounded-md cursor-pointer w-full text-center"
              >
                Request a Demo
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;