
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Bounce, toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function Home() {

  const allowed_types:string[] = ["image/png", "image/jpeg", "image/jpg"];
  const MAX_FILES:number = 4;

  const [dropBorder, setDropBorder]= useState<string>("");
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null); 

  useEffect(() => {

    if ( error !== null ) {
      toast.error(error, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
    }

    return () => {
      // on unmount
      if (previewImages.length > 0) {
        previewImages.forEach( previewImages => URL.revokeObjectURL(previewImages));
      }
    };

  }, [error]);

  function dropHandler(ev: any) {
    console.log("File(s) dropped");
    ev.preventDefault();

    setDropBorder("");

    const newPreviewImages: string[] = []; 

    if (ev.dataTransfer.items) {
      for (const item of ev.dataTransfer.items) {
        if (item.kind === 'file') {
          if (allowed_types.indexOf(item.type) === -1) {
            setError("Format must be JPEG or PNG")
          } else {
            const file = item.getAsFile();
            console.log("file : ", file);

            if (file) {
              newPreviewImages.push(URL.createObjectURL(file));
            }
          }
        }
      }
    }


    // Update the state once with all new images
    setPreviewImages((prevImages) => {
      if ( prevImages.length + newPreviewImages.length > MAX_FILES) { 
        setError(`Maximum ${MAX_FILES} reached`);
        return prevImages;
      }
      return [...prevImages, ...newPreviewImages]
    });

  }

  function handleDragOver(event: any) {
    event.preventDefault();
    setDropBorder("border-4 border-dashed border-white");
    console.log("DRAG OVER");
  }

  function handleDragLeave(event: any) {
    event.preventDefault();

    if ( previewImages.length === 0) {
      setDropBorder("");
    }
  }


  function removeItem(index:number) {
    setPreviewImages((prevImages) => {
      const newImages = [...prevImages];
      newImages.splice(index, 1);
      return newImages;
    });
  }

  return (

    <div className={`h-screen bg-gradient-to-r from-fuchsia-500 to-cyan-500 flex justify-center items-center ${dropBorder}`}
      onDrop={dropHandler}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}>

      <ToastContainer />
      <div className={`flex items-center justify-center p-6 rounded 
                        text-center h-96`}>

        {
          previewImages.length <= 0 && <p className="text-5xl font-extrabold leading-tight text-black">Drop your images</p>
        }
        

        
        { previewImages.length > 0 &&
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {previewImages.map( (previewImage, index) => (
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg shadow-lg p-4">
              <div className="absolute top-0 right-4">
                <button 
                  onClick={() => {
                    removeItem(index);
                  }}
                  className="flex items-center justify-center bg-slate-700 rounded-full w-10 h-10 hover:bg-slate-900 transition duration-100 ease-in-out focus:outline-none">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6 text-white" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <img 
                src={previewImage} 
                alt="preview"
                className="w-32 h-32 md:w-64 md:h-64 mx-2"
                />
              </div>
            ))}

        </div>
        }

      </div>
    </div>
  );

}

export default Home;

