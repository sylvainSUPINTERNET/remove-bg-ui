
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

  useEffect(() => {
    return () => {
      if (previewImages.length > 0) {
        previewImages.forEach( previewImages => URL.revokeObjectURL(previewImages));
      }
    };
  });

  function dropHandler(ev: any) {
    console.log("File(s) dropped");
    ev.preventDefault();

    setDropBorder("");

    const newPreviewImages: string[] = []; 

    if (ev.dataTransfer.items) {
      for (const item of ev.dataTransfer.items) {
        if (item.kind === 'file') {
          if (allowed_types.indexOf(item.type) === -1) {
            toast.error('Format must be JPEG or PNG', {
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
    setPreviewImages((prevImages) => [...prevImages, ...newPreviewImages]);
  }

  function handleDragOver(event: any) {
    event.preventDefault();
    setDropBorder("border-4 border-dashed border-white");
    console.log("DRAG OVER");
  }

  return (

    <div className={`h-screen bg-gradient-to-r from-fuchsia-500 to-cyan-500 flex justify-center items-center`}>
      <ToastContainer />
      <div className={`flex items-center justify-center p-6 rounded font-mono font-bold text-xl text-center md:text-4xl ${dropBorder} h-96`}  onDrop={dropHandler} onDragOver={handleDragOver}>
        
        
        <p>Drag one or more files to this <i>drop zone</i>.</p>

        {
          previewImages.map( (previewImage, index) => (
            <div key={index} className="relative w-32 h-32 mx-2">
              <Image src={previewImage} layout="fill" objectFit="cover" alt="upload"/>
            </div>
          ))
        }
      </div>
    </div>
  );

}

export default Home;

