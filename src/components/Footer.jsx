import React from "react";

const Footer = () => {
  return (
    <footer className="mt-20 border-t py-10 border-neutral-700 text-neutral-300 px-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {/* Optional: add your link sections here later */}
      </div>

      <div className="grid md:grid-cols-3 gap-8 text-sm text-neutral-300">
        {/* Company Section */}
        <div>
          <h3 className="text-md font-semibold mb-3 text-white">Company</h3>
          <p className="mb-2">
            Website:{" "}
            <a
              href="https://neoastra.com/"
              className="text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              neoastra.com
            </a>
          </p>
        </div>

        {/* Contact Us Section */}
        <div>
          <h3 className="text-md font-semibold mb-3 text-white">Contact Us</h3>
          <p className="mb-1">Phone:</p>
          <p className="pl-2">+91 8217604819</p>
          <p className="pl-2 mb-2">+91 8073657275</p>
          <p className="mb-1">Write to Us:</p>
          <p className="pl-2">info@neoastra.com</p>
        </div>

        {/* Address Section */}
        <div>
          <h3 className="text-md font-semibold mb-3 text-white">Address</h3>
          <p>
            Smartworks Vaishnavi Tech Park, Bellandur Gate,<br />
            Sarjapur Main Rd, Ambalipura,<br />
            Bengaluru, Karnataka 560102
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
