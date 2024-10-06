
"use client";

import { motion } from "framer-motion";
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

  const [loadingRemoveBg, setLoadingRemoveBg ] = useState<boolean>(false);

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

      if ( loadingRemoveBg !== true ) {
        setFocus(prevImages.length + newPreviewImages.length -1);
      }
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


  function handleRemoveBg(event:any) {
    setLoadingRemoveBg(true);


    setTimeout( () => {
      setLoadingRemoveBg(false);
    }, 6000) 

    // TODO :
    // Probleme les images sur la taille 
    // bouton "remove backgroudn" trop grand 
    // trop grand "le close"
    
    // true => can't change focus 
    // hide the "remove"
    // disable button 
    // show loader indicator

  
  }

  return (

    <div className={`h-screen flex justify-center items-center ${dropBorder} relative `}
      onDrop={dropHandler}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}>
    
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
                      <div key={index} className={`${loadingRemoveBg !== true ? "cursor-pointer" : "cursor-not-allowed"} relative shadow-lg`} onClick={ e => {
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
                          className="flex items-center justify-center bg-red-900 rounded-full w-8 h-8 hover:bg-red-700 transition duration-100 ease-in-out focus:outline-none">
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
                          className="w-96 h-96 object-cover rounded-lg shadow-lg "
                        />
                      </div>
                      :  
                        <div className="relative">
                          <motion.div
                            className="absolute h-full w-12 bg-red-900 backdrop-filter backdrop-blur-lg bg-opacity-10 shadow-lg"
                            animate={{
                              x: [20, 300, 20] // 384 (largeur de l'image) - 48 (largeur du div) = 336px
                            }}
                            transition={{
                              duration:6, // Durée de l'animation
                              ease: "easeInOut", // Effet de transition
                              repeat: Infinity, // Répétition infinie
                            }}
                          >
                          </motion.div>
                          <img
                            src={previewImage}
                            alt="preview"
                            className="w-96 h-96 object-cover rounded-lg shadow-lg 
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

           
              // <button
              //   onClick={handleRemoveBg}
              //   className={`relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-2xl font-medium rounded-lg group focus:outline-none transition-all ease-in duration-150 transform-gpu
              //     ${loadingRemoveBg ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-br from-cyan-500 to-blue-500 group-hover:from-cyan-500 group-hover:to-blue-500 hover:text-white dark:text-white'}
              //   `}
              //   disabled={loadingRemoveBg}
              //   style={{ transform: loadingRemoveBg ? 'scale(0.95)' : 'scale(1)' }} // Slight scale effect on click
              // >
              //   <span className={`relative flex items-center px-10 py-2.5 transition-all ease-in duration-75 rounded-md font-bold
              //     ${loadingRemoveBg ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-900 group-hover:bg-opacity-0'}
              //   `}>
              //     {/* If loading, show the spinner */}
              //     {loadingRemoveBg ? (
              //       <>
              //         <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              //           <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M4 12a8 8 0 018-8v8z"></path>
              //         </svg>
              //         Processing...
              //       </>
              //     ) : (
              //       <>
              //         <svg className="h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m6 0a3 3 0 00-3-3m0 0a3 3 0 00-3 3m3 3a3 3 0 003-3m0 3a3 3 0 01-3 3m-3 0a3 3 0 003-3" />
              //         </svg>
              //         Remove Background
              //       </>
              //     )}
              //   </span>
              // </button>


              }
              </div>
          </div>
        }

      

      </div>

    </div>
  );

}

export default Home;

