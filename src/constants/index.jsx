import { ShieldAlert, Factory, Users, CarFront,      User, Calendar,  Smile, Box, Camera, Activity,  FileText,  Eye } from "lucide-react";

import SafetyImg from "../assets/category/safety.jpg";
import IndustrialImg from "../assets/category/industrial.jpg";
import PeopleImg from "../assets/category/people.jpg";
import VehicleImg from "../assets/category/vehicle.jpg";
import ImminentImg from "../assets/thumbnails/Imminent.png";
import SmokeImg from "../assets/thumbnails/smoke.png";
import PhoneImg from "../assets/thumbnails/phone.png";
import Intrusion1Img from "../assets/thumbnails/Intrusion1.png";
import Intrusion2Img from "../assets/thumbnails/Intrusion2.png";
import RunImg from "../assets/thumbnails/Run.png";
import KapivaImg from "../assets/thumbnails/kapiva.png";
import JupiterImg from "../assets/thumbnails/Jupiter.png";
import Vehicle2Img from "../assets/thumbnails/vehicle.png";



export const navItems = [
  { id: 'Intrusion', label: 'Demo'},
  { id: 'Category', label: 'Highlights' },    
  { id: 'Overview', label: 'Overview' },        
];

export const category = [
  {
    id: 1,
    icon: <ShieldAlert />,
    text: "Safety & Security Detection",
    description:
      "Videos showcasing advanced AI-powered security detection systems. The videos feature real-time surveillance footage demonstrating various security monitoring technologies including predictive breach analysis, smoking detection, phone usage monitoring, and intrusion detection systems.",
    image: SafetyImg,
  },
  {
    id: 2,
    icon: <Factory />,
    text: "Industrial Monitoring",
    description:
    "Specialized AI-powered monitoring systems designed for industrial environments and manufacturing processes. The videos demonstrate automated quality control, production monitoring, and compliance tracking solutions that enhance operational efficiency and maintain product standards in real-time industrial settings.",
    image: IndustrialImg,
  },
  {
    id: 3,
    icon: <Users />,
    text: "People Analytics",
    description:
      "AI-driven workforce monitoring and analytics systems designed to optimize human resource management and operational efficiency. The videos showcase advanced people tracking technologies that analyze employee behavior, productivity metrics, and workplace compliance ",
    image: PeopleImg,
  },
  {
    id: 4,
    icon: <CarFront />,
    text: "Vehicle & Traffic",
    description:
      "Intelligent vehicle monitoring systems designed for security surveillance, and vehicular behavior analysis. The video demonstrates advanced AI-powered solutions that track vehicle movements",
    image: VehicleImg,
  },
];

export const videoData = [
  // Safety & Security Detection videos
  {
    id: 1,
    categoryId: 1,
    category: "Safety & Security Detection",
    title: "Imminent Breach Prediction",
    thumbnail: ImminentImg,
    url: "https://drive.google.com/file/d/1eNhGzazCNmL6eaOdF4aVn_Z8Z4rb-3fh/view?usp=drive_link",
    description: "AI predicts potential security breaches with path analysis. Shows past path in white, predicted breach path in red, and safe path in orange. Detects loitering and unauthorized movement towards restricted areas."
  },
  {
    id: 2,
    categoryId: 1,
    category: "Safety & Security Detection",
    title: "Smoking Detection System",
    thumbnail: SmokeImg,
    url: "https://drive.google.com/file/d/1_6NoXEx5KIVdwuG52hHdWlFdm1WSQBMz/view?usp=drive_link",
    description: "Real-time smoking detection in designated areas. Identifies cigarettes in hands and monitors  in intrusion zones."
  },
  {
    id: 3,
    categoryId: 1,
    category: "Safety & Security Detection",
    title: "Phone Usage Monitoring",
    thumbnail: PhoneImg,
    url: "https://drive.google.com/file/d/1yl879ilYmxFj3_jR8oxOF9ozPv7SgIwR/view?usp=drive_link",
    description: "Monitors unauthorized phone usage in restricted areas. Tracks usage duration in seconds and ensures compliance with workplace policies."
  },
  {
    id: 4,
    categoryId: 1,
    category: "Safety & Security Detection",
    title: "Intrusion Zone Alert 1",
    thumbnail: Intrusion1Img,
    url: "https://drive.google.com/file/d/1zg2eA0bQ0mmTXNsTwrMLtrAnpxWIPgm1/view?usp=drive_link",
    description: "Advanced intrusion detection system that monitors drawn red zones and immediately alerts when unauthorized personnel enter restricted areas."
  },
  {
    id: 4,
    categoryId: 1,
    category: "Safety & Security Detection",
    title: "Intrusion Zone Alert 2",
    thumbnail: Intrusion2Img,
    url: "https://drive.google.com/file/d/14dl9a53Hun2Uwc5PzV582CPDQK7sbJob/view?usp=drive_link",
    description: "Advanced intrusion detection system that monitors drawn red zones and immediately alerts when unauthorized personnel enter restricted areas."
  },
  {
    id: 4,
    categoryId: 1,
    category: "Safety & Security Detection",
    title: "Tntrusion Running",
    thumbnail: RunImg,
    url: "https://drive.google.com/file/d/1j3cVq7JDWRpf-L0PfoD2SzKEthX5P_cO/view?usp=drive_link",
    description: "Advanced intrusion detection system that monitors running pattern ."
  },

  // Industrial Monitoring videos
  {
    id: 5,
    categoryId: 2,
    category: "Industrial Monitoring",
    title: "Kapiva Packaging Monitor",
    thumbnail: KapivaImg,
    url: "https://drive.google.com/file/d/1xQKFIUvKagjzulMfQzxfQ7yokRzCJEQl/view?usp=drive_link",
    description: "Automated packaging quality control system. Highlights wrapped products in blue and unwrapped products in red within intrusion boxes for real-time production monitoring."
  },

  // People Analytics videos
  {
    id: 6,
    categoryId: 3,
    category: "People Analytics",
    title: "Jupiter Productivity Analytics",
    thumbnail: JupiterImg,
    url: "https://drive.google.com/file/d/1pF5P_VoikFiwU4_HF7XFIEenzz14uClE/view?usp=drive_link",
    description: "Comprehensive worker productivity analysis system. Tracks productivity percentages, activity classification (folding, idle), and monitors each worker within designated intrusion boxes."
  },

  // Vehicle & Traffic videos
  {
    id: 7,
    categoryId: 4,
    category: "Vehicle Monitoring",
    title: "Vehicle Detection & Monitoring",
    thumbnail: Vehicle2Img,
    url: "https://drive.google.com/file/d/1b9n6hz79_6SaIyocPCJPL3_gJczwlFWD/view?usp=drive_link",
    description: "Advanced vehicle monitoring system detecting vehicles, loitering behavior, ground objects, running status, and surveillance activities. Shows past path, predicted path, and safe path analysis."
  }
];

export const overviewFeatures = [
  {
    icon: <User size={24} />,
    title: "Face Detection",
    description: "Advanced facial recognition and detection capabilities"
  },
  {
    icon: <Calendar size={24} />,
    title: "Age Detection",
    description: "Accurate age estimation and demographic analysis"
  },
  {
    icon: <Users size={24} />,
    title: "Gender Detection",
    description: "Reliable gender identification and classification"
  },
  {
    icon: <Smile size={24} />,
    title: "Emotion Recognition",
    description: "Real-time emotion detection and sentiment analysis"
  },
  {
    icon: <Box size={24} />,
    title: "Object Detection",
    description: "Comprehensive object identification and tracking"
  },
  {
    icon: <Camera size={24} />,
    title: "Scene Analysis",
    description: "Intelligent scene understanding and context recognition"
  },
  {
    icon: <Activity size={24} />,
    title: "Pose Detection",
    description: "Human pose estimation and movement analysis"
  },
  {
    icon: <FileText size={24} />,
    title: "OCR Text Detection",
    description: "Extract and recognize text from images and documents"
  },
  {
    icon: <Eye size={24} />,
    title: "Eye Gaze Tracking",
    description: "Precise eye movement and gaze direction analysis"
  }
];



