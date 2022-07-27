
import { Button, Card, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import React, { useEffect, useState } from 'react';
import TruncateMarkup from 'react-truncate-markup';
import { withRemount, resolveDndResult, useStateCallback, downloadFromUrl } from '../../../utilities';
import toast from 'react-hot-toast';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import AppLoader from '../../shared/AppLoader';
import appService from '../../../utilities/appService';

const LessonPage = (props) => {
    const dispatcher = props.dispatcher;

    const [loading, setLoading] = useState({});
    const loadingProps = { retry: props.remount };

    const courseId = props.match.params.courseId;
    const sectionId = props.match.params.sectionId;
    const lessonId = props.match.params.lessonId;

    const [lesson, setLesson] = useState(null);
    const [contents, setContents] = useStateCallback(null);

    const handleDragEnd = async (result) => {
        var position = resolveDndResult(result);
        position = { ...position, parentId: lessonId };
        reorderContents(position);
        await appService.reorderCourses(position);
    };

    const reorderContents = (position) => {
        if (position.destination == null) return;
        if (position.destination.droppableId == position.source.droppableId &&
            position.destination.index == position.source.index) return;

        const source = position.source;
        const destination = position.destination;

        // Clone the data to prevent nested values within the data from been rendered when their values change.
        let items = JSON.parse(JSON.stringify(contents));

        if (position.type == 'content') {
            const reorderItem = items.splice(source.index, 1)[0];
            items.splice(destination.index, 0, reorderItem);
            items.forEach((item, itemIndex) => {
                item.priority = itemIndex + 1;
            });

            setContents(items);
        }
    };

    useEffect(() => {
        ((async () => {
            setLoading({});

            const lessonResult = await appService.populateCourses({ courseId, sectionId, lessonId });

            if (!lessonResult.success) {
                setLoading({ status: 'error', message: lessonResult.message });
            }
            else {
                setLesson(lessonResult.data);
                setContents(lessonResult.data.contents);
                setLoading(null);
            }

        })());
    }, []);

    useEffect(() => {
        const ADD_CONTENT = (content) => {
            setContents(contents => { return ([...contents, content]); });
        };
        const EDIT_CONTENT = (content) => {
            setContents(contents => { return contents.map(c => c.id != content.id ? c : content); });
        };
        const DELETE_CONTENT = (content) => {
            setContents(contents => { return contents.filter((c) => c.id != content.id); });
        };
        const IMPORT_CONTENTS = async () => {
            props.remount();
        };

        dispatcher.on('ADD_CONTENT', ADD_CONTENT);
        dispatcher.on('EDIT_CONTENT', EDIT_CONTENT);
        dispatcher.on('DELETE_CONTENT', DELETE_CONTENT);
        dispatcher.on('IMPORT_CONTENTS', IMPORT_CONTENTS);

        return () => {
            dispatcher.off('ADD_CONTENT', ADD_CONTENT);
            dispatcher.off('EDIT_CONTENT', EDIT_CONTENT);
            dispatcher.off('DELETE_CONTENT', DELETE_CONTENT);
            dispatcher.off('IMPORT_CONTENTS', IMPORT_CONTENTS);
        };
    }, []);

    if (loading != null) {
        return <AppLoader {...loadingProps} {...loading} />
    }

    return (
        <>
            <div className="container container-p-x pt-0 pb-3">
                <div className="d-flex flex-wrap align-items-center justify-content-between py-3 bg-body position-sticky" style={{ top: "58px", zIndex: 1 }}>
                    <div>
                        <Button variant="default" as={Link} to={`/courses/${courseId}`}><i className="far fa-arrow-left mr-2"></i>Sections</Button>
                    </div>
                    <div className="d-flex">
                        <Button variant="primary" as={Link} to={`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/contents/add`}><i className="far fa-plus mr-2"></i>Add Content</Button>
                    </div>
                </div>
                <h1 className="h4 text-truncate">{lesson.title} - Contents ({contents.length})</h1>

                <div className="row justify-content-center">
                    <div className="col-12 col-md-8">
                        {(contents.length > 0) &&
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId={`droppable_1_1`} direction="vertical" type="content">
                                    {(droppableProvided) => (
                                        <div className="row" ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                                            {contents.map((content, contentIndex) => (
                                                <Draggable draggableId={`draggable_1_${content.id}`} index={contentIndex} key={content.id}>
                                                    {(draggableProvided) => (
                                                        <div className="col-12 pb-2" ref={draggableProvided.innerRef} {...draggableProvided.draggableProps}>
                                                            <Card>
                                                                <Card.Body className="p-0 d-flex justify-content-between align-items-center">
                                                                    <div className="p-2 d-flex align-items-center flex-grow-1 position-relative">
                                                                        <div className="d-flex align-items-center flex-grow-1 pl-3 pr-2">
                                                                            <div className="flex-grow-1 text-break">
                                                                                <Card.Title className="mb-0">
                                                                                    <Link className="text-reset stretched-link" to={`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/contents/${content.id}/edit`}>
                                                                                        <div className="mr-2">Content #{contentIndex + 1}</div>
                                                                                    </Link>
                                                                                </Card.Title>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-2 d-flex">
                                                                        <div className="mr-2">
                                                                            <OverlayTrigger overlay={(props) => <Tooltip {...props}>Drag</Tooltip>}>
                                                                                <Button as="div" variant="default" className="icon-btn borderless"  {...draggableProvided.dragHandleProps}>
                                                                                    <i className={`far fa-arrows-alt`}></i>
                                                                                </Button>
                                                                            </OverlayTrigger>
                                                                        </div>
                                                                        <OverlayTrigger overlay={(props) => <Tooltip {...props}>Options</Tooltip>}>
                                                                            <Dropdown className="dropdown-toggle-hide-arrow" drop="left">
                                                                                <Dropdown.Toggle variant="default" className="icon-btn borderless">
                                                                                    <i className={`far fa-ellipsis-v`}></i>
                                                                                </Dropdown.Toggle>
                                                                                <Dropdown.Menu>
                                                                                    <Dropdown.Item as={Link} to={`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/contents/${content.id}/edit`}>Edit</Dropdown.Item>
                                                                                    <Dropdown.Item as={Link} to={`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/contents/${content.id}/delete`}>Delete</Dropdown.Item>
                                                                                </Dropdown.Menu>
                                                                            </Dropdown>
                                                                        </OverlayTrigger>
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {droppableProvided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        }
                        {(contents.length == 0) &&
                            <div className="row justify-content-center text-center">
                                <div className="col-lg-8 py-5">
                                    <div className="pt-5">
                                        <div className="mb-3"><i className="fad fa-books" style={{ fontSize: "64px" }}></i></div>
                                        <h4>Add and manage contents</h4>
                                        <p>This is where you’ll add contents and manage them.</p>
                                    <Button variant="primary" as={Link} to={`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/contents/add`}><i className="far fa-plus mr-2"></i>Add Content</Button></div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </>
    );
};

export default withRemount(LessonPage);