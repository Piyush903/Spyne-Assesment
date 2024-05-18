import background from "./background.png";
import Image from "next/image";
export default function Home({ children }) {
  return (
  <>
    <nav className="bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg p-4 fixed w-full z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold text-gray-800">
          <a href="#">Video Caption Generator</a>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-gray-800">
            <a href="#" className="hover:text-blue-600">Home</a>
          </div>
          <div className="text-gray-800">
            <a href="#" className="hover:text-blue-600">About</a>
          </div>
          <div className="text-gray-800">
            <a href="#" className="hover:text-blue-600">Contact</a>
          </div>
        </div>
      </div>
    </nav>
    <div className="absolute inset-0 z-0">
      <Image
        src={background}
        alt="3D Background"
        className="object-cover w-full h-full"
      />
    </div>
    <main className=" relative z-2">{children}</main>
    
  </>
  );
}
