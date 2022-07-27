import React from 'react';
import { useEffect } from 'react';
import { Button, Spinner } from 'react-bootstrap';

const AppLoader = (props) => {
    const status = props.status || 'loading';
    const statusCode = props.statusCode;

    useEffect(() => {
        return async () => {
            await new Promise(resolve => setTimeout(() => resolve(), 0));
        };
    });

    if (status == 'error') {
        return (
            <div className="d-flex justify-content-center h-100 text-center">
                <div className="d-flex flex-column align-items-center justify-content-center pt-2 mt-2 pb-5 mb-5">
                    <div className="mb-3"><i className="fad fa-heart-broken" style={{ fontSize: "64px" }}></i></div>
                    <h5>{props.message || ('This page didn\'t load correctly. Please try again.')}</h5>
                    <div>
                        {props.backoff && <Button className="m-1" variant="default" onClick={() => { props.backoff(); }}><i className="far fa-arrow-left mr-2"></i>Back</Button>}
                        {props.retry && <Button className="m-1" variant="primary" onClick={() => { props.retry(); }}><i className="far fa-redo mr-2"></i>Try again</Button>}
                    </div>
                </div>
            </div>
        );
    }
    else if (status == 'loading') {
        return (
            <div className="d-flex justify-content-center h-100">
                <div className="d-flex flex-column align-items-center justify-content-center pt-2">
                    <div className="pb-2"><Spinner animation="border" className="text-primary" /></div>
                    {props.message && (<div className="pb-2">{props.message}</div>)}
                </div>
            </div>
        );
    }

    return <></>;
};

export default AppLoader;
