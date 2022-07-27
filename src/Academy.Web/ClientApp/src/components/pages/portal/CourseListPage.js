import { Button, ButtonGroup, Card, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import React, { useEffect, useState } from 'react';
import TruncateMarkup from 'react-truncate-markup';
import { withRemount, resolveDndResult, useStateCallback, downloadFromUrl } from '../../../utilities';
import toast from 'react-hot-toast';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import AppLoader from '../../shared/AppLoader';
import appService from '../../../utilities/appService';

const CourseListPage = (props) => {
    const dispatcher = props.dispatcher;

    const [loading, setLoading] = useState({});
    const loadingProps = { retry: props.remount };

    const blockPage = props.blockPage;
    const unblockPage = props.unblockPage;

    const [courses, setCourses] = useStateCallback(null);

    const handleDragEnd = async (result) => {
        var position = resolveDndResult(result);
        reorderCourses(position);
        await appService.reorderCourses(position);
    };

    const reorderCourses = (position) => {
        if (position.destination == null) return;
        if (position.destination.droppableId == position.source.droppableId &&
            position.destination.index == position.source.index) return;

        const source = position.source;
        const destination = position.destination;

        // Clone the data to prevent nested values within the data from been rendered when their values change.
        let items = JSON.parse(JSON.stringify(courses));

        if (position.type == 'course') {
            const reorderItem = items.splice(source.index, 1)[0];
            items.splice(destination.index, 0, reorderItem);
            items.forEach((item, itemIndex) => {
                item.priority = itemIndex + 1;
            });

            setCourses(items);
        }
    };

    useEffect(() => {
        ((async () => {
            setLoading({});

            const coursesResult = await appService.populateCourses();

            if (!coursesResult.success) {
                setLoading({ status: 'error', message: coursesResult.message });
            }
            else {
                setCourses(coursesResult.data);
                setLoading(null);
            }

        })());
    }, []);

    useEffect(() => {
        const ADD_COURSE = (course) => {
            setCourses(courses => { return ([...courses, course]); });
        };
        const EDIT_COURSE = (course) => {
            setCourses(courses => { return courses.map(c => c.id != course.id ? c : course); });
        };
        const DELETE_COURSE = (course) => {
            setCourses(courses => { return courses.filter((c) => c.id != course.id); });
        };
        const IMPORT_COURSES = async () => {
            props.remount();
        };

        dispatcher.on('ADD_COURSE', ADD_COURSE);
        dispatcher.on('EDIT_COURSE', EDIT_COURSE);
        dispatcher.on('DELETE_COURSE', DELETE_COURSE);
        dispatcher.on('IMPORT_COURSES', IMPORT_COURSES);

        return () => {
            dispatcher.off('ADD_COURSE', ADD_COURSE);
            dispatcher.off('EDIT_COURSE', EDIT_COURSE);
            dispatcher.off('DELETE_COURSE', DELETE_COURSE);
            dispatcher.off('IMPORT_COURSES', IMPORT_COURSES);
        };
    }, []);

    if (loading != null) {
        return <AppLoader {...loadingProps} {...loading} />
    }

    return (
        <>
            <div className="container container-p-x pt-0 pb-3">
                <div className="d-flex flex-wrap align-items-center justify-content-between py-3 bg-body position-sticky" style={{ top: "58px", zIndex: 1 }}>
                    <h1 className="h4 mb-0">Courses ({courses.length})</h1>
                    <div>
                        <Dropdown as={ButtonGroup}>
                            <Button variant="primary" as={Link} to={`/courses/add`}><span><i className="far fa-plus"></i>Add Course</span></Button>

                            <Dropdown.Toggle split variant="primary" />

                            <Dropdown.Menu align="right">
                                <Dropdown.Item as={Link} to={`/courses/import`}>Import from File</Dropdown.Item>
                                <Dropdown.Item onClick={async () => {

                                    blockPage(<AppLoader />);
                                    const result = await appService.exportCourses();
                                    unblockPage();

                                    if (result.success) {
                                        downloadFromUrl(result.data.fileUrl);

                                        toast.success('Courses exported.');
                                    }
                                    else {
                                        toast.error(result.message);
                                    }
                                }}>Export to File</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </div>

                <div className="row justify-content-center">
                    <div className="col-12 col-md-8">
                        {(courses.length > 0) &&
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId={`droppable_1_1`} direction="vertical" type="course">
                                    {(droppableProvided) => (
                                        <div className="row" ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                                            {courses.map((course, courseIndex) => (
                                                <Draggable draggableId={`draggable_1_${course.id}`} index={courseIndex} key={course.id}>
                                                    {(draggableProvided) => (
                                                        <div className="col-12 pb-2" ref={draggableProvided.innerRef} {...draggableProvided.draggableProps}>
                                                            <Card>
                                                                <Card.Body className="p-0 d-flex justify-content-between align-items-center">
                                                                    <div className="p-2 d-flex align-items-center flex-grow-1 position-relative">
                                                                        <div className="d-flex justify-content-center align-items-center theme-bg-dark rounded-circle" style={{ width: "48px", height: "48px" }}>
                                                                            {course.image != null ? <img src={course.image.fileUrl} className="w-100 h-100 img-fluid rounded-circle" /> : <i className="fad fa-image fa-2x theme-text-white"></i>}
                                                                        </div>
                                                                        <div className="d-flex align-items-center flex-grow-1 pl-3 pr-2">
                                                                            <div className="flex-grow-1 text-break">
                                                                                <Card.Title className="mb-2"><Link className="text-reset stretched-link" to={`/courses/${course.id}`}>
                                                                                    <TruncateMarkup lines={1}><div>{course.title}</div></TruncateMarkup></Link>
                                                                                </Card.Title>
                                                                                <TruncateMarkup lines={1}><div><div className="small">{course.description}</div></div></TruncateMarkup>
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
                                                                                    <Dropdown.Item as={Link} to={`/courses/${course.id}`}>View</Dropdown.Item>
                                                                                    <Dropdown.Item as={Link} to={`/courses/${course.id}/edit`}>Edit</Dropdown.Item>
                                                                                    <Dropdown.Item as={Link} to={`/courses/${course.id}/delete`}>Delete</Dropdown.Item>
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
                        {(courses.length == 0) &&
                            <div className="row justify-content-center text-center">
                                <div className="col-lg-8 py-5">
                                    <div className="pt-5">
                                        <div className="mb-3"><i className="fad fa-books" style={{ fontSize: "64px" }}></i></div>
                                        <h4>Add and manage courses</h4>
                                        <p>This is where you’ll add courses and manage them.</p>
                                        <Button variant="primary" as={Link} to={`/courses/add`}><i className="far fa-plus mr-2"></i>Add Course</Button></div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </>
    );
};

export default withRemount(CourseListPage);