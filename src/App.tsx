import React, {useCallback, useEffect, useRef, useState} from 'react';
import useWebSocket, {ReadyState} from "react-use-websocket";
import {Alert} from "antd";
import moment from "moment";
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import {LatLngExpression} from "leaflet";
import 'leaflet/dist/leaflet.css';

import './App.css';
import Loader from "@/components/Loader";
import Login from "@/components/Login";
import Pin from "@/components/Pin";

const websocketUrl = "wss://admin.iotvega.com/ws";
const devEui = "353234306D307817";
const position:LatLngExpression = [55.013872, 82.954099];

function App() {
    const [token, setToken] = useState(sessionStorage.getItem('token'));
    const [alert, setAlert] = useState("");
    const lastSentMessageRef = useRef("");

    const {sendMessage, lastMessage, readyState} = useWebSocket(websocketUrl);

    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    const send = useCallback((message: string) => {
        lastSentMessageRef.current = message;
        sendMessage(message);
    }, [sendMessage]);

    const handleAuth = useCallback((values: any) => {
        const { login, password } = values;

        sendMessage(JSON.stringify({
            cmd: "auth_req",
            login,
            password
        }))
    }, [sendMessage]);

    const recoverAuth = useCallback(() => {
        sendMessage(JSON.stringify({
            cmd: "token_auth_req",
            token,
        }))
    }, [sendMessage, token]);

    const handleGetData = useCallback(() => send(JSON.stringify({
        cmd: "get_data_req",
        devEui,
        select: {
            date_from: moment().subtract(7, "days").valueOf(),
        }
    })), [send]);

    const handleGetDevices = useCallback(() => send(JSON.stringify({
        cmd: "get_devices_req",
    })), [send]);

    const handleGetDeviceRX = useCallback(() => send(JSON.stringify({
        cmd: "rx",
        devEui,
        appEui: "",
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
    })), [send]);

    useEffect(() => {
        if (lastMessage !== null) {
            const data = JSON.parse(lastMessage?.data);
            console.log("lastMessage", data)

            if(data?.status) {
                setAlert("");
                switch (data?.cmd) {
                    case 'auth_resp':
                        sessionStorage.setItem('token', data?.token);
                        setToken(data?.token);
                        break;
                    case 'token_auth_resp':
                        sessionStorage.setItem('token', data?.token);
                        break;
                    default:
                }
            } else {
                setAlert(data?.err_string);
                switch (data?.err_string) {
                    case 'unknown_auth':
                        if(token) {
                            recoverAuth();
                            send(lastSentMessageRef.current);
                        }
                        break;
                    case 'invalid_token':
                        sessionStorage.removeItem('token');
                        setToken("");
                        break;
                }
            }
        }
    }, [lastMessage, recoverAuth, send, token]);

    return (
        <>
            <header>
                <div className="container">
                    <p>The WebSocket is currently {connectionStatus}</p>
                </div>
            </header>
            <main>
                {
                    readyState !== ReadyState.OPEN && <Loader />
                }
                {
                    readyState === ReadyState.OPEN && !token && <Login onFinish={handleAuth} />
                }
                {
                    readyState === ReadyState.OPEN && token &&
                    <div className="container">
                        {
                            alert && <Alert message={alert} type="error" closable />
                        }

                        <button
                            onClick={handleGetData}
                            disabled={readyState !== ReadyState.OPEN}
                        >
                            getData
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
                        <MapContainer center={position} zoom={13} className="map-container">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={position} icon={Pin} />
                        </MapContainer>
                    </div>
                }
            </main>
            <footer>
                <div className="container">
                    <p>Created by @alollla</p>
                </div>
            </footer>
        </>
    );
}

export default App;
