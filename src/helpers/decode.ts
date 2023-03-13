function hexToInt16(hex:string) {
    const data = hex.match(/../g);
    // Create a buffer
    const buf = new ArrayBuffer(2);
    // Create a data view of it
    const view = new DataView(buf);

    // set bytes
    data?.forEach(function (b, i) {
        view.setUint8(i, parseInt(b, 16));
    });

    return view.getInt16(0, true);
}

function hexToUint32(hex:string) {
    const data = hex.match(/../g);
    // Create a buffer
    const buf = new ArrayBuffer(4);
    // Create a data view of it
    const view = new DataView(buf);

    // set bytes
    data?.forEach(function (b, i) {
        view.setUint8(i, parseInt(b, 16));
    });

    return view.getUint32(0, true);
}

export default function decode(hex:string) {
    const reason = parseInt(hex.substring(0,2), 16);
    const power = parseInt(hex.substring(2,4), 16);
    const time = hexToUint32(hex.substring(4,12));
    const temperature = hexToInt16(hex.substring(12,16))/10;
    const humidity = parseInt(hex.substring(16,18), 16);
    const sensor1 = parseInt(hex.substring(18,20), 16);
    const sensor2 = parseInt(hex.substring(20,22), 16);
    const angle = parseInt(hex.substring(22,24), 16);
    const humMin = parseInt(hex.substring(24,26), 16);
    const humMax = parseInt(hex.substring(26,28), 16);
    const tempMin = parseInt(hex.substring(28,30), 16);
    const tempMax = parseInt(hex.substring(30,32), 16);

    return {
        reason,
        power,
        time,
        temperature,
        humidity,
        sensor1,
        sensor2,
        angle,
        humMin,
        humMax,
        tempMin,
        tempMax
    }
}