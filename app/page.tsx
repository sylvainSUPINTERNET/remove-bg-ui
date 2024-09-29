
"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import Image from "next/image";
import {useDroppable} from '@dnd-kit/core';
import { useState } from "react";
import  Droppable  from "./components/Droppable";
import  Draggable from "./components/Draggable";

function Home() {
  const [parent, setParent] = useState(null);
  const draggable = (
    <Draggable id="draggable">
      Go ahead, drag me.
    </Draggable>
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {!parent ? draggable : null}
      <Droppable id="droppable">
        {parent === "droppable" ? draggable : 'Drop here'}
      </Droppable>
    </DndContext>
  );

  function handleDragEnd({over}: any) {
    setParent(over ? over.id : null);
  }
}

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
