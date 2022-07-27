import React from 'react';
import './App.scss';

import AppRouter from './shared/AppRouter';
import AppToastor from './shared/AppToastor';
import { EventDispatcher } from '../utilities';
import { useState } from 'react';
import { Modal } from 'react-bootstrap';


const App = (props) => {
    const dispatcher = new EventDispatcher();

    const [blockPageState, setBlockPageState] = useState({ blocked: false, content: null });
    const blockPage = (content) => {
        setBlockPageState({ blocked: true, content });
    };
    const unblockPage = () => {
        setBlockPageState({ blocked: false, content: null });
    };


    return (
        <>
            <AppRouter {...props} {...{ dispatcher, blockPage, unblockPage }} />
            <AppToastor />
            <Modal show={blockPageState.blocked} className="modal-fill-in" animation={false} backdrop="static" onHide={() => unblockPage()}>
                <Modal.Body>
                    {blockPageState.content}
                </Modal.Body>
            </Modal >
        </>
    );
}

export default App;