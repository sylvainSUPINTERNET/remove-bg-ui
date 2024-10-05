
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
            <div>
              <p className="text-5xl font-extrabold leading-tight text-black">Drop your <span className="text-emerald-400">Images</span> or <span className="text-cyan-500">Image URL</span></p>
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
                          className="flex items-center justify-center bg-red-900 rounded-full w-10 h-10 hover:bg-red-700 transition duration-100 ease-in-out focus:outline-none">
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
                      loadingRemoveBg === true ? 
                                          
                      // <div role="status" className="flex items-center justify-center h-96 w-96 max-w-sm bg-gray-100 rounded-lg animate-pulse dark:bg-gray-300">
                      // <svg className="w-10 h-10 text-gray-200 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 20">
                      //   <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z"/>
                      //   <path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM9 13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2Zm4 .382a1 1 0 0 1-1.447.894L10 13v-2l1.553-1.276a1 1 0 0 1 1.447.894v2.764Z"/>
                      // </svg>
                      // <span className="sr-only">Loading...</span>
                      // </div>  
                      <div className="text-center rtl:text-center">
                        <div role="status">
                            <svg aria-hidden="true" className="inline w-24 h-24 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                            </svg>
                            <span className="sr-only">Loading...</span>
                        </div>
                      </div>
                      :  
                      <div className="relative">
                        <div className="text-center rtl:text-center absolute top-[50%] left-[50%]">
                          <div role="status">
                              <svg aria-hidden="true" className="inline w-24 h-24 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                              </svg>
                              <span className="sr-only">Loading...</span>
                          </div>
                        </div>
                        <img src={previewImage} alt="preview" className="w-96 h-96 object-cover rounded-lg"/> 
                      </div>
                    }


                  </div>
                )}
                </>
              ))}
              
              <div className="my-4 px-4">
              {
                loadingRemoveBg !== true ? (
                  <button
                    onClick={handleRemoveBg}
                    className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-2xl font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-cyan-500 to-blue-500 group-hover:from-cyan-500 group-hover:to-blue-500 hover:text-white dark:text-white focus:outline-none dark:focus:ring-cyan-800"
                  >
                    <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                      Remove Background
                    </span>
                  </button>
                ) : (
                  // <motion.div
                  //   className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full h-12 flex items-center justify-center"
                  //   animate={{
                  //     scale: [1, 1.2, 1.2, 1, 1],
                  //     rotate: [0, 360, 360, 0, 0],
                  //     borderRadius: ["20%", "50%", "50%", "20%"],
                  //   }}
                  //   transition={{
                  //     duration: 1.5,
                  //     ease: "easeInOut",
                  //     repeat: Infinity,
                  //     repeatDelay: 0.5,
                  //   }}
                  // >
                  // </motion.div>

                //   <div className="text-center rtl:text-center">
                //     <div role="status">
                //         <svg aria-hidden="true" className="inline w-24 h-24 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                //             <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                //             <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                //         </svg>
                //         <span className="sr-only">Loading...</span>
                //     </div>
                // </div>
                <></>
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

