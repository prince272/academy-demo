import React, { forwardRef, useEffect, useRef } from 'react';

import Plyr from 'plyr';
import '../../vendor/libs/plyr/plyr.scss';

import { Card } from 'react-bootstrap';

import mime from 'mime-types';

const randomUid = () => Math.floor(Math.random() * 100000);

const ImageViewer = (props) => {
    const file = props.file;
    return <img src={file.fileUrl} className="img-fluid" />;
};

const MediaPlayer = (props) => {
    const file = props.file;

    const plyrRef = useRef(null);

    useEffect(() => {
        const plyrId = `react-plyr-${randomUid()}`;
        plyrRef.current.style.display = 'block';
        plyrRef.current.id = plyrId;
        const plyr = new Plyr(`#${plyrId}`);
          
        return () => {
            if (plyr != null) {
                plyr.destroy();
            }
        };
    }, [])

    if (file.fileType == 'video') {
        return (
            <video ref={plyrRef} playsInline controls style={{ display: "none" }}>
                <source src={file.fileUrl} type={mime.contentType(file.fileName)} />
            </video>

        );
    }
    else if (file.fileType == 'audio') {
        return (
            <Card>
                <Card.Body className="p-3">
                    <audio ref={plyrRef} controls style={{ display: "none" }}>
                        <source src={file.fileUrl} type={mime.contentType(file.contentType)} />
                    </audio>
                </Card.Body>
            </Card>
        );
    }
};

const FileViewer = (props) => {
    const file = props.file;

    switch (file.fileType) {
        case 'image':
            return <ImageViewer {...props} />;

        case 'video':
        case 'audio':
            return <MediaPlayer {...props} />;

        default: return <></>;
    }
};

export default FileViewer;