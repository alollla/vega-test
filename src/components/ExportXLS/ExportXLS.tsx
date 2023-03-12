import React, {useCallback, useState} from "react";
import {Button, DatePicker} from "antd";

import "./ExportXLS.css"
import moment from "moment";

type ExportProps = {
    onExport: ([start, end]: string[]) => void
}

const {RangePicker} = DatePicker;

const ExportXLS: React.FC<ExportProps> = ({onExport}: ExportProps) => {
    const [value, setValue] = useState<string[]>([]);

    const handleRangeChange = useCallback((value: any, dateString: [string, string]) => {
        setValue(dateString);
    }, []);

    return <div className="export-wrapper">
        <RangePicker onChange={handleRangeChange}
                     disabledDate={(current) => {
                         let tomorrow = moment().add(1, "day").format("YYYY-MM-DD");
                         return current && current > moment(tomorrow, "YYYY-MM-DD");
                     }}
        />
        <Button onClick={() => onExport(value)} type="primary" disabled={value.length !== 2}>Export</Button>
    </div>;
}

export default ExportXLS;