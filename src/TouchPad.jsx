import { useRef, useState } from "react";
import mqtt from "precompiled-mqtt";
import Dropdown from 'react-dropdown';

const LEFT = "left";
const RIGHT = "right";

class Touch {
    constructor(threshold) {
        this.threshold = threshold;
    }

    newTouch(startx, starty) {
        this.startx = startx;
        this.starty = starty;
        this.lastx = startx;
        this.lasty = starty;
    }

    setClientXY(x, y) {
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
        return sendMessage;
    }
}

class TouchMessage {
    constructor(threshold, messageCallback)
    {
        this.serverAddress = "127.0.0.1";
        this.port = 80;
        this.protocol = "ws";
        this.messagCallback = messageCallback;
        this.mqttClient = null;
        this.useSSL = true;
        this.leftTouch = new Touch(threshold);
        this.rightTouch = new Touch(threshold);
    }

    connect()
    {
        const us = {
            clientId: Math.random().toString(16),
            /* username: mqtt.username, */
            /* password: mqtt.password, */
            useSSL: this.useSSL,
            /* onSuccess: onAction, */
            /* onFailure: onAction, */
            /* protocolId: 'MQTT', */
            /* protocolVersion: 3, */
            rejectUnauthorized: false,
            clean: true,
            /* reconnectPeriod: 20000, */
            /* connectTimeout: 30 * 1000, */
            protocol: this.protocol,
        };

        console.log("Connecting with: " + JSON.stringify(us));

        // If client exists, make sure it's disconnected
        if (this.mqttClient !== null)
        {
            this.mqttClient.end(true);
        }

        this.mqttClient = mqtt.connect(this.getFullAddress(), us);

        // publish messages to UI
        ["connect", "end", "error", "close", "reconnect", "disconnect", "message"].forEach((val) => {
            this.mqttClient.on(val, () => {
                this.messagCallback(val);
            });
        });
    }

    newTouch(startx, starty, side)
    {
        if (side === LEFT) {
            this.leftTouch.newTouch(startx, starty);
        } else if (side === RIGHT) {
            this.rightTouch.newTouch(startx, starty);
        }
    }

    setClientXY(x, y, side)
    {
        let touch;
        if (side === LEFT) {
            touch = this.leftTouch;
        } else if (side === RIGHT) {
            touch = this.rightTouch;
        }

        let sendMessage = touch.setClientXY(x, y);

        if (sendMessage)
        {
            let _x = (touch.lasty - touch.starty) / 100;
            let _y = (touch.lastx - touch.startx) / 100;
            // mqtt send with lastx and lasty
            console.log(`${side} ${this.serverAddress} ${this.port}   ${_y}  ${_x}`)
            if (this.mqttClient !== null && this.mqttClient.connected)
            {
                if (side === LEFT) {
                    this.mqttClient.publish("getReal3D/strafeAxis", _y.toString(5));
                    this.mqttClient.publish("getReal3D/forwardAxis", _x.toString(5));
                } else if (side === RIGHT) {
                    this.mqttClient.publish("getReal3D/yawAxis", _y.toString(5));
                    this.mqttClient.publish("getReal3D/pitchAxis", _x.toString(5));
                }
            }
        }
    }

    wandButtonUp()
    {
        this.mqttClient.publish("getReal3D/wandButtonUp", "True");
    }

    wandButtonDown()
    {
        this.mqttClient.publish("getReal3D/wandButtonDown", "True");
    }

    setProtcol(protocol)
    {
        this.protocol = protocol;
        this.useSSL = this.protocol === "wss";
    }

    setPort(port) {
        this.port = port;
    }

    setAddress(address) {
        this.serverAddress = address;
    }

    getFullAddress() {
        return `${this.protocol}://${this.serverAddress}:${this.port}`;
    }
}

function TouchPad()
{
    const [message, setMessage] = useState("");
    const [touchMessage] = useState(new TouchMessage(5, setMessage));
    const [textFeedback, setTextFeedback] = useState("Touch");
    const [workingAddress, setWorkingAddress] = useState(touchMessage.getFullAddress());
    const [startedRight, setStartedRight] = useState(false);
    const [startedLeft, setStartedLeft] = useState(false);
    const touchPadRef1 = useRef();
    const touchPadRef2 = useRef();

    function setProtocol(val)
    {
        touchMessage.setProtcol(val.value);
        setWorkingAddress(touchMessage.getFullAddress());
    }

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

    function connect()
    {
        touchMessage.connect();
    }

    function wandButtonDown()
    {
        touchMessage.wandButtonDown();
    }

    function wandButtonUp()
    {
        touchMessage.wandButtonUp();
    }

    function getClientXY(e)
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

    function onStartRight(e)
    {
        // Adding this since preventDefault cannot be used and avoid this being called again.
        // Also, setting this as a non-passive callback intefers with other callbacks.
        if (startedRight === false)
        {
            setStartedRight(true);
            let [x, y] = getClientXY(e);
            setTextFeedback(`Touch at ${x} ${y} `);
            touchMessage.newTouch(x, y, RIGHT);
        }
    }

    function onEndRight()
    {
        if (startedRight)
        {
            setStartedRight(false);
            setTextFeedback("Touch");
        }
    }

    function onMoveRight(e)
    {
        if (startedRight)
        {
            let [x, y] = getClientXY(e);
            setTextFeedback(`Touch at ${x} ${y} `);
            touchMessage.setClientXY(x, y, RIGHT);
        }
    }

    function onStartLeft(e)
    {
        // Adding this since preventDefault cannot be used and avoid this being called again.
        // Also, setting this as a non-passive callback intefers with other callbacks.
        if (startedLeft === false)
        {
            setStartedLeft(true);
            let [x, y] = getClientXY(e);
            setTextFeedback(`Touch at ${x} ${y} `);
            touchMessage.newTouch(x, y, LEFT);
        }
    }

    function onEndLeft()
    {
        if (startedLeft)
        {
            setStartedLeft(false);
            setTextFeedback("Touch");
        }
    }

    function onMoveLeft(e)
    {
        if (startedLeft)
        {
            let [x, y] = getClientXY(e);
            setTextFeedback(`Touch at ${x} ${y} `);
            touchMessage.setClientXY(x, y, LEFT);
        }
    }

    return (
        <div className="w-full overscroll-contain">
            <p className="center">{textFeedback}</p>
            <p className="center">Connection state: {message}</p>
            <p className="center">{workingAddress}</p>
            <div className="flex space-x-2 center place-content-center p-2">
                <div className="">
                    Set Protocol
                    <Dropdown placeholder={touchMessage.protocol} options={["wss", "ws"]} placeholderClassName="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out" onChange={setProtocol} />
                </div>
                <button className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out" onClick={setAddress}> Set Address</button>
                <button className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out" onClick={setPort}>Set Port</button>
                <button className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out" onClick={connect}>Connect</button>
            </div>
            <div className="flex space-x-2 p-2">
                <div ref={touchPadRef1}
                    className="border-solid border-2 border-sky-500 w-1/2 h-96 overscroll-contain overscroll-y-contain"
                    onTouchMove={onMoveLeft}
                    onTouchStart={onStartLeft}
                    onTouchEnd={onEndLeft}
                    onMouseDown={onStartLeft}
                    onMouseUp={onEndLeft}
                    onMouseMove={onMoveLeft}>
                    <div className="select-none">left touch pad (forward/strafe)</div>
                </div>
                <div ref={touchPadRef2}
                    className="border-solid border-2 border-sky-500 w-1/2 h-96 overscroll-contain overscroll-y-contain"
                    onTouchMove={onMoveRight}
                    onTouchStart={onStartRight}
                    onTouchEnd={onEndRight}
                    onMouseDown={onStartRight}
                    onMouseUp={onEndRight}
                    onMouseMove={onMoveRight}>
                    <div className="select-none">right touch pad (pitch/yaw)</div>
                </div >
            </div>
            <div className="flex space-x-2 center place-content-center p-2">
                <button className="inline-block w-48 h-16 px-6 py-2.5 bg-green-800 text-white font-large text-s rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-900 active:shadow-lg transition duration-150 ease-in-out" onMouseDown={wandButtonDown} onMouseUp={wandButtonUp} onTouchStart={wandButtonDown} onTouchEnd={wandButtonUp}>Wand button</button>
            </div>
        </div>
    );
}
export default TouchPad;
