
import useFabric from "../../utils/useFabric";
import WhiteboardToolkit from "./WhiteboardToolkit";

export default function WhiteboardCanvas() {
    const fabricRef = useFabric();
    return (
        <>
            <div className="toolkit">
                <WhiteboardToolkit />
            </div>
            <canvas className="whiteboard_container" style={{ border: '1px solid black' }} ref={fabricRef} />
        </>
    );
}