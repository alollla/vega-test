import React, {useCallback, useEffect, useState} from 'react';
import './App.css';
import useWebSocket, {ReadyState} from "react-use-websocket";

const websocketUrl = "wss://admin.iotvega.com/ws";
const login = "quest";
const password = "tset";
const devEui = "353234306D307817";

function App() {
    const [messageHistory, setMessageHistory] = useState<any[]>([]);

    const {sendMessage, lastMessage, readyState} = useWebSocket(websocketUrl);

    useEffect(() => {
        if (lastMessage !== null) {
            console.log(JSON.parse(lastMessage?.data))
            setMessageHistory((prev) => prev.concat(lastMessage));
        }
    }, [lastMessage, setMessageHistory]);

    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    const handleAuth = useCallback(() => sendMessage(JSON.stringify({
        cmd: "auth_req",
        login,
        password
    })), [sendMessage]);

    const handleGetData = useCallback(() => sendMessage(JSON.stringify({
        cmd: "get_data_req",
        devEui,
        select: {
            date_from: new Date().getTime() - 60 * 60 * 1000,
            limit: 100
        }
    })), [sendMessage]);

    const handleGetDevices = useCallback(() => sendMessage(JSON.stringify({
        cmd: "get_devices_req",
    })), [sendMessage]);

    const handleGetServerInfo = useCallback(() => sendMessage(JSON.stringify({
        cmd: "server_info_req",
    })), [sendMessage]);

    const handleGetDeviceRX = useCallback(() => sendMessage(JSON.stringify({
        cmd: "rx",
        devEui,
        appEui: "736D687330313031",
        ts: 1678370989901,
        gatewayId: "000040BD32E53B9B",
        ack: false,
        fcnt: 237,
        port: 2,
        data: "016360e60964e7001a0000011e320a28",
        freq: 864300000,
        dr: "SF7 BW125 4/5",
        rssi: -61,
        snr: 9.8,
        type: "CONF_UP"
    })), [sendMessage]);

    return (
        <div className="App">
            <button
                onClick={handleAuth}
                disabled={readyState !== ReadyState.OPEN}
            >
                Auth
            </button>

            <button
                onClick={handleGetData}
                disabled={readyState !== ReadyState.OPEN}
            >
                getData
            </button>

            <button
                onClick={handleGetServerInfo}
                disabled={readyState !== ReadyState.OPEN}
            >
                getServerInfo
            </button>

            <button
                onClick={handleGetDevices}
                disabled={readyState !== ReadyState.OPEN}
            >
                getDevices
            </button>

            <button
                onClick={handleGetDeviceRX}
                disabled={readyState !== ReadyState.OPEN}
            >
                getDeviceRX
            </button>

            <p>The WebSocket is currently {connectionStatus}</p>
            <ul>
                {messageHistory.map((message: any, idx) => (
                    <li key={idx} style={{
                        marginBottom: 16
                    }}>{message ? message?.data : null}</li>
                ))}
            </ul>
        </div>
    );
}

export default App;
