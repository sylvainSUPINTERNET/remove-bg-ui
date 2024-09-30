
"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import Image from "next/image";
import {useDroppable} from '@dnd-kit/core';
import { useEffect, useState } from "react";
import { Bounce, toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function Home() {


  const [dropBorder, setDropBorder]= useState("");
  const allowed_types = ["image/png", "image/jpeg", "image/jpg"];

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
      if ( prevImages.length + newPreviewImages.length > 2) { 
        setError("Maximum 2 images reached");
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

  return (

    <div className={`h-screen bg-gradient-to-r from-fuchsia-500 to-cyan-500 flex justify-center items-center ${dropBorder}`}
    onDrop={dropHandler}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}>
      <ToastContainer />
      <div className={`flex items-center justify-center p-6 rounded 
                        text-center text-5xl font-extrabold leading-tight h-96`}>
        
        {
          previewImages.length
        }
        
        <p>Drag one or more files to this <i>drop zone</i>.</p>

        {
          previewImages.map( (previewImage, index) => (
            <div key={index} className="relative w-32 h-32 mx-2">
              <div className="bg-red-500 h-96">
                <Image src={previewImage} layout="fill" objectFit="cover" alt="upload"/>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );

}

export default Home;

