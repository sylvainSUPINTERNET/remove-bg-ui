
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Bounce, toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';

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

  function handleDragEnter(event: any) {
    event.preventDefault();
  }

  function handleDragLeave(event: any) {
    event.preventDefault();
    setDropBorder("invisible");


    // if ( previewImages.length === 0) {
    //   setDropBorder("invisible");
    // }
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

    <div>           

        <ToastContainer />

          {/* LANDING */}
          {
            previewImages.length <= 0 && 
              <div className="flex justify-center mt-[10em] md:mt-[13em] ">              
                <motion.div
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 1, ease: "easeOut" }}
                  variants={{
                    hidden: { opacity: 0, y: 60 },
                    visible: { opacity: 1, y: 0 } }}>




                <div className="flex flex-col items-center justify-center rounded-lg md:p-4 relative"
                    onDrop={dropHandler}
                    onDragOver={handleDragOver}
                    onDragLeave={ (e:any) => {
                      if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
                        handleDragLeave(e);
                      }
                    }}
                    onDragEnter={handleDragEnter}>
                    <motion.div 
                      initial={{ opacity: 0, scale:1 }}
                      animate={{ 
                        opacity: dropBorder === 'visible' ? 1 : 0,
                        scale: dropBorder === 'visible' ? 1.3 : 1 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`h-full w-full rounded-lg bg-purple-400 bg-clip-padding border border-black blur-xl absolute z-[99] ${dropBorder ? 'visible' : 'hidden'}`}>
                      <div className={`h-full w-full rounded-lg bg-gradient-to-r from-[#FEAC5E] via-[#C779D0] to-[#4BC0C8] blur-xl absolute z-[98]`}>
                      </div>
                    </motion.div>
                    
                  <motion.div className="mb-5"
                    animate={{
                      y: [0,1,2,3,4,5,6,7,8,9,10,9,8,7,6,5,4,3,2,1,0],
                      rotateX: [45, 50, 45]
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity
                    }}>
                
                      <Image src="/layers.png" alt="logo" width={128} height={128} draggable={false}></Image>
                  </motion.div>

                  <div className={`${dropBorder === 'visible' ? 'blur-xl': ''}`}>
                    <p className="text-2xl md:text-5xl font-extrabold leading-tight text-black  text-center ">Drop your <span className="text-emerald-400">Images</span> or <span className="text-cyan-500">Image URL</span></p>
                  </div>
                </div>

                
                <div className={`${dropBorder === 'visible' ? 'mt-[3em] mb-2 flex justify-center blur-xl': 'mt-[3em] mb-2 flex justify-center'}`}>
                    <label className="relative inline-block text-lg group cursor-pointer">
                      <input 
                        multiple
                        type="file" 
                        className="hidden" 
                        onChange={(e) => {

                          if ( e.target && e.target.files ) {
                            if (e.target.files.length > 4 ) {
                              setError(`Maximum ${MAX_FILES} reached`);
                              return;
                            } else {

                              const newPreviewImages: string[] = []; 
                              const newPreviewImagesBlob: Blob[] = [];
                              for (let i = 0; i < e.target.files.length; i++) {
                                const file = e.target.files[i];
                                if (allowed_types.indexOf(file.type) === -1) {
                                  setError("Format must be JPEG or PNG")
                                } else {
                                  newPreviewImages.push(URL.createObjectURL(file));
                                  newPreviewImagesBlob.push(file);
                                }
                              }

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
                          }
                        
                        }} // Handle file selection here
                      />
                      <span className="relative z-10 block px-5 py-3 overflow-hidden font-medium leading-tight text-gray-800 transition-colors duration-300 ease-out border-2 border-gray-900 rounded-lg group-hover:text-white">
                        <span className="absolute inset-0 w-full h-full px-5 py-3 rounded-lg bg-gray-50"></span>
                        <span className="absolute left-0 w-48 h-48 -ml-2 transition-all duration-300 origin-top-right -rotate-90 -translate-x-full translate-y-12 bg-gray-900 group-hover:-rotate-180 ease"></span>
                        <span className="relative">Upload Image</span>
                      </span>
                      <span className="absolute bottom-0 right-0 w-full h-12 -mb-1 -mr-1 transition-all duration-200 ease-linear bg-gray-900 rounded-lg group-hover:mb-0 group-hover:mr-0" data-rounded="rounded-lg"></span>
                    </label>
                  </div>

                    
              </motion.div>
              </div>
          }


          {/* AFTER DROP */}
          <div>



            {/*MAIN LAYOUT*/}
            { 

            previewImages.length > 0 &&
            <AnimatePresence>
            <div>
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ duration: 1, ease: "easeOut" }}>



            {/* SMALL MENU */}
            <div className="mt-3 mb-3">
                {
                  previewImages.length > 0 && 

                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 60 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="flex justify-center">
                    {
                      previewImages.map( (previewImage, index) => {
                        return (
                          <div key={index+"small"} 
                               className={`${loadingRemoveBg !== true ? "cursor-pointer" : "cursor-not-allowed"} relative shadow-lg rounded-xl border-2`}
                               onClick={ e => {
                                  if ( loadingRemoveBg !== true ) {
                                    setFocus(index);
                                  }
                                }}>

                            <div className={`absolute ${index===focus ? "bg-transparent": "bg-black/60"} h-full w-full rounded-xl`}>
                            </div>
                            <div className={`absolute right-0`}>
                              <button 
                              disabled={loadingRemoveBg}
                              onClick={() => {
                                removeItem(index);
                              }}
                              className={`flex items-center justify-center ${loadingRemoveBg === true ? 'bg-slate-700': 'bg-red-900'} rounded-full w-6 h-6 mt-[0.1em] mr-1 ${loadingRemoveBg === true ? '': 'hover:bg-red-700'} transition duration-100 ease-in-out focus:outline-none`}>
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className="h-4 w-4 text-white" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor" 
                                  strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            

                                
                            <img src={previewImage} alt="preview" className="w-24 h-24 object-cover rounded-xl"/>
                          </div>
                        )
                      })
                    }
                  </motion.div>
                </AnimatePresence>
                  
                }
            </div>
            <div className="relative">

                {
                previewImages.map( (previewImage, index:number) => (
                    <div key={index}> 
                    {/* MAIN LAYOUT ( with background ) */}
                    { focus === index && (
                      <div className="p-4 relative flex justify-center" key={index+"main"} >

                        {/* <div className="absolute top-0 right-4"></div> */}
                        
                        {
                          loadingRemoveBg !== true ? 
                          <div className="relative"   
                            onDrop={dropHandler}
                            onDragOver={handleDragOver}
                            onDragLeave={ (e:any) => {
                              if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
                                handleDragLeave(e);
                              }
                            }}
                            onDragEnter={handleDragEnter}>


                            <motion.div 
                              initial={{ opacity: 0, scale:1 }}
                              animate={{ 
                                opacity: dropBorder === 'visible' ? 1 : 0,
                                scale: dropBorder === 'visible' ? 1: 1 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className={`h-full w-full rounded-lg bg-purple-400 bg-clip-padding border border-black blur-xl absolute z-[99] ${dropBorder ? 'visible' : 'hidden'}`}>
                              <div className={`h-full w-full rounded-lg bg-gradient-to-r from-[#FEAC5E] via-[#C779D0] to-[#4BC0C8] blur-xl absolute z-[98]`}>
                              </div>
                            </motion.div>

                      
                            <img
                              src={previewImage}
                              alt="preview"
                              className={`w-96 h-96 object-cover rounded-lg border-2 ${dropBorder === 'visible'? 'blur-xl' : ''}`}

                              style={{
                                "backgroundImage" : downloable[focus] !== undefined ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc),linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)" : "none",
                                "backgroundSize": downloable[focus] !== undefined ? "20px 20px" : "none",
                                "backgroundPosition": downloable[focus] !== undefined ? "0 0, 10px 10px" : "none"
                              }}
                            />
                          </div>
                          :  
                          <div className="relative">
                            <motion.div 
                              initial={{ opacity: 0, scale: 1 }}
                              animate={{ 
                                opacity: 1,
                                scale: 1 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="h-full w-full rounded-lg bg-black/[0.7] bg-opacity-50 absolute z-[99] visible flex items-center justify-center">


                              <svg 
                                className="w-24 h-24 text-white animate-spin" 
                                fill="currentColor" 
                                viewBox="0 0 512 512" 
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M55.89,262.818c-3-26-0.5-51.1,6.3-74.3c22.6-77.1,93.5-133.8,177.6-134.8v-50.4c0-2.8,3.5-4.3,5.8-2.6l103.7,76.2    c1.7,1.3,1.7,3.9,0,5.1l-103.6,76.2c-2.4,1.7-5.8,0.2-5.8-2.6v-50.3c-55.3,0.9-102.5,35-122.8,83.2c-7.7,18.2-11.6,38.3-10.5,59.4    c1.5,29,12.4,55.7,29.6,77.3c9.2,11.5,7,28.3-4.9,37c-11.3,8.3-27.1,6-35.8-5C74.19,330.618,59.99,298.218,55.89,262.818z     M355.29,166.018c17.3,21.5,28.2,48.3,29.6,77.3c1.1,21.2-2.9,41.3-10.5,59.4c-20.3,48.2-67.5,82.4-122.8,83.2v-50.3    c0-2.8-3.5-4.3-5.8-2.6l-103.7,76.2c-1.7,1.3-1.7,3.9,0,5.1l103.6,76.2c2.4,1.7,5.8,0.2,5.8-2.6v-50.4    c84.1-0.9,155.1-57.6,177.6-134.8c6.8-23.2,9.2-48.3,6.3-74.3c-4-35.4-18.2-67.8-39.5-94.4c-8.8-11-24.5-13.3-35.8-5    C348.29,137.718,346.09,154.518,355.29,166.018z"/>
                              </svg>


                            </motion.div>
                            <img
                              src={previewImage}
                              alt="preview"
                              className="w-96 h-96 object-cover rounded-lg shadow-lg" />                                       
                          </div>

                            // <div className="relative">
                            //   <motion.div
                            //     className="absolute h-full w-32 bg-red-900 backdrop-filter backdrop-blur-lg bg-opacity-10 shadow-lg border-l-2 border-r-2 border-black "
                            //     animate={{
                            //       x: [20, 190, 20]
                            //     }}
                            //     transition={{
                            //       duration:2, 
                            //       ease: "easeInOut", 
                            //       repeat: Infinity, 
                            //     }}
                            //   >
                            //   </motion.div>
                            //   <img
                            //     src={previewImage}
                            //     alt="preview"
                            //     className="w-96 h-96 object-cover rounded-lg 
                            //             shadow-[0_0_50px_20px_rgba(255,0,0,0.5)]"
                            //   />
                            // </div>
                        }


                      </div>
                    )}
                    </div>
                  ))
                }
                
              
                {
                  downloable[focus] !== undefined && (
                  <div className="flex flex-col md:flex-row gap-2 items-center justify-center">

                    {/* MAIN LAYOUT ( background removed ) */}

                      <button 
                        onClick={(ev) => {
                          handleDownload(ev, "png");
                        }}
                        className="box-border relative z-30 inline-flex items-center justify-center w-48 px-8 py-3 overflow-hidden font-bold text-white transition-all duration-300 bg-indigo-600 rounded-md cursor-pointer group ring-offset-2 ring-1 ring-indigo-300 ring-offset-indigo-200 hover:ring-offset-indigo-500 ease focus:outline-none">
                        <span className="absolute bottom-0 right-0 w-8 h-20 -mb-8 -mr-5 transition-all duration-300 ease-out transform rotate-45 translate-x-1 bg-white opacity-10 group-hover:translate-x-0"></span>
                        <span className="absolute top-0 left-0 w-20 h-8 -mt-1 -ml-12 transition-all duration-300 ease-out transform -rotate-45 -translate-x-1 bg-white opacity-10 group-hover:translate-x-0"></span>
                        <span className="relative z-20 flex items-center text-sm">
                        <svg className="relative w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0l-6-6m6 6l6-6M4 20h16" />
                          </svg>
                          PNG
                        </span>
                      </button>

                      <button 
                        onClick={(ev) => {
                          handleDownload(ev, "webp");
                        }}
                        className="box-border relative z-30 inline-flex items-center justify-center w-48 px-8 py-3 overflow-hidden font-bold text-white transition-all duration-300 bg-indigo-600 rounded-md cursor-pointer group ring-offset-2 ring-1 ring-indigo-300 ring-offset-indigo-200 hover:ring-offset-indigo-500 ease focus:outline-none">
                        <span className="absolute bottom-0 right-0 w-8 h-20 -mb-8 -mr-5 transition-all duration-300 ease-out transform rotate-45 translate-x-1 bg-white opacity-10 group-hover:translate-x-0"></span>
                        <span className="absolute top-0 left-0 w-20 h-8 -mt-1 -ml-12 transition-all duration-300 ease-out transform -rotate-45 -translate-x-1 bg-white opacity-10 group-hover:translate-x-0"></span>
                        <span className="relative z-20 flex items-center text-sm">
                        <svg className="relative w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0l-6-6m6 6l6-6M4 20h16" />
                        </svg>
                          WEBP
                        </span>
                      </button>

                    </div>

                  )
                }
                
                {

                  downloable[focus] === undefined && (
                    // <div
                    //   onClick={handleRemoveBg}
                    //   className={`${loadingRemoveBg === false ? "cursor-pointer": "cursor-progress"} p-4 font-bold text-2xl leading-9 flex items-center
                    //   ${dropBorder === 'visible' ? 'blur-xl': ''}`}>
                    
                    //   <svg
                    //     className={`h-5 w-5 mr-3 text-blue-500 ${loadingRemoveBg ? 'animate-spin' : ''}`}
                    //     xmlns="http://www.w3.org/2000/svg"
                    //     fill="none"
                    //     viewBox="0 0 24 24"
                    //     stroke="currentColor"
                    //   >
                    //     <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    //     <path
                    //       strokeLinecap="round"
                    //       strokeLinejoin="round"
                    //       strokeWidth="4"
                    //       d="M4 12a8 8 0 018-8v8z"
                    //     ></path>
                    //   </svg>
                    //   Remove Background
                    // </div>
                    <div className={`${dropBorder === 'visible' ? 'blur-xl': ''} flex justify-center`}>
                        <button
                            onClick={handleRemoveBg}
                            disabled={loadingRemoveBg}
                            className={`relative inline-block text-lg group 
                                        ${loadingRemoveBg ? 'cursor-not-allowed opacity-50' : ''}`}>
                            <span className={`relative z-10 block px-5 py-3 overflow-hidden font-medium leading-tight 
                                            transition-colors duration-300 ease-out border-2 rounded-lg 
                                            ${loadingRemoveBg ? 'text-gray-400 border-gray-400' : 'text-gray-800 border-gray-900 group-hover:text-white'}`}>
                                <span className={`absolute inset-0 w-full h-full px-5 py-3 rounded-lg 
                                                ${loadingRemoveBg ? 'bg-gray-200' : 'bg-gray-50'}`}></span>
                                <span className={`absolute left-0 w-60 h-48 -ml-2 transition-all duration-300 origin-top-right 
                                                ${loadingRemoveBg ? 'bg-gray-400' : 'bg-gray-900 group-hover:-rotate-180'} 
                                                -rotate-90 -translate-x-full translate-y-12 ease`}></span>
                                <span className="relative">Remove Background</span>
                            </span>
                            <span className={`absolute bottom-0 right-0 w-full h-12 -mb-1 -mr-1 transition-all duration-200 ease-linear 
                                            ${loadingRemoveBg ? 'bg-gray-400' : 'bg-gray-900 group-hover:mb-0 group-hover:mr-0'} 
                                            rounded-lg`} data-rounded="rounded-lg"></span>
                        </button>
                    </div>

                    )
                }

            </div>
            </motion.div>

            </div>
            </AnimatePresence>
            }


          </div>
                  
      </div>

  );

}

export default Home;

