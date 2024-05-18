"use client";
import { useEffect, useReducer, useState, useRef } from "react";
import { fetchFile } from "@ffmpeg/util";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import AnimatedButton from "../Animatedbtn";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

const time = {
  toHHMMSS: (seconds) => {
    return {
      hours: Math.floor(seconds / 3600),
      minutes: Math.floor((seconds % 3600) / 60),
      seconds: Math.floor((seconds % 3600) % 60),
    };
  },
  toSeconds: (time) => {
    return time.hours * 3600 + time.minutes * 60 + time.seconds;
  },
};

const timeActionTypes = {
  SET_TIME: "SET_TIME",
  CHANGE_HOURS: "CHANGE_HOURS",
  CHANGE_MINUTES: "CHANGE_MINUTES",
  CHANGE_SECONDS: "CHANGE_SECONDS",
};

export default function Controlls() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const [videoUrl, setVideoUrl] = useState(null);
  const videoRef = useRef(null);
  const messageRef = useRef(null);
  const ffmpegRef = useRef(new FFmpeg());
  const [isConverting, setIsConverting] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [captionSegments, setCaptionSegments] = useState([
    {
      id: uuidv4(),
      startTime: { hours: 0, minutes: 0, seconds: 0 },
      endTime: { hours: 0, minutes: 0, seconds: 0 },
      caption: "",
    },
  ]);

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    const ffmpeg = ffmpegRef.current;

    ffmpeg.on("log", ({ message }) => {
      messageRef.current.innerHTML = message;
      console.log(message);
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    setReady(true);
  };

  useEffect(() => {
    const checkFFmpegAndUrl = async () => {
      if (!ffmpegRef.current) {
        await load();
        setTimeout(() => {
          setLoading(false);
        }, 3000);
      }

      if (url) {
        setVideoUrl(url);
        setLoading(false);
      }
    };

    checkFFmpegAndUrl();
  }, [url]);

  const handleAddSegment = () => {
    setCaptionSegments([
      ...captionSegments,
      {
        id: uuidv4(),
        startTime: { hours: 0, minutes: 0, seconds: 0 },
        endTime: { hours: 0, minutes: 0, seconds: 0 },
        caption: "",
      },
    ]);
  };

  const handleChangeSegment = (id, field, value) => {
    const updatedSegments = captionSegments.map((segment) => {
      if (segment.id === id) {
        return { ...segment, [field]: value };
      }
      return segment;
    });

    setCaptionSegments(updatedSegments);
  };

  const handleTimeChange = (id, timeType, field, value) => {
    const updatedSegments = captionSegments.map((segment) => {
      if (segment.id === id) {
        return {
          ...segment,
          [timeType]: { ...segment[timeType], [field]: parseInt(value) },
        };
      }
      return segment;
    });

    setCaptionSegments(updatedSegments);
  };

  const validateNoOverlap = (segments) => {
    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const aStart = time.toSeconds(segments[i].startTime);
        const aEnd = time.toSeconds(segments[i].endTime);
        const bStart = time.toSeconds(segments[j].startTime);
        const bEnd = time.toSeconds(segments[j].endTime);

        if ((aStart < bEnd && aEnd > bStart) || (bStart < aEnd && bEnd > aStart)) {
          return false;
        }
      }
    }
    return true;
  };

  const convert = async (e) => {
    e.preventDefault();

    if (!validateNoOverlap(captionSegments)) {
      alert("Timestamps overlap. Please adjust the start and end times.");
      return;
    }

    setIsConverting(true);
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile("input.mp4", await fetchFile(videoUrl));

    for (const segment of captionSegments) {
      const startSeconds = time.toSeconds(segment.startTime);
      const endSeconds = time.toSeconds(segment.endTime);
      const captionText = segment.caption
        ? `drawtext=text='${segment.caption}':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=h-th-10`
        : "";

      await ffmpeg.exec([
        "-i",
        "input.mp4",
        "-vf",
        captionText,
        "-ss",
        `${startSeconds}`,
        "-to",
        `${endSeconds}`,
        `${segment.id}.mp4`,
      ]);

      const data = await ffmpeg.readFile(`${segment.id}.mp4`);
      const videoUrl = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));

      // Handle the generated video URL for each segment
      console.log(`Generated video URL for segment ${segment.id}: ${videoUrl}`);
    }

    setIsConverting(false);
  };

  useEffect(() => {

    if (videoRef.current) {
      const handleLoadedMetadata = () => {
        const duration = videoRef.current.duration;
        setCaptionSegments((segments) =>
          segments.map((segment) => ({
            ...segment,
            endTime: { ...segment.endTime, seconds: Math.floor(duration) },
          }))
        );
        setVisible(true);
      };

      videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener("loadedmetadata", handleLoadedMetadata);
        }
      };
    }
  }, [videoUrl]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <form
      className={`${
        visible ? "opacity-100 pointer-events-auto" : "pointer-events-none"
      } transition duration-500 ease-in-out max-w-3xl mx-auto border bg-gray-100 flex flex-col justify-between items-center p-4`}
      onSubmit={convert}
    >
      <video ref={videoRef} controls className="w-full h-3/4" src={videoUrl} type="video/mp4">
       
      </video>

      {captionSegments.map((segment, index) => (
        <div key={segment.id}>
          <div className="flex items-center font-bold text-gray-700 mb-2">
            <span className="w-24 text-right mr-2">Start Time {index + 1}:</span>
            <span className="flex items-center">
              <input
                type="number"
                value={segment.startTime.hours}
                min="0"
                max="23"
                onChange={(e) => handleTimeChange(segment.id, "startTime", "hours", e.target.value)}
                required
                className="border bg-white text-gray-700 rounded px-2 py-1 w-14"
              />
              <span className="mx-2">:</span>
              <input
                type="number"
                value={segment.startTime.minutes}
                min="0"
                max="59"
                onChange={(e) => handleTimeChange(segment.id, "startTime", "minutes", e.target.value)}
                required
                className="border bg-white text-gray-700 rounded px-2 py-1 w-14"
              />
              <span className="mx-2">:</span>
              <input
                type="number"
                value={segment.startTime.seconds}
                min="0"
                max="59"
                onChange={(e) => handleTimeChange(segment.id, "startTime", "seconds", e.target.value)}
                required
                className="border bg-white text-gray-700 rounded px-2 py-1 w-14"
              />
            </span>
          </div>

          <div className="flex items-center font-bold text-gray-700 mb-2">
            <span className="w-24 text-right mr-2">End Time {index + 1}:</span>
            <span className="flex items-center">
              <input
                type="number"
                value={segment.endTime.hours}
                min={segment.startTime.hours}
                max="23"
                onChange={(e) => handleTimeChange(segment.id, "endTime", "hours", e.target.value)}
                required
                className="border bg-white text-gray-700 rounded px-2 py-1 w-14"
              />
              <span className="mx-2">:</span>
              <input
                type="number"
                value={segment.endTime.minutes}
                min={segment.startTime.minutes}
                max="59"
                onChange={(e) => handleTimeChange(segment.id, "endTime", "minutes", e.target.value)}
                required
                className="border bg-white text-gray-700 rounded px-2 py-1 w-14"
              />
              <span className="mx-2">:</span>
              <input
                type="number"
                value={segment.endTime.seconds}
                min={segment.startTime.seconds}
                max="59"
                onChange={(e) => handleTimeChange(segment.id, "endTime", "seconds", e.target.value)}
                required
                className="border bg-white text-gray-700 rounded px-2 py-1 w-14"
              />
            </span>
          </div>

          <input
            type="text"
            placeholder={`Enter caption ${index + 1}`}
            value={segment.caption}
            onChange={(e) => handleChangeSegment(segment.id, "caption", e.target.value)}
            className="border bg-white text-gray-700 rounded px-2 py-1 w-full mb-4"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddSegment}
        className="mt-4 bg-white text-gray-700 border border-gray-300 rounded px-4 py-2 hover:bg-gray-300"
      >
        Add Another Caption
      </button>

      <AnimatedButton
        loading={isConverting || !ready}
        text="Convert"
        loadingText={!ready ? "Loading ffmpeg" : "Converting..."}
      />
    </form>
  );
}
