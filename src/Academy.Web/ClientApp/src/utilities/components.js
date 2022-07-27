import React from 'react';
import { useInterval } from "./hooks";

export const Remount = ({ delay, children }) => {
    const [key, setKey] = React.useState(1);
    useInterval(() => { setKey(key + 1); }, delay, true);
    return <React.Fragment key={key}>{children()}</React.Fragment>;
};