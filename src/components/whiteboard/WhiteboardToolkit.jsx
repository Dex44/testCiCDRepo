import { useContext } from "react";
import { WhiteboardContext } from "../../WhiteboardContext";
import { fabric } from "fabric";
import { useEffect } from "react";
import 'fabric-history';
import useFabric from "../../utils/useFabric";

const fontSize = 20;
const left = 200;
const top = 200;
const stroke = 'black';
const fill = 'transparent';
export default function WhiteboardToolkit() {
    const canvas = useContext(WhiteboardContext);

    const drawRect = () => {
        disableFreeDrawingMode()
        canvas.current.add(new fabric.Rect(
            { top, left, width: 100, height: 100, fill, stroke }
        ));
    };

    const drawCircle = () => {
        disableFreeDrawingMode()
        canvas.current.add(new fabric.Circle(
            { radius: 50, top, left, fill, stroke, }
        ));
    }

    const drawLine = () => {
        disableFreeDrawingMode()
        canvas.current.add(new fabric.Line([50, 10, 200, 150], { stroke }
        ))
    }
    const drawText = () => {
        disableFreeDrawingMode()
        // canvas.current.add(new fabric.Text('hello,\nI\'m Bhavana', {
        //     fontSize, left, top, // selectable: true
        // }
        // ))
        canvas.current.add(new fabric.Textbox('click here to type...', {
            // fontSize, left, top, // selectable: true
            fontSize, width: 200, left, top
        }
        ))
    }
    const disableFreeDrawingMode = () => canvas.current.isDrawingMode = false

    const freeDrawing = () => {
        canvas.current.freeDrawingBrush = new fabric.PencilBrush(canvas.current);
        canvas.current.isDrawingMode = true;
    }
    const eraser = (e) => {
        console.log('eraser :>> ');
        canvas.current.freeDrawingBrush = new fabric.EraserBrush(canvas.current);
        canvas.current.isDrawingMode = true;
        canvas.current.freeDrawingBrush.width = 20;
        // canvas.current.fire('object:modified')
    }

    const clear = () => {
        canvas?.current?.clear()
    }

    const zoom = (delta) => {
        var zoom = canvas.current.getZoom();
        if (delta === 114 && Math.ceil(zoom) <= 1) return; // to set zoom out till 1
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20; // max zoom in
        if (zoom < 0.01) zoom = 0.01; //max zoom out
        
        // basic zoom
        canvas.current.setZoom(zoom);

        // to make the wheel-zoom to center the canvas around the point where the cursor is
        // canvas.current.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);

        // opt.e.preventDefault();
        // opt.e.stopPropagation();

    }

    const resetZoom = () => {
        canvas.current.setZoom(1)
    }

    const save = () => {
        const aa = canvas.current.toSVG();
        var svgBlob = new Blob([aa], { type: "image/svg+xml" });
        // saveAs(blob, "whiteboard.svg");

        var svgUrl = URL.createObjectURL(svgBlob);
        var downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = 'whiteboard';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
    const undo = () => { canvas.current.undo() }
    const redo = () => { canvas.current.redo() }

    const onFileChange = async (e) => {
        const file = e.target.files[0];
        // console.log('file :>> ', file);
        console.log('loading :>> ');
        // await Promise.all(pdfToImage(e.target.files[0], canvas.current));
        pdfToImage(e.target.files[0], canvas.current)
        console.log('done :>> ');
    }

    const pdfToImage = async (pdfData, _canvas) => {
        // console.log('file :>> ', file);
        // console.log('_canvas :>> ', _canvas);
        const scale = 1 / window.devicePixelRatio;
        return (await printPDF(pdfData))
            .map(async c => {
                _canvas.add(new fabric.Image(await c, {
                    scaleX: scale,
                    scaleY: scale,
                }));
            });
    }

    async function printPDF(pdfData, pages) {
        const pdfjsLib = await getPdfHandler();
        pdfData = pdfData instanceof Blob ? await readBlob(pdfData) : pdfData;
        const data = atob(pdfData.startsWith(Base64Prefix) ? pdfData.substring(Base64Prefix.length) : pdfData);
        // Using DocumentInitParameters object to load binary data.
        const loadingTask = pdfjsLib.getDocument({ data });
        return loadingTask.promise
            .then((pdf) => {
                const numPages = pdf.numPages;
                return new Array(numPages).fill(0)
                    .map((__, i) => {
                        const pageNumber = i + 1;
                        if (pages && pages.indexOf(pageNumber) == -1) {
                            return;
                        }
                        return pdf.getPage(pageNumber)
                            .then((page) => {
                                //  retina scaling
                                const viewport = page.getViewport({ scale: window.devicePixelRatio });
                                // Prepare canvas using PDF page dimensions
                                const canvas = document.createElement('canvas');
                                const context = canvas.getContext('2d');
                                canvas.height = viewport.height
                                canvas.width = viewport.width;
                                // Render PDF page into canvas context
                                const renderContext = {
                                    canvasContext: context,
                                    viewport: viewport
                                };
                                const renderTask = page.render(renderContext);
                                return renderTask.promise.then(() => canvas);
                            });
                    });
            });
    }

    const Base64Prefix = "data:application/pdf;base64,";
    function getPdfHandler() {
        return window['pdfjs-dist/build/pdf'];
    }

    function readBlob(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result));
            reader.addEventListener('error', reject)
            reader.readAsDataURL(blob);
        })
    }

    return (
        <div style={{ margin: '1em 0' }}>
            <button onClick={freeDrawing}>Pencil</button>
            <button onClick={drawRect}>Rectangle</button>
            <button onClick={drawCircle}>Circle</button>
            <button onClick={drawLine}>Line</button>
            <button onClick={drawText}>Text</button>
            <button onClick={disableFreeDrawingMode}>Select</button>
            <button onClick={clear}>Delete</button>
            <button onClick={eraser}>Erase</button>
            <button onClick={() => zoom(-114)}>Zoom In</button>
            <button onClick={() => zoom(114)}>Zoom Out</button>
            <button onClick={resetZoom}>Reset Zoom</button>
            <button onClick={save}>Save</button>
            <button onClick={undo}>Undo</button>
            <button onClick={redo}>Redo</button>
            {/* <input type="file" accept="application/pdf" onChange={onFileChange} /> */}
        </div>
    );
}

// export const emitAdd = (options) => {
//     console.log('emitAdd', options);
// }