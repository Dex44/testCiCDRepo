import { useCallback, useContext } from "react";
import { WhiteboardContext } from "../WhiteboardContext";
import { fabric } from "fabric";

const useFabric = () => {
    const canvas = useContext(WhiteboardContext);
    const fabricRef = useCallback((element) => {
        if (!element) return canvas.current?.dispose();

        canvas.current = new fabric.Canvas(element, {
            height: window.innerHeight,
            width: window.innerWidth,
        });

        // canvas.current.historyInit()

        // draws a rectangle
        // canvas.current.add(new fabric.Rect(
        //     { top: 100, left: 100, width: 100, height: 100, fill: 'transparent', stroke: 'black' }
        // ));

        // canvas.current.on('mouse:wheel', function (opt) {
        //     var delta = opt.e.deltaY;
        //     console.log('delta :>> ', delta);
        //     var zoom = canvas.current.getZoom();
        //     zoom *= 0.999 ** delta;
        //     if (zoom > 20) zoom = 20; // max zoom
        //     if (zoom < 0.01) zoom = 0.01; //min zoom

        //     // basic zoom
        //     // canvas.current.setZoom(zoom);

        //     // to make the wheel-zoom to center the canvas around the point where the cursor is
        //     canvas.current.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);

        //     opt.e.preventDefault();
        //     opt.e.stopPropagation();

        //     // to limit the panning area
        //     // var vpt = this.viewportTransform;
        //     // if (zoom < 400 / 1000) {
        //     //     vpt[4] = 200 - 1000 * zoom / 2;
        //     //     vpt[5] = 200 - 1000 * zoom / 2;
        //     // } else {
        //     //     if (vpt[4] >= 0) {
        //     //         vpt[4] = 0;
        //     //     } else if (vpt[4] < canvas.current.getWidth() - 1000 * zoom) {
        //     //         vpt[4] = canvas.current.getWidth() - 1000 * zoom;
        //     //     }
        //     //     if (vpt[5] >= 0) {
        //     //         vpt[5] = 0;
        //     //     } else if (vpt[5] < canvas.current.getHeight() - 1000 * zoom) {
        //     //         vpt[5] = canvas.current.getHeight() - 1000 * zoom;
        //     //     }
        //     // }
        // })

        // pan on alt + mouse down
        canvas.current.on('mouse:down', function (opt) {
            var evt = opt.e;
            if (evt.altKey === true) {
                canvas.current.isDrawingMode = false
                this.isDragging = true;
                this.selection = false;
                this.lastPosX = evt.clientX;
                this.lastPosY = evt.clientY;
            }
        });
        canvas.current.on('mouse:move', function (opt) {
            if (this.isDragging) {
                // !not working
                // to prevent drawing while dragging canvas 
                if (canvas.current.isDrawingMode === true) canvas.current.isDrawingMode = false

                console.log('canvas.current.isDrawingMode :>> ', canvas.current.isDrawingMode);
                var e = opt.e;
                var vpt = this.viewportTransform;
                vpt[4] += e.clientX - this.lastPosX;
                vpt[5] += e.clientY - this.lastPosY;
                this.requestRenderAll();
                this.lastPosX = e.clientX;
                this.lastPosY = e.clientY;
            }
        });
        canvas.current.on('mouse:up', function (opt) {
            // console.log('opt. :>> ', opt.e);
            // on mouse up we want to recalculate new interaction
            // for all objects, so we call setViewportTransform
            this.setViewportTransform(this.viewportTransform);
            if (this.isDragging) canvas.current.isDrawingMode = false
            this.isDragging = false;
            this.selection = true;
        });

        canvas?.current?.on('object:added',function(options) {
            console.log('added :>> ', options?.target?.type);
        })
        canvas?.current?.on('object:modified',function(options) {
            console.log('modified',options?.target?.type);
        })
        canvas?.current?.on('object:removed',function(options) {
            console.log('removed',options?.target?.type);
        })

        // for pencil and eraser
        canvas.current.on('path:created',function(options){
            console.log('path options :>> ', options);
            const obj = options?.target
            if(obj){
                console.log('obj.type :>> ', obj.type);
            }
        })

    }, [canvas]);
    return fabricRef;
};

export default useFabric;