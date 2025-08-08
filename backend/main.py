import os
import random
import cv2
import numpy as np
import asyncio
import base64
import json
import subprocess
import time
from PIL import Image
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from shapely.geometry import Point, Polygon
from ultralytics import YOLO

app = FastAPI()

intrusion_video_capture = None

# Standard dimensions
TARGET_WIDTH = 1280
TARGET_HEIGHT = 720

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File picker for video files
def browse_video_file():
    result = subprocess.run(
        [
            "zenity", "--file-selection",
            "--title=Select a Video File",
            "--file-filter=Videos | *.mp4 *.avi *.mov *.mkv *.flv *.webm"
        ],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        return result.stdout.strip()
    return None

# Schema for post request
class GetIntrusionImageRequest(BaseModel):
    command: str

# Endpoint to get first frame image
@app.post("/getIntrusionImage")
async def get_intrusion_image(request: GetIntrusionImageRequest):
    command = request.command.strip()
    global intrusion_video_capture

    if command == "webcam":
        intrusion_video_capture = 0
    elif command == "file":
        file_path = browse_video_file()
        if file_path:
            intrusion_video_capture = file_path
        else:
            return {
                "success": False,
                "message": "No file selected",
                "image": None
            }
    else:
        return {
            "success": False,
            "message": "Invalid input",
            "image": None
        }

    cap = None
    try:
        cap = cv2.VideoCapture(intrusion_video_capture)
        
        # Set camera properties before reading
        if intrusion_video_capture == 0:  # webcam
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, TARGET_WIDTH)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, TARGET_HEIGHT)
            cap.set(cv2.CAP_PROP_FPS, 30)
            # Give webcam time to initialize
            time.sleep(1)

        if not cap.isOpened():
            return {
                "success": False,
                "message": f"Could not open video source: {intrusion_video_capture}",
                "image": None
            }

        # Read a few frames for webcam to stabilize
        for _ in range(3):
            ret, frame = cap.read()
            if not ret:
                break

        if not ret:
            return {
                "success": False,
                "message": "Could not read frame from video source",
                "image": None
            }

        # Ensure frame is the right size
        frame = cv2.resize(frame, (TARGET_WIDTH, TARGET_HEIGHT))

        # Encode with better quality
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 95]
        _, buffer = cv2.imencode('.jpg', frame, encode_param)
        img_bytes = buffer.tobytes()
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        img_base64_str = f"data:image/jpeg;base64,{img_base64}"

        return {
            "success": True,
            "image": img_base64_str,
            "message": "Image sent successfully",
        }

    except Exception as e:
        return {
            "success": False,
            "image": None,
            "message": f"Error processing image: {str(e)}"
        }
    finally:
        if cap is not None:
            cap.release()

# Utility to draw bounding box
def draw_bbox(frame, bbox, color=(0, 255, 0), thickness=2):
    x1, y1, x2, y2 = map(int, bbox)
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)
    return frame

# WebSocket endpoint for intrusion detection
@app.websocket("/ws/intrusion")
async def intrusion_websocket(websocket: WebSocket):
    await websocket.accept()
    global intrusion_video_capture
    
    print(f"WebSocket connected. Video source: {intrusion_video_capture}")
    
    # CRITICAL FIX: Validate video source immediately
    if intrusion_video_capture is None:
        await websocket.send_text("ERROR: No video source available. Please start webcam or upload video first.")
        await websocket.close()
        return

    try:
        while True:
            try:
                # Wait for polygon data with timeout
                message = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                print(f"Received message: {message}")

                data = json.loads(message)
                raw_polygon = data.get("polygon", [])
                print(f'Raw polygon received: {raw_polygon}')

                # Validate and convert polygon points
                polygon_points = []
                for i, point in enumerate(raw_polygon):
                    if isinstance(point, dict) and "x" in point and "y" in point:
                        # Ensure coordinates are within frame bounds
                        x = max(0, min(TARGET_WIDTH - 1, int(float(point["x"]))))
                        y = max(0, min(TARGET_HEIGHT - 1, int(float(point["y"]))))
                        polygon_points.append((x, y))
                        print(f'Point {i+1}: ({x}, {y})')
                    else:
                        print(f"Invalid point format: {point}")

                print(f'Final polygon points: {polygon_points}')

                if len(polygon_points) < 3:
                    error_msg = f"INVALID_POLYGON: Need at least 3 points, got {len(polygon_points)}"
                    await websocket.send_text(error_msg)
                    continue

                # CRITICAL FIX: Test video capture before starting stream
                test_cap = cv2.VideoCapture(intrusion_video_capture)
                if not test_cap.isOpened():
                    test_cap.release()
                    await websocket.send_text(f"ERROR: Cannot open video source: {intrusion_video_capture}")
                    continue
                    
                # Test if we can read a frame
                ret, test_frame = test_cap.read()
                test_cap.release()
                
                if not ret:
                    await websocket.send_text(f"ERROR: Cannot read from video source: {intrusion_video_capture}")
                    continue
                
                print("Video source validated successfully")

                # Start streaming with validated video source
                try:
                    await stream_intrusion_frames(websocket, intrusion_video_capture, polygon_points)
                except Exception as e:
                    print(f"Stream error: {e}")
                    await websocket.send_text(f"STREAM_ERROR: {str(e)}")
                    break

            except asyncio.TimeoutError:
                print("WebSocket message timeout")
                await websocket.send_text("TIMEOUT: No message received within 30 seconds")
                break
            except json.JSONDecodeError as e:
                await websocket.send_text(f"INVALID_JSON: {str(e)}")
                continue
            except Exception as e:
                print(f"Message processing error: {e}")
                await websocket.send_text(f"PROCESSING_ERROR: {str(e)}")
                continue

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")

# Streaming frames with detection
async def stream_intrusion_frames(websocket, video_source, polygon_points):
    print(f"Starting stream with video source: {video_source}")
    
    # Create polygon
    try:
        polygon = Polygon(polygon_points)
        print(f"Created polygon with {len(polygon_points)} points")
    except Exception as e:
        print(f"Failed to create polygon: {e}")
        await websocket.send_text(f"POLYGON_ERROR: {str(e)}")
        return

    # Initialize video capture with retry mechanism
    cap = None
    max_retries = 3
    
    for attempt in range(max_retries):
        print(f"Video capture attempt {attempt + 1}/{max_retries}")
        
        cap = cv2.VideoCapture(video_source)
        
        if not cap.isOpened():
            print(f"Attempt {attempt + 1}: Failed to open video source")
            if cap:
                cap.release()
            if attempt < max_retries - 1:
                await asyncio.sleep(1)  # Wait 1 second before retry
                continue
            else:
                error_msg = f"Failed to open video source after {max_retries} attempts: {video_source}"
                print(error_msg)
                await websocket.send_text(f"VIDEO_ERROR: {error_msg}")
                return

        # Set video properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, TARGET_WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, TARGET_HEIGHT)
        
        # For webcam, set additional properties
        if video_source == 0:
            cap.set(cv2.CAP_PROP_FPS, 30)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Reduce buffer to minimize latency
            # Give webcam time to initialize
            await asyncio.sleep(2)

        # Test if we can read frames
        ret, test_frame = cap.read()
        if ret:
            print(f"Video capture successful on attempt {attempt + 1}")
            break
        else:
            print(f"Attempt {attempt + 1}: Cannot read frame from video source")
            cap.release()
            if attempt < max_retries - 1:
                await asyncio.sleep(1)
                continue
            else:
                await websocket.send_text("VIDEO_ERROR: Cannot read frames from video source")
                return

    # Load YOLO model
    try:
        model = YOLO("yolo11n.pt")
        print("YOLO model loaded successfully")
    except Exception as e:
        print(f"Failed to load YOLO model: {e}")
        cap.release()
        await websocket.send_text(f"MODEL_ERROR: {str(e)}")
        return

    frame_count = 0
    last_frame_time = time.time()
    
    # Send initial ready message
    await websocket.send_text("STREAM_READY")
    
    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                print("Failed to read frame or end of video")
                if video_source != 0:  # For video files, this means end of video
                    await websocket.send_text("VIDEO_ENDED")
                break

            # Control frame rate for better performance
            current_time = time.time()
            if current_time - last_frame_time < 1/30:  # Limit to ~30 FPS
                await asyncio.sleep(0.01)
                continue
            last_frame_time = current_time

            # Resize frame to ensure consistent dimensions
            frame = cv2.resize(frame, (TARGET_WIDTH, TARGET_HEIGHT))

            # Check WebSocket connection status
            if websocket.client_state.value != 1:  # 1 = CONNECTED
                print("WebSocket connection lost during streaming")
                break

            # Draw polygon on frame FIRST (so it appears behind detections)
            try:
                pts = np.array(polygon_points, np.int32).reshape((-1, 1, 2))
                
                # Draw polygon outline in bright cyan (BGR format)
                cv2.polylines(frame, [pts], isClosed=True, color=(255, 255, 0), thickness=4)  # Bright cyan
                
                # Fill polygon with semi-transparent cyan
                overlay = frame.copy()
                cv2.fillPoly(overlay, [pts], (255, 255, 0))  # Cyan fill
                cv2.addWeighted(overlay, 0.2, frame, 0.8, 0, frame)
                
                # Draw corner points for better visibility
                for point in polygon_points:
                    cv2.circle(frame, (int(point[0]), int(point[1])), 6, (0, 255, 255), -1)  # Yellow dots
                    cv2.circle(frame, (int(point[0]), int(point[1])), 6, (0, 0, 0), 2)  # Black border
                
            except Exception as poly_error:
                print(f"Error drawing polygon: {poly_error}")

            try:
                # Run YOLO detection with error handling
                results = model(frame, verbose=False)[0]
                intruder_detected = False

                # Process detections
                if hasattr(results, 'boxes') and results.boxes is not None and len(results.boxes) > 0:
                    for box in results.boxes:
                        try:
                            cls_id = int(box.cls.item())
                            confidence = float(box.conf.item())
                            
                            # Only process person class (class 0) with good confidence
                            if cls_id != 0 or confidence < 0.5:
                                continue

                            x1, y1, x2, y2 = box.xyxy[0].tolist()
                            
                            # Calculate center point and bottom center for better detection
                            cx = (x1 + x2) / 2
                            cy = (y1 + y2) / 2
                            # Also check bottom center (feet) for more accurate detection
                            bottom_center = Point(cx, y2)
                            center_point = Point(cx, cy)

                            # Check if person is inside polygon (check both center and bottom)
                            is_inside = polygon.contains(center_point) or polygon.contains(bottom_center)
                            
                            if is_inside:
                                intruder_detected = True
                                print(f"INTRUDER DETECTED at center: ({cx:.1f}, {cy:.1f}), bottom: ({cx:.1f}, {y2:.1f})")
                                # Draw red bounding box for intruders
                                cv2.putText(
                                    frame,
                                    f"INTRUDER! ({confidence:.2f})",
                                    org=(int(x1), int(y1)-10),
                                    fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                                    fontScale=0.8,
                                    color=(0, 0, 255),
                                    thickness=2
                                )
                                draw_bbox(frame, [x1, y1, x2, y2], (0, 0, 255), 4)
                                
                                # Add alert icon at center
                                cv2.circle(frame, (int(cx), int(cy)), 10, (0, 0, 255), -1)
                                cv2.putText(frame, "!", (int(cx)-5, int(cy)+6), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                                
                                # Draw detection points for debugging
                                cv2.circle(frame, (int(cx), int(cy)), 3, (255, 0, 255), -1)  # Magenta for center
                                cv2.circle(frame, (int(cx), int(y2)), 3, (255, 255, 0), -1)  # Cyan for bottom
                                
                            else:
                                print(f"Person OUTSIDE polygon at center: ({cx:.1f}, {cy:.1f}), bottom: ({cx:.1f}, {y2:.1f})")
                                # Draw green bounding box for persons outside zone
                                draw_bbox(frame, [x1, y1, x2, y2], (0, 255, 0), 2)
                                cv2.putText(
                                    frame,
                                    f"Person ({confidence:.2f})",
                                    org=(int(x1), int(y1)-10),
                                    fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                                    fontScale=0.6,
                                    color=(0, 255, 0),
                                    thickness=2
                                )
                                
                                # Show detection points for debugging
                                cv2.circle(frame, (int(cx), int(cy)), 3, (0, 255, 0), -1)  # Green for center
                                cv2.circle(frame, (int(cx), int(y2)), 3, (0, 255, 0), -1)  # Green for bottom
                        except Exception as box_error:
                            print(f"Error processing detection box: {box_error}")
                            continue

            except Exception as e:
                print(f"Detection error: {e}")
                # Continue without detection if there's an error

            # Encode frame with optimized settings
            try:
                encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 85]  # Balanced quality/size
                _, jpeg = cv2.imencode('.jpg', frame, encode_param)
                frame_b64 = base64.b64encode(jpeg.tobytes()).decode('utf-8')

                # Send frame data
                frame_data = {
                    "frame": frame_b64,
                    "intruder": intruder_detected,
                    "frame_count": frame_count
                }
                
                await websocket.send_json(frame_data)
                frame_count += 1

                # Adaptive delay based on processing time
                processing_time = time.time() - current_time
                target_delay = max(0.033 - processing_time, 0.01)  # Target ~30 FPS
                await asyncio.sleep(target_delay)

            except Exception as e:
                print(f"Frame encoding/sending error: {e}")
                break

    except Exception as e:
        print(f"Streaming error: {e}")
        await websocket.send_text(f"STREAM_ERROR: {str(e)}")
    finally:
        print("Releasing video capture")
        if cap:
            cap.release()
        try:
            await websocket.send_text("STREAM_ENDED")
        except:
            pass  # WebSocket might already be closed

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Intrusion detection server is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)