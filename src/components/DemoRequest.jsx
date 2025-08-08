import React, { useState } from "react";

const DemoRequest = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");

    try {
      const res = await fetch("http://localhost:5000/api/request-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });

      if (res.ok) {
        setSuccess("Demo request sent successfully!");
        setEmail("");
        setPhone("");
      } else {
        setSuccess("Failed to send request. Try again.");
      }
    } catch (error) {
      setSuccess("An error occurred.");
    }
  };

  return (
    <section id="DemoRequest" className="w-full text-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-semibold mb-6 text-center font-sans">
          Improve Your Business with AI-Driven Solutions
        </h2>
        <p className="text-sm md:text-base mb-8 text-center text-gray-300 font-light">
          Contact us to schedule a live demo and explore how real-time detection and AI features 
          can transform your operations.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-gray-400 rounded-md bg-transparent text-white placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter 10-digit phone number"
              className="w-full px-4 py-2 border border-gray-400 rounded-md bg-transparent text-white placeholder-gray-400"
            />
          </div>

          <p className="text-xs text-gray-400">
            I consent to Neoastra contacting me using the details provided, and I agree to the privacy policy
          </p>

          <button
            type="submit"
            className="bg-gradient-to-r from-[#05EEFA] to-[#003D40] hover:scale-105 transition-transform px-6 py-2 rounded-md text-white font-medium cursor-pointer text-sm"
          >
            Request a Demo
          </button>

          {success && (
            <p className="text-sm mt-2 text-center text-green-400">{success}</p>
          )}
        </form>
      </div>
    </section>
  );
};

export default DemoRequest;
