const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/request-demo", async (req, res) => {
  const { email, phone } = req.body;

  if (!email || !phone) {
    return res.status(400).json({ message: "Email and phone are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,   
        pass: process.env.EMAIL_PASS,   
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER, 
      to: process.env.EMAIL_USER,   
      subject: "New Demo Request",
      text: `New demo request received:\n\nEmail: ${email}\nPhone: ${phone}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Demo request sent!" });
  } catch (error) {
    console.error("Email sending failed:", error);
    res.status(500).json({ message: "Failed to send email." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
