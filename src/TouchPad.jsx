import { useEffect, useRef, useState } from "react";

class TouchMessage {
    constructor(threshold)
    {
        this.threshold = threshold;
        this.serverAddress = "127.0.0.1";
        this.port = "80";
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
            console.log(`${this.serverAddress} ${this.port} ${this.lastx - this.startx}  ${this.lasty - this.starty}`)
        }
    }

    setPort(port)
    {
        this.port = port;
    }

    setAddress(address)
    {
        this.serverAddress = address;
    }

    getFullAddress()
    {
        return `${this.serverAddress}:${this.port}`;
    }
}

function TouchPad()
{
    const [touchMessage] = useState(new TouchMessage(50));
    const [textFeedback, setTextFeedback] = useState("Touch");
    const [workingAddress, setWorkingAddress] = useState(touchMessage.getFullAddress());
    const [started, setStarted] = useState(false);
    const touchPadRef = useRef();

    function setPort()
    {
        let val = prompt("Port", 80);
        touchMessage.setPort(Number(val));
        setWorkingAddress(touchMessage.getFullAddress());
    }

    function setAddress()
    {
        let val = prompt("Address", "127.0.0.1");
        touchMessage.setAddress(val);
        setWorkingAddress(touchMessage.getFullAddress());
    }

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
        // Adding this since preventDefault cannot be used and avoid this being called again.
        // Also, setting this as a non-passive callback intefers with other callbacks.
        if (started === false)
        {
            setStarted(true);
            let [x, y] = getClientXY(e);
            setTextFeedback(`Touch at ${x} ${y} `);
            touchMessage.newTouch(x, y);
        }
    }

    function onEnd()
    {
        if (started)
        {
            setStarted(false);
            setTextFeedback("Touch");
        }
    }

    function onMove(e)
    {
        if (started)
        {
            let [x, y] = getClientXY(e);
            setTextFeedback(`Touch at ${x} ${y} `);
            touchMessage.setClientXY(x, y);
        }
    }

    return (
        <div className="w-full">
            <p className="center">{textFeedback}</p>
            <p className="center">{workingAddress}</p>
            <div className="flex space-x-2 center place-content-center p-2">
                <button className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out" onClick={setAddress}> Set Address</button>
                <button className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out" onClick={setPort}>Set Port</button>
            </div>
            <div ref={touchPadRef} className="border-solid border-2 border-sky-500 w-full h-96" onTouchMove={onMove} onTouchStart={onStart} onTouchEnd={onEnd} onMouseDown={onStart} onMouseUp={onEnd} onMouseMove={onMove}>
            </div >
        </div>
    );
}
export default TouchPad;
