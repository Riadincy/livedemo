import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Tv, Upload, Shield, Play, Square } from "lucide-react";

const IntrusionDetectionSection = () => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef();
  const wsRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [polygonClosed, setPolygonClosed] = useState(false);
  const [lastValidPolygon, setLastValidPolygon] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [intruderDetected, setIntruderDetected] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  
  const TARGET_VIDEO_WIDTH = 1280;
  const TARGET_VIDEO_HEIGHT = 720;

  // Enhanced canvas drawing logic with better state management
  const setupDrawingCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = TARGET_VIDEO_WIDTH;
    canvas.height = TARGET_VIDEO_HEIGHT;

    const drawGrid = () => {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 0.5;
      const gridSize = 20;
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    const redraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background image if available
      if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      } else {
        drawGrid();
      }

      // Draw polygon with enhanced visibility
      if (polygonPoints.length > 0) {
        // Draw connecting lines FIRST
        ctx.strokeStyle = '#05EEFA';
        ctx.lineWidth = 4; // Thicker lines for better visibility
        ctx.setLineDash([]);
        
        // Draw all lines between consecutive points
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

        // Draw points on top with enhanced visibility
        polygonPoints.forEach((point, index) => {
          // Draw larger point background circle
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw colored point - FIRST point is GOLD, others are CYAN
          if (index === 0) {
            // First point - larger and gold
            ctx.fillStyle = '#FFD700'; // Gold
            ctx.beginPath();
            ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
            ctx.fill();
            
            // Extra highlight for first point
            ctx.strokeStyle = '#FFA500'; // Orange border
            ctx.lineWidth = 3;
            ctx.stroke();
          } else {
            // Other points - cyan
            ctx.fillStyle = '#05EEFA';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
            ctx.fill();
            
            // White border for contrast
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });

        // Draw preview line from last point to mouse (if not closed)
        if (!polygonClosed && polygonPoints.length > 0) {
          ctx.strokeStyle = 'rgba(5, 238, 250, 0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          // This would show a guide line to mouse position if we track it
        }
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
      
      // Add first point immediately
      const newPoints = [...polygonPoints, coords];
      setPolygonPoints(newPoints);
      console.log("Started drag - added first point:", coords, "Point index:", newPoints.length - 1);
    };

    const handleMouseMove = (e) => {
      if (!isDragging || !dragStart || !imageLoaded || polygonClosed || isStreaming) {
        if (!polygonClosed && imageLoaded && !isStreaming) {
          canvas.style.cursor = 'crosshair';
        }
        return;
      }
      
      const coords = getCanvasCoords(e);
      
      // Update the last point (second point during drag)
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
      
      // Finalize the second point
      const updatedPoints = [...polygonPoints];
      updatedPoints[updatedPoints.length - 1] = coords;
      setPolygonPoints(updatedPoints);
      
      console.log("Drag ended - finalized second point:", coords, "Total points:", updatedPoints.length);
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
          const validPolygon = [...polygonPoints].map(p => ({ 
            x: Math.round(p.x), 
            y: Math.round(p.y) 
          }));
          setLastValidPolygon(validPolygon);
          console.log("Polygon closed with ALL points:", validPolygon);
          return;
        }
      }

      // Add new point
      const newPoints = [...polygonPoints, coords];
      setPolygonPoints(newPoints);
      console.log("Added point:", coords, "Point index:", newPoints.length - 1, "Total points:", newPoints.length);
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

  const clearCanvas = () => {
    setPolygonPoints([]);
    setPolygonClosed(false);
    setImageLoaded(false);
    setBackgroundImage(null);
    setLastValidPolygon(null); // Clear saved polygon too
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const undoLastPoint = () => {
    if (polygonClosed) {
      setPolygonClosed(false);
      console.log("Reopened polygon for editing");
    } else if (polygonPoints.length > 0) {
      const newPoints = polygonPoints.slice(0, -1);
      setPolygonPoints(newPoints);
      console.log("Removed last point, remaining:", newPoints.length);
    }
  };

  const stopStreamingAndReset = () => {
    console.log("Stopping streaming and resetting...");
    
    if (wsRef.current) {
      const currentState = wsRef.current.readyState;
      console.log("WebSocket state before close:", currentState);
      
      if (currentState === WebSocket.OPEN || currentState === WebSocket.CONNECTING) {
        wsRef.current.close(1000, "User stopped detection"); // Clean close
      }
      wsRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setIsStreaming(false);
    setConnectionStatus('disconnected');
    setCurrentFrame(null);
    setIntruderDetected(false);
  };

  const fetchBackendImage = async (command) => {
    try {
      stopStreamingAndReset();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      clearCanvas();

      const payload = { command };
      console.log("Fetching backend image with command:", command);
      
      const response = await fetch("http://localhost:8000/getIntrusionImage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Backend response success:", data.success);

      if (data.success && data.image) {
        const img = new Image();
        img.onload = () => {
          setBackgroundImage(img);
          setImageLoaded(true);
          console.log("Background image loaded successfully");
        };
        
        img.onerror = () => {
          console.error("Failed to load background image");
          alert("Failed to load the captured image");
        };
        
        const imageSource = data.image.startsWith('data:image')
          ? data.image
          : 'data:image/jpeg;base64,' + data.image;
        img.src = imageSource;
      } else {
        alert("Failed to load image: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error fetching image:", err);
      alert("Error fetching image: " + err.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert("Please upload only video files.");
      return;
    }

    stopStreamingAndReset();
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setUploadedFile(file);
    await fetchBackendImage("file");
  };

  const startIntrusionDetection = async () => {
    if (!isStreaming) {
      // Get polygon points - prioritize current drawing over saved
      let polygon = null;
      
      if (polygonClosed && polygonPoints.length >= 3) {
        polygon = [...polygonPoints]; // Use spread to ensure we get all points
        console.log("Using current polygon with", polygon.length, "points:");
        polygon.forEach((p, i) => console.log(`  Point ${i + 1}: (${p.x}, ${p.y})`));
      } else if (lastValidPolygon && lastValidPolygon.length >= 3) {
        polygon = [...lastValidPolygon]; // Use spread to ensure we get all points
        console.log("Using saved polygon with", polygon.length, "points:");
        polygon.forEach((p, i) => console.log(`  Point ${i + 1}: (${p.x}, ${p.y})`));
      }
      
      if (!polygon || polygon.length < 3) {
        alert("Please draw a closed polygon with at least 3 points before starting intrusion detection.");
        return;
      }
      
      console.log("Final polygon for detection:", polygon);
      console.log("First point (should be included):", polygon[0]);
      console.log("Last point:", polygon[polygon.length - 1]);
  
      try {
        // Clean up any existing connections first
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        
        // Wait for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Set connecting state immediately
        setConnectionStatus('connecting');
        setIsStreaming(true);
        
        const socket = new WebSocket("ws://localhost:8000/ws/intrusion");
        wsRef.current = socket;
        
        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          if (socket.readyState !== WebSocket.OPEN) {
            console.error("Connection timeout");
            socket.close();
            setConnectionStatus('error');
            setIsStreaming(false);
            alert("Connection timeout. Please try again.");
          }
        }, 10000); // 10 second timeout
    
        socket.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log("WebSocket connected, sending polygon data...");
          setConnectionStatus('connected');
          
          const socketData = { 
            polygon: polygon.map(p => ({ 
              x: Math.round(p.x), 
              y: Math.round(p.y) 
            }))
          };
          
          console.log("Sending polygon data:", socketData);
          
          try {
            socket.send(JSON.stringify(socketData));
          } catch (sendError) {
            console.error("Failed to send polygon data:", sendError);
            stopStreamingAndReset();
            alert("Failed to send polygon data to server.");
          }
        };
    
        socket.onmessage = (event) => {
          try {
            // Handle text messages (errors and status)
            if (typeof event.data === 'string' && !event.data.startsWith('{')) {
              console.log("Server message:", event.data);
              
              // Handle ready message
              if (event.data === 'STREAM_READY') {
                console.log("Stream is ready to receive frames");
                return;
              }
              
              // Handle errors
              if (event.data.includes('ERROR') || event.data.includes('INVALID')) {
                alert("Error: " + event.data);
                stopStreamingAndReset();
                return;
              }
              
              // Handle stream end messages
              if (event.data === 'VIDEO_ENDED' || event.data === 'STREAM_ENDED') {
                console.log("Stream ended by server");
                stopStreamingAndReset();
                return;
              }
              
              // Handle timeout
              if (event.data.includes('TIMEOUT')) {
                alert("Connection timed out. Please try again.");
                stopStreamingAndReset();
                return;
              }
              
              return;
            }

            const data = JSON.parse(event.data);
    
            if (data?.frame) {
              setCurrentFrame(`data:image/jpeg;base64,${data.frame}`);
              setIntruderDetected(data.intruder || false);
              
              if (data.intruder) {
                console.log("🚨 Intruder detected");
              }
            }
    
          } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
          }
        };
    
        socket.onerror = (err) => {
          clearTimeout(connectionTimeout);
          console.error("WebSocket error:", err);
          setConnectionStatus('error');
          setIsStreaming(false);
          
          // Don't show alert if user manually stopped
          if (connectionStatus !== 'disconnected') {
            alert("WebSocket connection error. Please check if the backend server is running on port 8000.");
          }
        };
    
        socket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log("WebSocket closed:", event.code, event.reason);
          
          // Only show error if it wasn't a clean close
          if (event.code !== 1000 && event.code !== 1001 && connectionStatus !== 'disconnected') {
            console.error("WebSocket closed unexpectedly:", event.code, event.reason);
            if (isStreaming) {
              alert("Connection lost unexpectedly. Please try again.");
            }
          }
          
          setConnectionStatus('disconnected');
          setIsStreaming(false);
          setCurrentFrame(null);
        };
        
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        setConnectionStatus('error');
        setIsStreaming(false);
        alert("Failed to connect to the server. Please check if the backend is running on port 8000.");
      }
  
    } else {
      stopStreamingAndReset();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreamingAndReset();
    };
  }, []);

  return (
    <div id="Intrusion" className="relative mt-20 min-h-[800px]">
      <div className="text-center">
        <h2 className="text-3xl sm:text-5xl lg:text-4xl mt-10 lg:mt-20 tracking-wide">
          Live{" "}
          <span className="bg-gradient-to-r from-[#05EEFA] to-[#003D40] text-transparent bg-clip-text">
            Intrusion Detection
          </span>
        </h2>
        <p className="text-neutral-400 text-lg mt-4 max-w-3xl mx-auto">
          Click to place points and form security zones. Monitor for unauthorized intrusions in real-time using advanced AI detection
        </p>
      </div>

      {/* Security Zone Setup Controls */}
      <div className="mt-8 w-full max-w-6xl mx-auto">
        <div className="group border border-neutral-700 rounded-2xl p-4 hover:border-[#05EEFA]/50 transition duration-300 shadow-md bg-neutral-900">
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-10 w-10 p-2 bg-[#1a1a1a] text-[#05EEFA] justify-center items-center rounded-full flex-shrink-0 group-hover:bg-[#05EEFA]/10 transition-colors duration-300">
              <Shield size={20} />
            </div>
            <h5 className="text-xl font-semibold group-hover:text-[#05EEFA] transition-colors duration-300">
              Security Zone Setup
            </h5>
            
            {/* Connection Status - Enhanced */}
            <div className="text-sm ml-auto hidden lg:block">
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
                    ? '⚠️ INTRUDER DETECTED' 
                    : 'Detection Active'
                  : 'Ready'
                }
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            
            <div className="flex gap-3 flex-wrap">
              <button
                className="px-4 py-2 flex items-center justify-center gap-2 bg-gradient-to-r from-[#05EEFA] to-[#003D40] hover:from-[#05EEFA]/80 hover:to-[#003D40]/80 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => fetchBackendImage("webcam")}
                disabled={isStreaming}
              >
                <Tv size={18} />
                Start Webcam
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
            </div>

            {imageLoaded && !isStreaming && (
              <div className="flex gap-3">
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
              </div>
            )}

            {(imageLoaded || lastValidPolygon) && (
              <button
                onClick={startIntrusionDetection}
                className={`px-4 py-2 flex items-center justify-center gap-2 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105 ml-auto ${
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

          {/* Enhanced status indicators */}
          <div className="text-neutral-400 text-xs mt-3 flex justify-between">
            <div className="lg:hidden">
              <span className="text-[#05EEFA] font-semibold">Instructions:</span> Start webcam/video → Draw polygon → Start detection
            </div>
          </div>
        </div>
      </div>

      {/* Large Video Display Area */}
      <div className="mt-8 w-full flex justify-center">
        <div className="relative">
          
          {/* Canvas for Drawing (only when not streaming) */}
          <canvas
            ref={canvasRef}
            width={TARGET_VIDEO_WIDTH}
            height={TARGET_VIDEO_HEIGHT}
            className={`border-2 border-[#05EEFA] bg-black rounded-lg shadow-2xl cursor-crosshair transition-all duration-300 ${
              (!isStreaming && imageLoaded) ? "block" : "hidden"
            }`}
            style={{
              maxWidth: "100%",
              height: "auto",
              aspectRatio: `${TARGET_VIDEO_WIDTH} / ${TARGET_VIDEO_HEIGHT}`
            }}
          />

          {/* Live Stream Display */}
          {isStreaming && currentFrame && (
            <div className={`relative rounded-lg overflow-hidden shadow-2xl bg-black border-2 transition-all duration-300 ${
              intruderDetected ? 'border-red-500 shadow-red-500/50' : 'border-[#05EEFA]'
            }`}
                 style={{
                   maxWidth: "100%",
                   aspectRatio: `${TARGET_VIDEO_WIDTH} / ${TARGET_VIDEO_HEIGHT}`
                 }}>
              <img
                src={currentFrame}
                className="w-full h-full object-contain"
                alt="Live Detection Stream"
                onError={(e) => {
                  console.error("Image load error:", e);
                  e.target.style.display = 'none';
                }}
              />
              
              {/* Enhanced detection status */}
              <div className="absolute bottom-4 left-4 px-4 py-2 rounded-lg text-sm backdrop-blur-sm bg-black/80 text-white">
                <div className="flex items-center gap-2">
                  <Shield size={16} className={intruderDetected ? "text-red-400" : "text-[#05EEFA]"} />
                  <span className={intruderDetected ? "text-red-300 font-bold" : "text-white"}>
                    {intruderDetected ? "⚠️ INTRUDER DETECTED!" : "Security Monitoring Active"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loading/Connecting State */}
          {isStreaming && !currentFrame && (
            <div className="border-2 border-[#05EEFA] bg-neutral-900 rounded-lg flex items-center justify-center shadow-2xl"
                 style={{
                   width: "100%",
                   maxWidth: "1280px",
                   aspectRatio: `${TARGET_VIDEO_WIDTH} / ${TARGET_VIDEO_HEIGHT}`,
                   minHeight: "400px"
                 }}>
              <div className="text-center p-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#05EEFA] mx-auto mb-4"></div>
                <h3 className="text-neutral-300 text-xl font-semibold mb-2">
                  Starting Detection...
                </h3>
                <p className="text-neutral-500">Initializing AI detection system</p>
              </div>
            </div>
          )}
          
          {/* Placeholder */}
          {(!imageLoaded && !isStreaming) && (
            <div className="border-2 border-neutral-700 bg-neutral-900 rounded-lg flex items-center justify-center shadow-2xl"
                 style={{
                   width: "100%",
                   maxWidth: "1280px",
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

          {/* Enhanced Drawing Instructions */}
          {imageLoaded && !isStreaming && (
            <div className="absolute bottom-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  polygonPoints.length === 0 ? 'bg-[#05EEFA]' :
                  polygonPoints.length < 3 ? 'bg-yellow-400' :
                  !polygonClosed ? 'bg-orange-400' : 'bg-green-400'
                }`}></div>
                {polygonPoints.length === 0 ? "Click and drag to place first line, or click to place single points" : 
                 polygonPoints.length < 3 ? `Point ${polygonPoints.length} placed - need ${3 - polygonPoints.length} more to close` :
                 !polygonClosed ? "Click near FIRST point (large gold circle) to close polygon" : "✓ Security zone complete - All points from first to last included"}
              </div>
            </div>
          )}
          
          {/* Saved polygon indicator */}
          {!imageLoaded && !isStreaming && lastValidPolygon && (
            <div className="absolute bottom-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                ✓ Saved security zone available
              </div>
            </div>
          )}

          {/* Enhanced Drawing Guide */}
          {imageLoaded && !isStreaming && polygonPoints.length === 0 && (
            <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm max-w-xs">
              <div className="text-xs">
                <p className="text-[#05EEFA] font-semibold mb-1">How to draw security zone:</p>
                <p>1. Click + drag to draw lines OR click for single points</p>
                <p>2. Click near the first (gold) point to close</p>
                <p>3. Start detection to monitor intrusions</p>
                <p className="text-yellow-300 mt-1">💡 Points snap to grid for precision</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntrusionDetectionSection;