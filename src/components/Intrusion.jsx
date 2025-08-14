import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Tv, Upload, Shield, Play, Square, User, Eye } from "lucide-react";

const TabbedDetectionSystem = () => {
  const [activeTab, setActiveTab] = useState('intrusion');

  const tabs = [
    { id: 'intrusion', name: 'Intrusion Detection', icon: Shield },
    { id: 'face', name: 'Face Recognition', icon: User },
    { id: 'fashion', name: 'Fashion Detection', icon: Eye }
  ];

  const isProduction = window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1';

  // const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'ws://localhost:8000';


const BACKEND_URL = isProduction 
? 'ws://103.80.162.43:8000'  // Production backend
: 'ws://localhost:8000';     // Development backend

const API_URL = isProduction 
? 'http://103.80.162.43:8000'
: 'http://localhost:8000';

  const IntrusionDetectionSection = () => {
    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    const wsRef = useRef(null);
    const intervalRef = useRef(null);
    const streamRef = useRef(null);
    
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [polygonPoints, setPolygonPoints] = useState([]);
    const [polygonClosed, setPolygonClosed] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(null);
    const [intruderDetected, setIntruderDetected] = useState(false);
    const [backgroundImage, setBackgroundImage] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    
    const TARGET_VIDEO_WIDTH = 1280;
    const TARGET_VIDEO_HEIGHT = 720;
    const FRAME_RATE = 10;

    // Start webcam and capture first frame for drawing
    const startWebcam = async () => {
      try {
        // Stop any existing stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: TARGET_VIDEO_WIDTH },
            height: { ideal: TARGET_VIDEO_HEIGHT },
            frameRate: { ideal: 30 }
          }
        });
        
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        
        // Wait for video to load and capture first frame
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setTimeout(() => {
              captureBackgroundFrame();
            }, 1000);
          });
        };
      } catch (error) {
        alert("Failed to access camera: " + error.message);
      }
    };

    // Stop webcam
    const stopWebcam = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
      
      // Clear the background and reset states
      setImageLoaded(false);
      setBackgroundImage(null);
      setPolygonPoints([]);
      setPolygonClosed(false);
      
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    // Capture background frame for polygon drawing
    const captureBackgroundFrame = () => {
      const video = videoRef.current;
      if (!video || video.readyState !== 4) return;

      const canvas = document.createElement('canvas');
      canvas.width = TARGET_VIDEO_WIDTH;
      canvas.height = TARGET_VIDEO_HEIGHT;
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(video, 0, 0, TARGET_VIDEO_WIDTH, TARGET_VIDEO_HEIGHT);
      
      const img = new Image();
      img.onload = () => {
        setBackgroundImage(img);
        setImageLoaded(true);
      };
      img.src = canvas.toDataURL('image/jpeg', 0.9);
    };

    // Handle file upload for video
    const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('video/')) {
        alert("Please upload only video files.");
        return;
      }

      // Stop webcam if active
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
      
      // Create video element to capture first frame
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      
      video.onloadedmetadata = () => {
        video.currentTime = 0;
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = TARGET_VIDEO_WIDTH;
        canvas.height = TARGET_VIDEO_HEIGHT;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(video, 0, 0, TARGET_VIDEO_WIDTH, TARGET_VIDEO_HEIGHT);
        
        const img = new Image();
        img.onload = () => {
          setBackgroundImage(img);
          setImageLoaded(true);
        };
        
        img.src = canvas.toDataURL('image/jpeg', 0.9);
        URL.revokeObjectURL(video.src);
      };
    };

    // Enhanced canvas drawing logic
    const setupDrawingCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      canvas.width = TARGET_VIDEO_WIDTH;
      canvas.height = TARGET_VIDEO_HEIGHT;

      const redraw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background image if available
        if (backgroundImage) {
          ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        }

        // Draw polygon with consistent color (cyan)
        if (polygonPoints.length > 0) {
          // Draw connecting lines
          ctx.strokeStyle = '#05EEFA';
          ctx.lineWidth = 4;
          ctx.setLineDash([]);
          
          for (let i = 0; i < polygonPoints.length - 1; i++) {
            const current = polygonPoints[i];
            const next = polygonPoints[i + 1];
            
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          }
          
          // Draw closing line if polygon is closed
          if (polygonClosed && polygonPoints.length >= 3) {
            const lastPoint = polygonPoints[polygonPoints.length - 1];
            const firstPoint = polygonPoints[0];
            
            ctx.beginPath();
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(firstPoint.x, firstPoint.y);
            ctx.stroke();
          }

          // Draw points with enhanced visibility
          polygonPoints.forEach((point, index) => {
            // Draw larger point background circle
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw colored point - FIRST point is GOLD, others are CYAN
            if (index === 0) {
              ctx.fillStyle = '#FFD700';
              ctx.beginPath();
              ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
              ctx.fill();
              
              ctx.strokeStyle = '#FFA500';
              ctx.lineWidth = 3;
              ctx.stroke();
            } else {
              ctx.fillStyle = '#05EEFA';
              ctx.beginPath();
              ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
              ctx.fill();
              
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          });
        }
      };

      const snapToGrid = (x, y) => {
        const gridSize = 20;
        return {
          x: Math.round(x / gridSize) * gridSize,
          y: Math.round(y / gridSize) * gridSize
        };
      };

      const getCanvasCoords = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        return snapToGrid(x, y);
      };

      const handleMouseDown = (e) => {
        if (!imageLoaded || polygonClosed || isStreaming) return;
        
        const coords = getCanvasCoords(e);
        setIsDragging(true);
        setDragStart(coords);
        
        const newPoints = [...polygonPoints, coords];
        setPolygonPoints(newPoints);
      };

      const handleMouseMove = (e) => {
        if (!isDragging || !dragStart || !imageLoaded || polygonClosed || isStreaming) {
          if (!polygonClosed && imageLoaded && !isStreaming) {
            canvas.style.cursor = 'crosshair';
          }
          return;
        }
        
        const coords = getCanvasCoords(e);
        
        if (polygonPoints.length > 0) {
          const updatedPoints = [...polygonPoints];
          updatedPoints[updatedPoints.length - 1] = coords;
          setPolygonPoints(updatedPoints);
        }
      };

      const handleMouseUp = (e) => {
        if (!isDragging || !imageLoaded || polygonClosed || isStreaming) return;
        
        const coords = getCanvasCoords(e);
        setIsDragging(false);
        setDragStart(null);
        
        const updatedPoints = [...polygonPoints];
        updatedPoints[updatedPoints.length - 1] = coords;
        setPolygonPoints(updatedPoints);
      };

      const handleClick = (e) => {
        if (!imageLoaded || polygonClosed || isStreaming || isDragging) return;

        const coords = getCanvasCoords(e);

        // Check if clicking near first point to close (minimum 3 points)
        if (polygonPoints.length >= 3) {
          const firstPoint = polygonPoints[0];
          const distance = Math.sqrt(
            Math.pow(firstPoint.x - coords.x, 2) + 
            Math.pow(firstPoint.y - coords.y, 2)
          );
          
          if (distance <= 40) {
            setPolygonClosed(true);
            return;
          }
        }

        // Add new point
        const newPoints = [...polygonPoints, coords];
        setPolygonPoints(newPoints);
      };

      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('click', handleClick);
      redraw();

      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('click', handleClick);
      };
    }, [imageLoaded, polygonPoints, polygonClosed, backgroundImage, isStreaming, isDragging, dragStart]);

    // Setup drawing canvas when dependencies change
    useEffect(() => {
      const cleanup = setupDrawingCanvas();
      return cleanup;
    }, [setupDrawingCanvas]);

    // Clear canvas
    const clearCanvas = () => {
      setPolygonPoints([]);
      setPolygonClosed(false);
      setImageLoaded(false);
      setBackgroundImage(null);
      
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    // Undo last point
    const undoLastPoint = () => {
      if (polygonClosed) {
        setPolygonClosed(false);
      } else if (polygonPoints.length > 0) {
        const newPoints = polygonPoints.slice(0, -1);
        setPolygonPoints(newPoints);
      }
    };

    // Capture frame from video for streaming
    const captureFrame = () => {
      const video = videoRef.current;
      if (!video || video.readyState !== 4) return null;
      
      const canvas = document.createElement('canvas');
      canvas.width = TARGET_VIDEO_WIDTH;
      canvas.height = TARGET_VIDEO_HEIGHT;
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(video, 0, 0, TARGET_VIDEO_WIDTH, TARGET_VIDEO_HEIGHT);
      return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    };

    // Start intrusion detection
    const startIntrusionDetection = () => {
      if (!isStreaming) {
        if (!polygonClosed || polygonPoints.length < 3) {
          alert("Please draw a closed polygon with at least 3 points before starting intrusion detection.");
          return;
        }

        if (!isCameraActive) {
          alert("Please start the webcam first for live detection.");
          return;
        }

        // Connect to WebSocket
        const ws = new WebSocket(`${BACKEND_URL}/ws/intrusion`);
        wsRef.current = ws;
        
        ws.onopen = () => {
          setIsStreaming(true);
          
          // Send polygon data
          ws.send(JSON.stringify({
            type: 'polygon',
            polygon: polygonPoints.map(p => ({ 
              x: Math.round(p.x), 
              y: Math.round(p.y) 
            }))
          }));
          
          // Start sending frames
          intervalRef.current = setInterval(() => {
            const frameData = captureFrame();
            if (frameData && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'frame',
                frame: frameData,
                timestamp: Date.now()
              }));
            }
          }, 1000 / FRAME_RATE);
        };
        
        ws.onmessage = (event) => {
          try {
            if (typeof event.data === 'string' && event.data.startsWith('{')) {
              const data = JSON.parse(event.data);
              if (data.frame) {
                setCurrentFrame(`data:image/jpeg;base64,${data.frame}`);
                setIntruderDetected(data.intruder || false);
              }
            }
          } catch (error) {
            console.error("Error parsing message:", error);
          }
        };
        
        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          alert("WebSocket connection error. Please check if the backend server is running on port 8000.");
          stopIntrusionDetection();
        };
        
        ws.onclose = () => {
          stopIntrusionDetection();
        };
      } else {
        stopIntrusionDetection();
      }
    };

    // Stop intrusion detection
    const stopIntrusionDetection = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      setIsStreaming(false);
      setCurrentFrame(null);
      setIntruderDetected(false);
    };

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        stopIntrusionDetection();
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
    }, []);

    return (
      <>
        {/* Hidden video element for webcam */}
        <video
          ref={videoRef}
          style={{ display: 'none' }}
          autoPlay
          muted
          playsInline
        />

        {/* Main Container Frame */}
        <div className="max-w-7xl mx-auto border border-neutral-700 rounded-3xl bg-neutral-900/50 backdrop-blur-sm p-6 shadow-2xl">
          
          {/* Controls Section */}
          <div className="border-b border-neutral-700 pb-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-10 w-10 p-2 bg-[#1a1a1a] text-[#05EEFA] justify-center items-center rounded-full flex-shrink-0">
                <Shield size={20} />
              </div>
              <h5 className="text-xl font-semibold text-white">
                Security Zone Setup
              </h5>
              
              {/* Connection Status */}
              <div className="text-sm ml-auto flex items-center gap-3">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                  isStreaming 
                    ? intruderDetected 
                      ? 'bg-red-900/50 text-red-300 animate-pulse' 
                      : 'bg-green-900/50 text-green-400'
                    : 'bg-neutral-700 text-neutral-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isStreaming 
                      ? intruderDetected 
                        ? 'bg-red-400 animate-pulse' 
                        : 'bg-green-400 animate-pulse'
                      : 'bg-neutral-400'
                  }`}></div>
                  {isStreaming 
                    ? intruderDetected 
                      ? 'INTRUDER DETECTED' 
                      : 'Detection Active'
                    : 'Ready'
                  }
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-between">
              
              <div className="flex gap-3 flex-wrap">
                <button
                  className="px-4 py-2 flex items-center justify-center gap-2 bg-gradient-to-r from-[#05EEFA] to-[#003D40] hover:from-[#05EEFA]/80 hover:to-[#003D40]/80 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={isCameraActive ? stopWebcam : startWebcam}
                  disabled={isStreaming}
                >
                  <Tv size={18} />
                  {isCameraActive ? "Stop Webcam" : "Start Webcam"}
                </button>

                <button
                  className="px-4 py-2 flex items-center justify-center gap-2 bg-gradient-to-r from-[#05EEFA] to-[#003D40] hover:from-[#05EEFA]/80 hover:to-[#003D40]/80 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming}
                >
                  <Upload size={18} />
                  Upload Video
                </button>

                <input
                  type="file"
                  accept="video/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {imageLoaded && !isStreaming && (
                  <>
                    <button
                      onClick={clearCanvas}
                      className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-white font-semibold transition-colors duration-300 text-sm"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={undoLastPoint}
                      className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-white font-semibold transition-colors duration-300 text-sm"
                      disabled={polygonPoints.length === 0}
                    >
                      Undo Point
                    </button>
                  </>
                )}
              </div>

              {(imageLoaded && polygonClosed) && (
                <button
                  onClick={startIntrusionDetection}
                  className={`px-6 py-2 flex items-center justify-center gap-2 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105 ${
                    isStreaming 
                      ? 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700'
                      : 'bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700'
                  }`}
                >
                  {isStreaming ? <Square size={18} /> : <Play size={18} />}
                  {isStreaming ? "Stop Detection" : "Start Detection"}
                </button>
              )}
            </div>
          </div>

          {/* Video Display Area */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-5xl">
              
              {/* Canvas for Drawing (only when not streaming) */}
              <canvas
                ref={canvasRef}
                width={TARGET_VIDEO_WIDTH}
                height={TARGET_VIDEO_HEIGHT}
                className={`w-full border-2 border-[#05EEFA] bg-black rounded-xl shadow-2xl cursor-crosshair transition-all duration-300 ${
                  (!isStreaming && imageLoaded) ? "block" : "hidden"
                }`}
                style={{
                  aspectRatio: `${TARGET_VIDEO_WIDTH} / ${TARGET_VIDEO_HEIGHT}`
                }}
              />

              {/* Live Stream Display */}
              {isStreaming && currentFrame && (
                <div className={`relative rounded-xl overflow-hidden shadow-2xl bg-black border-2 transition-all duration-300 w-full ${
                  intruderDetected ? 'border-red-500 shadow-red-500/50' : 'border-[#05EEFA]'
                }`}
                     style={{
                       aspectRatio: `${TARGET_VIDEO_WIDTH} / ${TARGET_VIDEO_HEIGHT}`
                     }}>
                  <img
                    src={currentFrame}
                    className="w-full h-full object-contain"
                    alt="Live Detection Stream"
                  />
                  
                  {/* Detection status overlay */}
                  <div className="absolute bottom-4 left-4 px-4 py-2 rounded-lg text-sm backdrop-blur-sm bg-black/80 text-white">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className={intruderDetected ? "text-red-400" : "text-[#05EEFA]"} />
                      <span className={intruderDetected ? "text-red-300 font-bold" : "text-white"}>
                        {intruderDetected ? "INTRUDER DETECTED!" : "Security Monitoring Active"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isStreaming && !currentFrame && (
                <div className="w-full border-2 border-[#05EEFA] bg-neutral-800/50 rounded-xl flex items-center justify-center shadow-2xl"
                     style={{
                       aspectRatio: `${TARGET_VIDEO_WIDTH} / ${TARGET_VIDEO_HEIGHT}`,
                       minHeight: "400px"
                     }}>
                  <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#05EEFA] mx-auto mb-4"></div>
                    <h3 className="text-neutral-300 text-xl font-semibold mb-2">Starting Detection...</h3>
                    <p className="text-neutral-500">Initializing AI detection system</p>
                  </div>
                </div>
              )}
              
              {/* Placeholder */}
              {(!imageLoaded && !isStreaming) && (
                <div className="w-full border-2 border-neutral-600 bg-neutral-800/30 rounded-xl flex items-center justify-center shadow-inner"
                     style={{
                       aspectRatio: `${TARGET_VIDEO_WIDTH} / ${TARGET_VIDEO_HEIGHT}`,
                       minHeight: "400px"
                     }}>
                  <div className="text-center p-8">
                    <Shield size={64} className="text-neutral-600 mx-auto mb-6" />
                    <h3 className="text-neutral-300 text-xl font-semibold mb-2">Ready to Start Monitoring</h3>
                    <p className="text-neutral-500 mb-2">Start webcam or upload a video to begin</p>
                    <p className="text-neutral-600 text-sm">Click points to draw security zones and monitor for intrusions in real-time</p>
                  </div>
                </div>
              )}

              {/* Drawing Status Indicator */}
              {imageLoaded && !isStreaming && (
                <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      polygonPoints.length === 0 ? 'bg-[#05EEFA]' :
                      polygonPoints.length < 3 ? 'bg-yellow-400' :
                      !polygonClosed ? 'bg-orange-400' : 'bg-green-400'
                    }`}></div>
                    {polygonPoints.length === 0 ? "Click to place points" : 
                     polygonPoints.length < 3 ? `Need ${3 - polygonPoints.length} more points` :
                     !polygonClosed ? "Click near first point to close" : "Zone ready"}
                  </div>
                </div>
              )}

              {/* Drawing Guide - Top Right */}
              {imageLoaded && !isStreaming && polygonPoints.length === 0 && (
                <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs backdrop-blur-sm max-w-xs">
                  <p className="text-[#05EEFA] font-semibold mb-1">Draw Security Zone:</p>
                  <p>• Click + drag for lines</p>
                  <p>• Click for single points</p>
                  <p>• Close at first point</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  const FaceRecognitionSection = () => {
    return (
      <div className="max-w-7xl mx-auto border border-neutral-700 rounded-3xl bg-neutral-900/50 backdrop-blur-sm p-6 shadow-2xl">
        <div className="text-center py-20">
          <User size={64} className="text-neutral-600 mx-auto mb-6" />
          <h3 className="text-neutral-300 text-2xl font-semibold mb-4">Face Recognition</h3>
          <p className="text-neutral-500 text-lg">
          </p>
        </div>
      </div>
    );
  };

  const FashionDetectionSection = () => {
    return (
      <div className="max-w-7xl mx-auto border border-neutral-700 rounded-3xl bg-neutral-900/50 backdrop-blur-sm p-6 shadow-2xl">
        <div className="text-center py-20">
          <Eye size={64} className="text-neutral-600 mx-auto mb-6" />
          <h3 className="text-neutral-300 text-2xl font-semibold mb-4">Fashion Detection</h3>
          <p className="text-neutral-500 text-lg">
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative mt-20 min-h-screen">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-5xl lg:text-4xl tracking-wide">
          AI{" "}
          <span className="bg-gradient-to-r from-[#05EEFA] to-[#003D40] text-transparent bg-clip-text">
            Detection System
          </span>
        </h2>
        <p className="text-neutral-400 text-lg mt-4 max-w-3xl mx-auto">
          Advanced computer vision solutions for security, identification, and analysis
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-center">
          <div className="flex bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-2 border border-neutral-700">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#05EEFA] to-[#003D40] text-white shadow-lg transform scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
                  }`}
                >
                  <IconComponent size={20} />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === 'intrusion' && <IntrusionDetectionSection />}
        {activeTab === 'face' && <FaceRecognitionSection />}
        {activeTab === 'fashion' && <FashionDetectionSection />}
      </div>
    </div>
  );
};

export default TabbedDetectionSystem;