import { useEffect, useRef, useState } from "react";

class TouchMessage
{
    constructor(threshold)
    {
        this.threshold = threshold;
    }

    newTouch(startx, starty)
    {
        this.startx = startx;
        this.starty = starty;
        this.lastx = startx;
        this.lasty = starty;
    }

    setClientXY(x, y)
    {
        let sendMessage = false;
        if (Math.abs(x - this.lastx) > this.threshold)
        {
            sendMessage = true;
            this.lastx = x;
        }

        if (Math.abs(y - this.lasty) > this.threshold)
        {
            sendMessage = true;
            this.lasty = y;
        }

        if (sendMessage)
        {
            // mqtt send with lastx and lasty
            console.log(`${this.lastx - this.startx}  ${this.lasty - this.starty}`)
        }
    }
}

function TouchPad()
{
    const [textFeedback, setTextFeedback] = useState("Touch");
    const touchPadRef = useRef();
    let _started = false;
    const touchMessage = new TouchMessage(50);

    useEffect(() => {
        touchPadRef.current.addEventListener("mousedown", onStart, {passive: false});
        touchPadRef.current.addEventListener("touchstart", onStart, { passive: false });
        touchPadRef.current.addEventListener("mouseup", onEnd, { passive: false });
        touchPadRef.current.addEventListener("touchend", onEnd, { passive: false });
        touchPadRef.current.addEventListener("mousemove", onMove, { passive: false });
        touchPadRef.current.addEventListener("touchmove", onMove, { passive: false });

    }, [touchPadRef]);

    function getClientXY (e)
    {
        let x = 0, y = 0 ;
        if (e.type === "touchstart" || e.type === "touchmove")
        {
            let touch = e.touches[0];
            x = touch.clientX;
            y = touch.clientY;
        }
        else
        {
            x = e.clientX;
            y = e.clientY;
        }
        return [x, y];
    }

    function onStart(e)
    {
        e.preventDefault();
        _started = true;
        let [x, y] = getClientXY(e);
        setTextFeedback(`Touch at ${x} ${y} `);
        touchMessage.newTouch(x, y);
    }

    function onEnd(e)
    {
        e.preventDefault();
        _started = false;
        setTextFeedback("Touch");
    }

    function onMove(e)
    {
        e.preventDefault();
        /* console.log(started); */
        if (_started)
        {
            let [x, y] = getClientXY(e);
            setTextFeedback(`Touch at ${x} ${y} `);
            touchMessage.setClientXY(x, y);
        }
    }

    return (
        <div className="w-full">
            <p className="center">{textFeedback}</p>
            <div ref={touchPadRef} className="border-solid border-2 border-sky-500 w-full h-96">
            </div >
        </div>
    );
}
export default TouchPad;
