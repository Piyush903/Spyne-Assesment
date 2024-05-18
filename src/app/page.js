"use client";
import Home from "./pagelayout";
import {useRouter} from "next/navigation";
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
export default function Indexpage({ children }){
    const router = useRouter();
    const [videoUrl, setVideoUrl] = useState("");
    const handleSubmit = (e) => {
        e.preventDefault();
        if (videoUrl) {
          const uuid = uuidv4();
          // Navigate to the new page with the UUID as the path
          router.push(`/${[uuid]}?url=${videoUrl }`);
        }
      };
    return(
<Home>
<div className="min-h-screen flex items-center justify-center">
      <div className="max-w-lg bg-white bg-opacity-80 p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Generate Video Captions</h2>
        <p className="text-gray-700 mb-6">Enter the URL of your video below to generate captions:</p>
        <form onSubmit={handleSubmit} method="post" className="mb-6">
        <input
              type="text"
              name="video-url"
              id="video-url"
              placeholder="Enter Video URL"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              required
            />
          <button type="submit"
          
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg mt-4 focus:outline-none focus:bg-blue-600">Generate
            Caption</button>
        </form>
        <p className="text-sm text-gray-600">Don't have a video? <a href="#" className="text-blue-500">Try one
            here</a>.</p>
      </div>
    </div>
</Home>
    )
}