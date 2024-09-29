
"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import Image from "next/image";
import {useDroppable} from '@dnd-kit/core';
import { useState } from "react";
import  Droppable  from "./components/Droppable";
import  Draggable from "./components/Draggable";

function Home() {
  const [parent, setParent] = useState(null);
  // const draggable = (
  //   <Draggable id="draggable">
  //     Go ahead, drag me.
  //   </Draggable>
  // );

  function dropHandler(ev:any) {
    console.log("File(s) dropped");
  
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
    if (ev.dataTransfer.items) {
        console.log("items : ", ev.dataTransfer.items);
    } 
  }

  return (

    <div className="h-screen bg-gradient-to-r from-fuchsia-500 to-cyan-500 flex justify-center items-center">
      <div className="font-mono font-bold text-xl text-center md:text-4xl">


      <div id="drop_zone" onDrop={dropHandler} onDragOver={handleDragOver } className="bg-red-800 h-96">
          <p>Drag one or more files to this <i>drop zone</i>.</p>
        </div>


        {/* Upload an image to remove the background */}
        <DndContext onDragEnd={handleDragEnd}>
          {/* {!parent ? draggable : null} */}
          <Droppable id="droppable">
            {/* {parent === "droppable" ? draggable : 'Drop here'} */}
          </Droppable>
        </DndContext>
      </div>
    </div>
  );

  function handleDragEnd({over}: any) {
    console.log("OVER : ", over);
    setParent(over ? over.id : null);
  }

  function handleDragOver(event: any) {
    event.preventDefault();
    console.log("DRAG OVER");
  }
}

export default Home;

// export default function Home() {




//   function dragEnd(event: DragEndEvent) {
//     const { over } = event;
//     console.log(over);
//   }

//   return (
//     <div className="h-screen bg-gradient-to-r from-fuchsia-500 to-cyan-500 flex justify-center items-center">
//       <div className="font-mono font-bold text-xl text-center md:text-4xl">
//         Upload an image to remove the background
//       </div>

//       <DndContext onDragEnd={dragEnd}>
        
//       </DndContext>
//     </div>
//   )
// }
