
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Bounce, toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Home() {

  const allowed_types:string[] = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  const MAX_FILES:number = 4;

  const [dropBorder, setDropBorder]= useState<string>("invisible");
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewBlob, setPreviewBlob] = useState<Blob[]>([]);
  const [error, setError] = useState<string | null>(null); 
  const [focus, setFocus] = useState<number>(previewImages.length -1);
  const [loadingRemoveBg, setLoadingRemoveBg ] = useState<boolean>(false);
  const [downloable, setDownloable] = useState<number[]>([]);

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
    const newPreviewImagesBlob: Blob[] = [];
    if ( url ) {
      try {
          const resp = await fetch(`${url}`, {method:'HEAD'});
          if ( !resp.ok ) {
            setError("Can't laod the image from your URL !");
          }

          if ( resp.headers.get('content-type') && allowed_types.indexOf(resp.headers.get('content-type')!) === -1 ) {
            setError("Format must be JPEG or PNG or WEBP")
          } else {
            const respBoob = await fetch(`${url}`);
            if ( respBoob.ok ) {
              const blob = await respBoob.blob();
              if (blob) {
                newPreviewImages.push(URL.createObjectURL(blob));
                newPreviewImagesBlob.push(blob);
              }
            } else {
              setError("Can't laod the image from your URL !");
            }
            
          }

      } catch ( error ) {
        setError("Can't laod the image from your URL !");
      } 
    }

    setDropBorder("invisible");
  
    if (ev.dataTransfer.items) {
      for (const item of ev.dataTransfer.items) {
        if (item.kind === 'file') {
          if (allowed_types.indexOf(item.type) === -1) {
            setError("Format must be JPEG or PNG")
          } else {
            const file = item.getAsFile();
            if (file) {
              newPreviewImages.push(URL.createObjectURL(file));
              newPreviewImagesBlob.push(file);
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

      if ( loadingRemoveBg !== true ) {
        setFocus(prevImages.length + newPreviewImages.length -1);
      }
      return [...prevImages, ...newPreviewImages]
    });

    setPreviewBlob((prevBlob) => {
      return [...prevBlob, ...newPreviewImagesBlob]
    });

  }

  function handleDragOver(event: any) {
    event.preventDefault();
    setDropBorder("visible");
  }

  function handleDragLeave(event: any) {
    event.preventDefault();

    if ( previewImages.length === 0) {
      setDropBorder("invisible");
    }
  }


  function removeItem(index:number) {
    setPreviewImages((prevImages) => {
      const newImages = [...prevImages];
      newImages.splice(index, 1);

      setFocus(newImages.length -1);
      return newImages;
    });

    setPreviewBlob((prevBlob) => {
      const newBlob = [...prevBlob];
      newBlob.splice(index, 1);
      return newBlob
    });

    setDownloable(
      (prevDownloable) => {
        const newDownloable = [...prevDownloable];
        newDownloable.splice(index, 1);
        return newDownloable;
      });
  }


  async function handleRemoveBg(event:any) {
    if ( loadingRemoveBg ) {
      return
    }
    setLoadingRemoveBg(true);
    try {
      let formData = new FormData();
      let detail = previewBlob[focus]
      const file: File = new File([previewBlob[focus]], `base_image.${detail.type.split("/")[1]}`, {type: detail.type});
      formData.append('file', file);
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL as string}/removebg`, {
          method: 'POST',
          body: formData
      });

      if ( resp.status === 200 ) {
        const data = await resp.blob();
        const imageUrl = URL.createObjectURL(data);
        setPreviewImages((prevImages) => {
          setLoadingRemoveBg(false);
          const newImages = [...prevImages];
          newImages[focus] = imageUrl;
          return newImages;
        });

        setDownloable(
          (prevDownloable) => {
            const newDownloable = [...prevDownloable];
            newDownloable.push(focus);
            return newDownloable;
          }
        );
      } else {
        setLoadingRemoveBg(false);
        setError("Error while removing the background");
      }

    } catch ( e ) {
      setLoadingRemoveBg(false);
      setError("Error while removing the background");
    }
  
  }

  async function handleDownload(event:any, format:"png"|"webp") {

    try {
      let formData = new FormData();
      let detail = previewBlob[focus]
      const file: File = new File([previewBlob[focus]], `base_image.${detail.type.split("/")[1]}`, {type: detail.type});
      formData.append('file', file);
      formData.append('type', format);
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL as string}/download`, {
        method: 'POST',
        body: formData
      });

      if ( resp.status === 200 ) {
        const data = await resp.blob();
        const imageUrl = URL.createObjectURL(data);

        const disposition = resp.headers.get("Content-Disposition");
        let filename = "remove_bg";
        if (disposition && disposition.includes("filename=")) {
          const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
          if ( filenameMatch !== null ) { 
            if (filenameMatch.length > 1) {
              filename = filenameMatch[1];
              const link = document.createElement("a");
              link.href = imageUrl;
              link.download = filename
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(imageUrl);
            }
          }

        }


      }
    } catch ( e ) {
      setError("Error while downloading the image");
    }
  }

  return (

    <div className={`h-screen flex justify-center items-center relative `}
      onDrop={dropHandler}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}>

        <motion.div 
          animate={{
            opacity: [0, 0.2, 0.4],
          }}
        className={`absolute ${dropBorder} bg-gradient-to-r from-teal-200 to-teal-500 h-full w-full z-10 opacity-40`}>
        </motion.div>
    
      <ToastContainer />
      <div className={`flex items-center justify-center  rounded 
                        text-center h-96`}>
{/* 

                          <motion.div

                            layout
                            className="bg-black"
                            animate={{
                              scale: [1, 2, 2, 1, 1],
                              y: [0, 0, 100, 100, 0],
                            }}
                            transition={{
                              duration: 1,
                              ease: "easeInOut",
                              times: [0, 0.2, 0.5, 0.8, 1],
                              repeat: Infinity,
                              repeatDelay: 0.2
                            }}
                          >
                            basic
                          </motion.div> */}

        {
          previewImages.length <= 0 && 
            <motion.div
            initial="hidden"
            animate="visible"
            transition={{ duration: 1, ease: "easeOut" }}
            variants={{
              hidden: { opacity: 0, y: 60 },
              visible: { opacity: 1, y: 0 }
            }}>
              <p className="text-5xl font-extrabold leading-tight text-black">Drop your <span className="text-emerald-400">Images</span> or <span className="text-cyan-500">Image URL</span></p>
            </motion.div>
        }
        
        

        <div className="absolute h-24 top-2 rounded w-full md:w-3/4">
          <div className="flex justify-center md:gap-4 space-x-2">
              {
                previewImages.length > 0 && 
                <>
                {
                  previewImages.map( (previewImage, index) => {
                    return (
                      <div key={index} className={`${loadingRemoveBg !== true ? "cursor-pointer" : "cursor-not-allowed"} relative shadow-lg rounded-xl border-2`} onClick={ e => {
                        if ( loadingRemoveBg !== true ) {
                          setFocus(index);
                        }
                      }}>
                        <div className={`absolute ${index===focus ? "bg-transparent": "bg-black/60"} h-full w-full rounded-xl`}>
                        </div>
                        <div className={`absolute right-0`}>
                          <button 
                          onClick={() => {
                            removeItem(index);
                          }}
                          className="flex items-center justify-center bg-red-900 rounded-full w-6 h-6 mt-[0.1em] mr-1 hover:bg-red-700 transition duration-100 ease-in-out focus:outline-none">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-4 w-4 text-white" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor" 
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        

                            
                        <img src={previewImage} alt="google" className="w-24 h-24 object-cover rounded-xl"/>
                      </div>
                    )
                  })
                }
                </>
                
              }
          </div>
        </div>
        
        { 
          previewImages.length > 0 &&
          <div className="">
              {previewImages.map( (previewImage, index:number) => (
                <> 
                { focus === index && (
                  <div className="p-4 relative" key={index} >

                    <div className="absolute top-0 right-4">

                      {/* {
                        loadingRemoveBg !== true && 
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
                      } */}
                      
                    </div>
                    
                    {
                      loadingRemoveBg !== true ? 
                      <div className="relative">
                        <img
                          src={previewImage}
                          alt="preview"
                          className="w-96 h-96 object-cover rounded-lg border-2"
                          style={{
                              "backgroundImage":"linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc),linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)",
                              "backgroundSize": "20px 20px",
                              "backgroundPosition": "0 0, 10px 10px"
                          }}
                        />
                      </div>
                      :  
                        <div className="relative">
                          <motion.div
                            className="absolute h-full w-32 bg-red-900 backdrop-filter backdrop-blur-lg bg-opacity-10 shadow-lg border-l-2 border-r-2 border-black "
                            animate={{
                              x: [20, 190, 20]
                            }}
                            transition={{
                              duration:2, 
                              ease: "easeInOut", 
                              repeat: Infinity, 
                            }}
                          >
                          </motion.div>
                          <img
                            src={previewImage}
                            alt="preview"
                            className="w-96 h-96 object-cover rounded-lg 
                                    shadow-[0_0_50px_20px_rgba(255,0,0,0.5)]"
                          />
                        </div>
                    }


                  </div>
                )}
                </>
              ))}
              
              <div className="my-4 px-4 flex justify-center">
              {
                    downloable[focus] !== undefined && (
                      <div className="flex-col">

                      <div
                        onClick={(ev) => {
                          handleDownload(ev, "png");
                        }}
                        className={`cursor-pointer p-4 font-bold text-2xl leading-9 flex items-center`}>
                          <svg
                              className={`h-5 w-5 mr-3 text-blue-500`}
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 4v16h16V4H4zm4 8l4 4 4-4m-4-4v8"
                              />
                            </svg>
                          Download HD - PNG
                      </div>

                      <div
                        onClick={(ev) => {
                          handleDownload(ev, "webp");
                        }}
                        className={`cursor-pointer p-4 font-bold text-2xl leading-9 flex items-center`}>
                          <svg
                              className={`h-5 w-5 mr-3 text-blue-500`}
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 4v16h16V4H4zm4 8l4 4 4-4m-4-4v8"
                              />
                            </svg>
                          Download HD - WEBP
                      </div>

                      </div>

                    )
              }
              
              {

                downloable[focus] === undefined && (
                  <div
                    onClick={handleRemoveBg}
                    className={`${loadingRemoveBg === false ? "cursor-pointer": "cursor-progress"} p-4 font-bold text-2xl leading-9 flex items-center`}
                  >
                    <svg
                      className={`h-5 w-5 mr-3 text-blue-500 ${loadingRemoveBg ? 'animate-spin' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="4"
                        d="M4 12a8 8 0 018-8v8z"
                      ></path>
                    </svg>
                    Remove Background
                  </div>
                  )
              }

              </div>
          </div>
        }

      

      </div>

    </div>
  );

}

export default Home;

