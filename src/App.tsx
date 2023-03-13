import React, {useCallback, useEffect, useRef, useState} from 'react';
import useWebSocket, {ReadyState} from "react-use-websocket";
import {notification, Row, Col} from "antd";
import moment from "moment";
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import {LatLngExpression} from "leaflet";
import 'leaflet/dist/leaflet.css';
import * as XLSX from "xlsx";
import * as FileSaver from "file-saver";

import './App.css';
import Loader from "@/components/Loader";
import Login from "@/components/Login";
import {PinRed, PinGreen} from "@/components/Pin";
import ExportXLS from "@/components/ExportXLS";
import decode from "@/helpers/decode";

const websocketUrl = "wss://admin.iotvega.com/ws";
const devEui = "353234306D307817";
const position:LatLngExpression = [55.013872, 82.954099];
const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
const fileExtension = ".xlsx";
const reasons = [
    "-",
    "Current state",
    "Sensor 1",
    "Sensor 2",
    "Accelerometer",
    "Humidity limit",
    "Temperature limit",
]

function App() {
    const [token, setToken] = useState(sessionStorage.getItem('token'));
    const [deviceState, setDeviceState] = useState<Record<string, any>>({
        isOpen: false,
        reason: "-",

    });
    const lastSentMessageRef = useRef("");
    const [api, contextHolder] = notification.useNotification();

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

    const handleGetData = useCallback((values:string[]) => {
        const [start, end] = values;

        send(JSON.stringify({
            cmd: "get_data_req",
            devEui,
            select: {
                date_from: moment(start).startOf("day").valueOf(),
                date_to: moment(end).endOf("day").valueOf(),
            }
        }))
    }, [send]);

    const exportToCSV = useCallback((apiData: any[]) => {
        const ws = XLSX.utils.json_to_sheet(apiData);
        const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, `${new Date().getTime()} ${fileExtension}`);
    },[]);

    useEffect(() => {
        if(readyState === ReadyState.OPEN){
            if(token) {
                recoverAuth();
            }

            send(JSON.stringify({
                cmd: "get_data_req",
                devEui,
                select: {
                    limit: 1
                }
            }));
        }
    // eslint-disable-next-line
    }, [readyState, recoverAuth]);

    useEffect(() => {
        if (lastMessage !== null) {
            const data = JSON.parse(lastMessage?.data);
            if(data?.status) {
                switch (data?.cmd) {
                    case 'auth_resp':
                        sessionStorage.setItem('token', data?.token);
                        setToken(data?.token);
                        break;
                    case 'token_auth_resp':
                        sessionStorage.setItem('token', data?.token);
                        setToken(data?.token);
                        break;
                    case 'get_data_resp':
                        if(data?.data_list?.length) {
                            if(data.data_list.length === 1) {
                                const decoded = decode(data.data_list[0].data);
                                setDeviceState(prev => ({
                                    ...prev,
                                    fcnt: data.data_list[0].fcnt,
                                    isOpen: decoded.sensor1 || decoded.sensor2,
                                    ...decoded,
                                }));
                            } else {
                                exportToCSV(data.data_list);
                                // todo: export rest (totalNum - data_list.length)
                            }
                        }
                        break;
                }
            } else {
                switch (data?.err_string) {
                    case 'unknown_auth':
                        if(token) {
                            recoverAuth();
                            if(lastSentMessageRef.current) {
                                send(lastSentMessageRef.current);
                                lastSentMessageRef.current = "";
                            }
                        } else {
                            sessionStorage.removeItem('token');
                            setToken("");
                            lastSentMessageRef.current = "";
                        }
                        break;
                    case 'invalid_token':
                        sessionStorage.removeItem('token');
                        setToken("");
                        lastSentMessageRef.current = "";
                        break;
                    default:
                        if(data?.cmd === "rx") {
                            const decoded = decode(data.data);
                            setDeviceState(prev => ({
                                ...prev,
                                fcnt: data.fcnt,
                                isOpen: decoded.sensor1 || decoded.sensor2,
                                ...decoded
                            }));
                        } else {
                            api['error']({
                                message: data?.err_string,
                            });
                        }
                }
            }
        }
    }, [lastMessage, recoverAuth, send, token, api, exportToCSV]);

    return (
        <>
            {contextHolder}
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
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12} lg={6}>
                                Reason: {reasons[deviceState?.reason]}
                            </Col>
                            <Col xs={24} md={12} lg={6}>
                                Power: {deviceState?.power}%
                            </Col>
                            <Col xs={24} md={12} lg={6}>
                                Time: {moment.unix(deviceState?.time,).format("DD MMMM YYYY HH:mm")}
                            </Col>
                            <Col xs={24} md={12} lg={6}>
                                Temperature: {deviceState?.temperature} &deg;C
                            </Col>
                            <Col xs={24} md={12} lg={6}>
                                Humidity: {deviceState?.humidity}%
                            </Col>
                            <Col xs={24} md={12} lg={6}>
                                State: {deviceState?.isOpen ? 'Opened' : 'Closed'}
                            </Col>
                            <Col xs={24} md={12} lg={6}>
                                Angle: {deviceState?.angle}&deg;
                            </Col>
                            <Col xs={24} md={12} lg={6}>
                                fcnt: {deviceState?.fcnt}
                            </Col>
                        </Row>
                        <ExportXLS onExport={handleGetData} />
                        <MapContainer center={position} zoom={13} className="map-container">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={position} icon={deviceState?.isOpen ? PinRed : PinGreen} />
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
