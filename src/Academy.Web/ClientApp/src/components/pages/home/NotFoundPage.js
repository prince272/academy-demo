import { Button } from 'react-bootstrap';
import React from 'react';

const NotFoundPage = (props) => {
    const history = props.history;

    return (
        <div className="d-flex justify-content-center h-100 text-center">
            <div className="d-flex flex-column align-items-center justify-content-center pt-2 mt-2 pb-5 mb-5">
                <div style={{ fontSize: "8rem", fontWeight: "600", lineHeight: "1" }}>404</div>
                <h5>Oops! Page Not Found</h5>
                <p>Sorry, the page you're looking for doesn't exist.</p>
                <div>
                    <Button className="m-1" variant="default" onClick={() => { history.replace('/'); }}><i className="far fa-arrow-left mr-2"></i>Home</Button>
                    <Button className="m-1" variant="primary" onClick={() => { window.location.reload(); }}><i className="far fa-redo mr-2"></i>Reload</Button>
                </div>
            </div>
        </div>);
}

export default NotFoundPage;