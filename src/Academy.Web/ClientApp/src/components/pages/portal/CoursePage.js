import { Button, Card, Dropdown, Collapse, OverlayTrigger, Tooltip } from 'react-bootstrap';
import React, { useEffect, useState } from 'react';
import TruncateMarkup from 'react-truncate-markup';
import { withRemount, resolveDndResult, useStateCallback } from '../../../utilities';
import toast from 'react-hot-toast';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import AppLoader from '../../shared/AppLoader';
import appService from '../../../utilities/appService';

const CoursePage = (props) => {
    const history = props.history;
    const dispatcher = props.dispatcher;

    const [loading, setLoading] = useState({});
    const loadingProps = { retry: props.remount, backoff: () => history.push('/courses') };

    const courseId = props.match.params.courseId;
    const [course, setCourse] = useState(null);

    const [sectionCollapse, setSectionCollapse] = useState([]);
    const [sections, setSections] = useStateCallback(null);

    const handleDragEnd = async (result) => {
        var position = resolveDndResult(result);
        position = { ...position, parentId: courseId };

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
        let items = JSON.parse(JSON.stringify(sections));

        if (position.type == 'section') {
            const reorderItem = items.splice(source.index, 1)[0];
            items.splice(destination.index, 0, reorderItem);
            items.forEach((item, itemIndex) => {
                item.priority = itemIndex + 1;
            });

            setSections(items);

            setSectionCollapse(Object.assign([], sectionCollapse, {
                [source.index]: sectionCollapse[destination.index],
                [destination.index]: sectionCollapse[source.index]
            }));
        }
        else if (position.type == 'lesson') {
            const startItem = items.filter(item => item.id == source.droppableId)[0];
            const finishItem = items.filter(item => item.id == destination.droppableId)[0];

            const startUnits = startItem.lessons;

            if (startItem == finishItem) {
                const reorderUnit = startUnits.splice(source.index, 1)[0];
                startUnits.splice(destination.index, 0, reorderUnit);
                startUnits.forEach((unit, unitIndex) => {
                    unit.priority = unitIndex + 1;
                });

                items = items.map(item => item.id != startItem.id ? item : startItem);
            }
            else {
                const reorderUnit = startUnits.splice(source.index, 1)[0];
                startUnits.forEach((unit, unitIndex) => {
                    unit.priority = unitIndex + 1;
                });

                reorderUnit.sectionId = finishItem.id;

                const finishUnits = finishItem.lessons;
                finishUnits.splice(destination.index, 0, reorderUnit);
                finishUnits.forEach((unit, unitIndex) => {
                    unit.priority = unitIndex + 1;
                });

                items = items.map(item => item.id != startItem.id ? item : startItem);
                items = items.map(item => item.id != finishItem.id ? item : finishItem);
            }

            setSections(items);
        }
    };

    useEffect(() => {
        (async () => {
            const courseResult = await appService.populateCourses({ courseId });

            if (!courseResult.success) {
                setLoading({ status: 'error', message: courseResult.message });
            }
            else {

                setCourse(courseResult.data);
                setSections(courseResult.data.sections);
                setLoading(null);
            }
        })();
    }, []);

    useEffect(() => {
        const ADD_SECTION = (section) => {
            setSections((sections) => { return [...sections, section]; });
        };
        const EDIT_SECTION = (section) => {
            setSections((sections) => { return sections.map(s => s.id != section.id ? s : section); });
        };
        const DELETE_SECTION = (section) => {
            setSections((sections) => { return sections.filter((s) => s.id != section.id); });
        };

        dispatcher.on('ADD_SECTION', ADD_SECTION);
        dispatcher.on('EDIT_SECTION', EDIT_SECTION);
        dispatcher.on('DELETE_SECTION', DELETE_SECTION);

        return () => {
            dispatcher.off('ADD_SECTION', ADD_SECTION);
            dispatcher.off('EDIT_SECTION', EDIT_SECTION);
            dispatcher.off('DELETE_SECTION', DELETE_SECTION);
        };
    }, []);

    useEffect(() => {
        const ADD_LESSON = (lesson) => {

            setSections((sections) => {
                const section = sections.filter((s) => s.id == lesson.sectionId)[0];
                section.lessons.push(lesson);
                return sections.map(s => s.id != section.id ? s : section);
            });
        };

        const EDIT_LESSON = (lesson) => {

            setSections((sections) => {
                const section = sections.filter((s) => s.id == lesson.sectionId)[0];
                section.lessons = section.lessons.map(l => l.id != lesson.id ? l : lesson);
                return sections.map(s => s.id != section.id ? s : section);
            });
        };

        const DELETE_LESSON = (lesson) => {
            setSections((sections) => {
                const section = sections.filter((s) => s.id == lesson.sectionId)[0];
                section.lessons = section.lessons.filter((l) => l.id != lesson.id);
                return sections.map(s => s.id != section.id ? s : section);
            });
        };

        dispatcher.on('ADD_LESSON', ADD_LESSON);
        dispatcher.on('EDIT_LESSON', EDIT_LESSON);
        dispatcher.on('DELETE_LESSON', DELETE_LESSON);

        return () => {
            dispatcher.off('ADD_LESSON', ADD_LESSON);
            dispatcher.off('EDIT_LESSON', EDIT_LESSON);
            dispatcher.off('DELETE_LESSON', DELETE_LESSON);
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
                        <Button variant="default" as={Link} to="/courses"><i className="far fa-arrow-left mr-2"></i>Courses</Button>
                    </div>
                    <div className="d-flex">
                        <Button variant="primary" as={Link} to={`/courses/${courseId}/sections/add`}><i className="far fa-plus mr-2"></i>Add Section</Button>
                    </div>
                </div>
                <h1 className="h4 text-truncate">{course.title} - Sections ({sections.length})</h1>

                <div className="row justify-content-center">
                    <div className="col-12 col-md-8">
                        <div>
                            {(sections.length > 0) &&
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId={`droppable_1_${courseId}`} direction="vertical" type="section">
                                        {(droppableProvided) => (
                                            <div className="row" ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                                                {sections.map((section, sectionIndex) => (
                                                    <Draggable draggableId={`draggable_1_${section.id}`} index={sectionIndex} key={section.id}>
                                                        {(draggableProvided) => (
                                                            <div className="col-12 pb-2"
                                                                ref={draggableProvided.innerRef}
                                                                {...draggableProvided.draggableProps}>
                                                                <Card>
                                                                    <Card.Header className="p-0 d-flex justify-content-between align-items-stretch border-bottom-0">
                                                                        <div className="d-flex align-items-center flex-grow-1 pl-3 pr-2 cursor-pointer" onClick={() => setSectionCollapse(Object.assign([], sectionCollapse, { [sectionIndex]: !sectionCollapse[sectionIndex] }))}>
                                                                            <div className="flex-grow-1 text-break">
                                                                                <Card.Title className="mb-0">
                                                                                    <TruncateMarkup lines={1}><div>{section.title}</div></TruncateMarkup>
                                                                                </Card.Title>
                                                                            </div>
                                                                        </div>
                                                                        <div className="p-2 d-flex">
                                                                            <div className="mr-2">
                                                                                <OverlayTrigger overlay={(props) => <Tooltip {...props}>Drag</Tooltip>}>
                                                                                    <Button as="div" variant="default" className="icon-btn borderless" {...draggableProvided.dragHandleProps}>
                                                                                        <i className={`far fa-arrows-alt`}></i>
                                                                                    </Button>
                                                                                </OverlayTrigger>
                                                                            </div>
                                                                            <div className="mr-2">
                                                                                <OverlayTrigger overlay={(props) => <Tooltip {...props}>Options</Tooltip>}>
                                                                                    <Dropdown className="dropdown-toggle-hide-arrow" drop="left">
                                                                                        <Dropdown.Toggle variant="default" className="icon-btn borderless">
                                                                                            <i className={`far fa-ellipsis-v`}></i>
                                                                                        </Dropdown.Toggle>
                                                                                        <Dropdown.Menu>
                                                                                            <Dropdown.Item as={Link} to={`/courses/${courseId}/sections/${section.id}/edit`}>Edit</Dropdown.Item>
                                                                                            <Dropdown.Item as={Link} to={`/courses/${courseId}/sections/${section.id}/delete`}>Delete</Dropdown.Item>
                                                                                        </Dropdown.Menu>
                                                                                    </Dropdown>
                                                                                </OverlayTrigger>
                                                                            </div>
                                                                            <div>
                                                                                <OverlayTrigger overlay={(props) => <Tooltip {...props}>Extend</Tooltip>}>
                                                                                    <Button as="div" variant="default" className="icon-btn borderless" onClick={() => setSectionCollapse(Object.assign([], sectionCollapse, { [sectionIndex]: !sectionCollapse[sectionIndex] }))}>
                                                                                        {sectionCollapse[sectionIndex] ? <i className={`far fa-chevron-up`}></i> : <i className={`far fa-chevron-down`}></i>}
                                                                                    </Button>
                                                                                </OverlayTrigger>
                                                                            </div>
                                                                        </div>
                                                                    </Card.Header>
                                                                    <Collapse in={sectionCollapse[sectionIndex]}>
                                                                        <div>
                                                                            <div>
                                                                                <Droppable droppableId={`droppable_2_${section.id}`} direction="vertical" type="lesson">
                                                                                    {(droppableProvided) => (
                                                                                        <div style={{ minHeight: "54px" }} ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                                                                                            {section.lessons.map((lesson, lessonIndex) =>
                                                                                                <Draggable draggableId={`draggable_2_${lesson.id}`} index={lessonIndex} key={lesson.id}>
                                                                                                    {(draggableProvided) => (
                                                                                                        <div className="py-1" ref={draggableProvided.innerRef} {...draggableProvided.draggableProps}>
                                                                                                            <Card className="shadow-none border bg-body p-0 mx-1">
                                                                                                                <div className="d-flex justify-content-between align-items-stretch py-1">
                                                                                                                    <div className="d-flex align-items-center flex-grow-1 pl-4 pr-2 position-relative cursor-pointer">
                                                                                                                        <div className="flex-grow-1 text-break">
                                                                                                                            <div className="h5 mb-1">
                                                                                                                                <TruncateMarkup lines={1}>
                                                                                                                                    <Link className="text-reset stretched-link" to={`/courses/${courseId}/sections/${section.id}/lessons/${lesson.id}`}>
                                                                                                                                        {lesson.title}
                                                                                                                                    </Link>
                                                                                                                                </TruncateMarkup>
                                                                                                                            </div>
                                                                                                                            <div className="small text-muted">{lesson.contents.length} {lesson.contents.length == 1 ? 'content' : 'contents'}</div>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                    <div className="py-2 d-flex">
                                                                                                                        <div className="mr-2">
                                                                                                                            <OverlayTrigger overlay={(props) => <Tooltip {...props}>Drag</Tooltip>}>
                                                                                                                                <Button as="div" variant="default" className="icon-btn borderless" {...draggableProvided.dragHandleProps}>
                                                                                                                                    <i className={`far fa-arrows-alt`}></i>
                                                                                                                                </Button>
                                                                                                                            </OverlayTrigger>
                                                                                                                        </div>
                                                                                                                        <div className="mr-2">
                                                                                                                            <OverlayTrigger overlay={(props) => <Tooltip {...props}>Options</Tooltip>}>
                                                                                                                                <Dropdown className="dropdown-toggle-hide-arrow" drop="left">
                                                                                                                                    <Dropdown.Toggle variant="default" className="icon-btn borderless">
                                                                                                                                        <i className={`far fa-ellipsis-v`}></i>
                                                                                                                                    </Dropdown.Toggle>
                                                                                                                                    <Dropdown.Menu>
                                                                                                                                        <Dropdown.Item as={Link} to={`/courses/${courseId}/sections/${section.id}/lessons/${lesson.id}`}>View</Dropdown.Item>
                                                                                                                                        <Dropdown.Item as={Link} to={`/courses/${courseId}/sections/${section.id}/lessons/${lesson.id}/edit`}>Edit</Dropdown.Item>
                                                                                                                                        <Dropdown.Item as={Link} to={`/courses/${courseId}/sections/${section.id}/lessons/${lesson.id}/delete`}>Delete</Dropdown.Item>
                                                                                                                                    </Dropdown.Menu>
                                                                                                                                </Dropdown>
                                                                                                                            </OverlayTrigger>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </Card>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </Draggable>
                                                                                            )}
                                                                                            {droppableProvided.placeholder}
                                                                                        </div>
                                                                                    )}
                                                                                </Droppable>
                                                                            </div>
                                                                            <div>
                                                                                <Card.Footer className="d-flex justify-content-end px-2">
                                                                                    <div>
                                                                                        <Button type="button" variant="primary" as={Link} to={`/courses/${courseId}/sections/${section.id}/lessons/add`}><i className="far fa-plus mr-2"></i>Add Lesson</Button>
                                                                                    </div>
                                                                                </Card.Footer>
                                                                            </div>
                                                                        </div>
                                                                    </Collapse>
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
                            {(sections.length == 0) &&
                                <div className="row justify-content-center text-center">
                                    <div className="col-lg-8 py-5">
                                        <div className="pt-5">
                                            <div className="mb-3"><i className="fad fa-books" style={{ fontSize: "64px" }}></i></div>
                                            <h4>Add and manage sections</h4>
                                            <p>This is where you’ll add sections and manage them.</p>
                                            <Button variant="primary" as={Link} to={`/courses/${courseId}/sections/add`}><i className="far fa-plus mr-2"></i>Add Section</Button></div>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default withRemount(CoursePage);