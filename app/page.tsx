
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
  const [focus, setFocus] = useState<number>(previewImages.length -1);

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

 async function dropHandler(ev: any) {
    ev.preventDefault();

    const url = ev.dataTransfer.getData('text/plain');

    const newPreviewImages: string[] = []; 

    if ( url ) {
      try {
          const resp = await fetch(`${url}`, {method:'HEAD'});
          if ( !resp.ok ) {
            setError("Can't laod the image from your URL !");
          }

          if ( resp.headers.get('content-type') && allowed_types.indexOf(resp.headers.get('content-type')!) === -1 ) {
            setError("Format must be JPEG or PNG")
          } else {
            const respBoob = await fetch(`${url}`);
            if ( respBoob.ok ) {
              const blob = await respBoob.blob();
              if (blob) {
                newPreviewImages.push(URL.createObjectURL(blob));
              }
            } else {
              setError("Can't laod the image from your URL !");
            }
            
          }

      } catch ( error ) {
        setError("Can't laod the image from your URL !");
      } 
    }

    setDropBorder("");
  
    if (ev.dataTransfer.items) {
      for (const item of ev.dataTransfer.items) {
        if (item.kind === 'file') {
          if (allowed_types.indexOf(item.type) === -1) {
            setError("Format must be JPEG or PNG")
          } else {
            const file = item.getAsFile();
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

      setFocus(prevImages.length + newPreviewImages.length -1);
      return [...prevImages, ...newPreviewImages]
    });

  }

  function handleDragOver(event: any) {
    event.preventDefault();
    setDropBorder("border-[0.4em] border-dashed border-black");
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
      setFocus(newImages.length -1);
      return newImages;
    });
  }

  return (

    <div className={`h-screen flex justify-center items-center ${dropBorder} relative `}
      onDrop={dropHandler}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={ev => {
        alert("end")
      }}>
          
      <ToastContainer />
      <div className={`flex items-center justify-center p-6 rounded 
                        text-center h-96`}>

        {
          previewImages.length <= 0 && 
            <div>
              <p className="text-5xl font-extrabold leading-tight text-black">Drop your <span className="text-green-300">Images</span> or <span className="text-green-300">Image URL</span></p>
              {/* <div className="text-2xl font-extrabold leading-tight text-black mt-4 mb-4">OR</div>
              <div className="mt-3">
                <input type="file" className="
                shadow-lg
                text-4xl font-extrabold leading-tight text-black
                text-gray-900 bg-gradient-to-r
                from-purple-500 to-fushia-500 
                border border-[3px] border-black
                hover:bg-gradient-to-bl focus:ring-4 
                focus:outline-none 
                font-medium rounded-lg 
                px-5 py-2.5 
                text-center 
                me-2 mb-2"
                multiple></input>
              </div> */}
            </div>
        }
        
        

        <div className="absolute h-24 top-2 rounded p-2 w-full md:w-3/4">
          <div className="flex justify-center md:gap-4 space-x-2">
              {
                previewImages.length > 0 && 
                <>
                {
                  previewImages.map( (previewImage, index) => {
                    return (
                      <div key={index} className="cursor-pointer relative" onClick={ e => {
                        setFocus(index);
                      }}>
                        <div className={`absolute ${index===focus ? "bg-transparent": "bg-black/60"} h-full w-full rounded-xl`}>
                        </div>
                        <img src={previewImage} alt="google" className="w-24 h-24 rounded-xl"/>
                      </div>
                    )
                  })
                }
                </>
                
              }
          </div>
        </div>
        
        { previewImages.length > 0 &&
        <div className="flex justify-center ">
            {previewImages.map( (previewImage, index:number) => (
              <> 
              { focus === index && (
                <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg shadow-lg p-4" key={index} 
                onMouseOver={ ev => {
                }}>
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
                    className="w-96 h-96 mx-2"
                    />
                </div>
              )}
              </>
            ))}

        </div>
        }

      </div>

    </div>
  );

}

export default Home;

