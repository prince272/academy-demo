import React, { useEffect, useState, useMemo } from 'react';
import { Button, Card, Dropdown, Collapse, OverlayTrigger, Tooltip, ProgressBar, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { isBlankHtml, withRemount, resolveDndResult } from '../../../utilities';
import appService from '../../../utilities/appService';

import AppLoader from '../../shared/AppLoader';

import toast from 'react-hot-toast';

import TruncateMarkup from 'react-truncate-markup';

import _ from 'lodash';
import FileViewer from '../../shared/FileViewer';

import DOMPurify from 'dompurify';

import confetti from 'canvas-confetti';
import useSound from 'use-sound';
import { CommentList } from '../portal/CommentListPage';


const ContentPage = (props) => {
    const authorization = props.authorization;

    const history = props.history;
    const dialog = props.dialog;

    const [loading, setLoading] = useState({});
    const loadingProps = { retry: props.remount };

    const courseId = props.match.params.courseId;
    const [course, setCourse] = useState(null);

    const [sections, setSections] = useState(null);

    const sectionId = props.match.params.sectionId;
    const section = sections?.filter(x => x.id == sectionId)[0];

    const lessonId = props.match.params.lessonId;
    const [lesson, setLesson] = useState(null);

    let contentId = props.match.params.contentId;
    const [content, setContent] = useState(null);

    const [updating, setUpdating] = useState(false);

    const [questionAnswerFeedback, setQuestionAnswerFeedback] = useState(null);
    const [questionAnswerChoices, setQuestionAnswerChoices] = useState([]);

    const reorderQuestionAnswers = (position) => {
        if (position.destination == null) return;
        if (position.destination.droppableId == position.source.droppableId &&
            position.destination.index == position.source.index) return;

        const source = position.source;
        const destination = position.destination;

        // Clone the data to prevent nested values within the data from been rendered when their values change.
        let items = JSON.parse(JSON.stringify(content.questionAnswers));

        if (position.type == 'questionAnwser') {
            const reorderItem = items.splice(source.index, 1)[0];
            items.splice(destination.index, 0, reorderItem);
            items.forEach((item, itemIndex) => {
                item.priority = itemIndex + 1;
            });

            const newContent = { ...content, questionAnswers: items };
            setContent(newContent);

            if (newContent.questionType == 'reorder') {
                const questionAnswerIds = newContent.questionAnswers.map(x => x.id);
                questionAnswerIds.forEach((v, i) => {
                    form.register(`questionAnwserIds[${i}]`);
                    form.setValue(`questionAnwserIds[${i}]`, v);
                });
            }
        }
    };

    const [currentView, setCurrentView] = useState(null);
    const [views, setViews] = useState(null);

    const [playCorrect] = useSound(
        '/sounds/feedback-correct-3_NWM.mp3'
    );

    const [playWrong] = useSound(
        '/sounds/feedback-incorrect-26_NWM.mp3'
    );

    const form = {
        ...useForm(),
        defaultValues: (() => {
            const values = {
                contentId: contentId,
            }
            return values;
        })(),
        setValues: (values) => {
            Object.entries(values).forEach(([name, value]) => {
                form.setValue(name, value);
            });
        },
        setErrors: (errors) => {
            errors = Object.entries(errors).map(([name, message]) => {
                return { name: name, message: message };
            })
            errors.forEach((error) => form.setError(error.name, {
                type: 'server',
                message: error.message,
                shouldFocus: false
            }));
        }
    };

    const handleSubmit = async (values) => {
        setUpdating(true);
        const result = await appService.progressCourse(values);
        setUpdating(false);

        if (!result.success) {
            toast.error(result.message);
            form.setErrors(result.errors);
        }
        else {

            if (!result.data) {
                if (currentView == 'question') {
                    setQuestionAnswerFeedback('wrong');

                    playWrong();
                    toast.error('Incorrect, Try again!');
                } else {
                    toast.error('Unable to continue.');
                }
            }
            else {
                if (currentView == 'question') {
                    setQuestionAnswerFeedback('correct');

                    fireConfetti();
                    playCorrect();
                    toast.success('Well done, Continue!');
                }
                else {
                    goToNext(true);
                }
            }
        }
    }

    const fireConfetti = () => {
        var count = 200;
        var defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio, opts) {
            confetti(Object.assign({}, defaults, opts, {
                particleCount: Math.floor(count * particleRatio)
            }));
        }

        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });
        fire(0.2, {
            spread: 60,
        });
        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    }

    useEffect(() => {
        (async () => {
            const courseResult = await appService.populateCourses({ courseId });

            if (!courseResult.success) {
                setLoading({ status: 'error', message: courseResult.message });
            }
            else {

                setCourse(courseResult.data);
                setSections(courseResult.data.sections);

                const newLesson = courseResult.data.sections.flatMap(x => x.lessons).filter(x => x.id == lessonId)[0];

                if (newLesson == null) {

                    // Redirect to the course when there is no lesson find.
                    history.replace(`/learn/${courseId}`);
                    return;
                }
                else {
                    setLesson(newLesson);

                    contentId = newLesson.contents.filter(x => x.id == contentId)[0]?.id;

                    if (contentId == null) {

                        // Redirect to the course when there is no content find.
                        history.replace(`/learn/${courseId}`);
                        return;
                    }

                    const contentResult = await appService.populateCourses({ courseId, sectionId, lessonId, contentId });

                    if (!contentResult.success) {
                        setLoading({ status: 'error', message: contentResult.message });
                    }
                    else {
                        const newContent = { ...contentResult.data, questionAnswers: _.shuffle(contentResult.data.questionAnswers) };
                        setContent(newContent);

                        if (newContent.questionType == 'reorder') {
                            const questionAnswerIds = newContent.questionAnswers.map(x => x.id);
                            questionAnswerIds.forEach((v, i) => {
                                form.register(`questionAnwserIds[${i}]`);
                                form.setValue(`questionAnwserIds[${i}]`, v);
                            });
                        }

                        const newViews = [];
                        if (!isBlankHtml(newContent.explanation))
                            newViews.push('explanation');

                        if (newContent.media != null)
                            newViews.push('media');


                        if (!isBlankHtml(newContent.question) || newContent.questionAnswers.length > 0)
                            newViews.push('question');

                        if (newViews.length != 0) {
                            setCurrentView(newViews[0]);
                        }

                        setViews(newViews);
                        setLoading(null);

                        form.setValue('contentId', contentId);
                    }
                }
            }
        })();
    }, []);

    if (loading != null) {
        return <AppLoader {...loadingProps} {...loading} />
    }

    // How to flatten tree structure into array of arrays
    // source: https://stackoverflow.com/questions/48524059/how-to-flatten-tree-structure-into-array-of-arrays
    function traverse(node, path = [], result = []) {
        if (!node.children.length)
            result.push(path.concat(node.id));
        for (const child of node.children)
            traverse(child, path.concat(node.id), result);
        return result;
    }

    const contentPaths = traverse({
        id: course.id,
        children: course.sections.map(section => ({
            id: `${section.id}`,
            children: section.lessons.map(lesson => ({
                id: `${lesson.id}`,

                children: lesson.contents.map(content => ({
                    id: `${content.id}`,
                    children: []
                }))
            }))
        }))
    }).filter(x => x.length == 4).map(x => `/learn/${x.join('/')}`);

    const currentPath = `/learn/${courseId}/${sectionId}/${lessonId}/${contentId}`;
    const nextPath = contentPaths[contentPaths.indexOf(currentPath) + 1] || `/learn/${courseId}/complete`;
    const previousPath = contentPaths[contentPaths.indexOf(currentPath) - 1] || `/learn/${courseId}`;

    const nextView = views[views.indexOf(currentView) + 1];
    const previousView = views[views.indexOf(currentView) - 1];

    const goToPrevious = () => {

        if (previousView != null) {
            setCurrentView(previousView);
            setQuestionAnswerFeedback(null);
            setQuestionAnswerChoices([]);
        }
        else {
            history.push(previousPath);
        }
    }

    const goToNext = (submitted) => {

        if (nextView != null) {
            setCurrentView(nextView);
        }
        else {

            if (!submitted && (questionAnswerFeedback == null || questionAnswerFeedback == 'wrong')) {
                form.handleSubmit(handleSubmit)();
            }
            else {
                history.push(nextPath);
            }
        }
    }

    return (
        <>
            <Modal.Dialog className="modal-fullscreen" scrollable={true} style={{ margin: "0", maxWidth: "100%" }}>
                <Modal.Header className="p-0 border-0">
                    <div className="row no-gutters justify-content-center text-center w-100">
                        <div className="col-md-8 col-lg-6">
                            <div className="d-flex justify-content-between align-items-center px-3 pt-3 pb-0">
                                <Button type="button" variant="default" disabled={updating} className={`icon-btn ${(!(previousView != null || previousPath != null)) ? 'd-none' : ''}`} onClick={() => { goToPrevious(); }}><i className="far fa-chevron-left"></i></Button>
                                <div className="mx-1 flex-grow-1"><TruncateMarkup lines={1}><div><h5 className="mb-0">{lesson.title}</h5></div></TruncateMarkup></div>
                                <Button type="button" variant="default" className="icon-btn" as={Link} to={`/learn/${courseId}`}><i className="far fa-times"></i></Button>
                            </div>
                        </div>
                        <div className="col-12"></div>
                        <div className="col-md-8 col-lg-6">
                            <div className="px-3">
                                <div className="mb-2 small text-center">Current progress: <span className="font-weight-semibold">{(Math.round((((course.progress || 0) * 100) + Number.EPSILON) * 100) / 100)}%</span></div>
                                <div><ProgressBar className="bg-dark" now={(Math.round((((course.progress || 0) * 100) + Number.EPSILON) * 100) / 100)} style={{ height: "3px", }} /></div>
                            </div>
                        </div>
                    </div>
                </Modal.Header>

                <Modal.Body>
                    <div className="row no-gutters justify-content-center w-100 h-100">
                        <div className="col-md-8 col-lg-6">
                            <Form className="h-100" onSubmit={form.handleSubmit(handleSubmit)}>

                                <input name="contentId" type="hidden" ref={form.register()} />

                                {(currentView == 'explanation') && (
                                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.explanation) }}></div>
                                )}
                                {(currentView == 'media') && (
                                    <FileViewer file={content.media} />
                                )}
                                {(currentView == 'question') && (
                                    <>
                                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.question) }}></div>


                                        <DragDropContext onDragEnd={(result) => {
                                            var position = resolveDndResult(result);
                                            reorderQuestionAnswers(position);
                                        }}>
                                            <Droppable droppableId={`droppable_1_${contentId}`} direction="vertical" type="questionAnwser">
                                                {(droppableProvided) => (
                                                    <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                                                        {content.questionAnswers.map((questionAnswer, questionAnswerIndex) => (
                                                            <Draggable draggableId={`draggable_1_${questionAnswer.id}`} index={questionAnswerIndex} key={`1_${questionAnswer.id}`} isDragDisabled={content.questionType != 'reorder'}>
                                                                {(draggableProvided, draggableSnapshot) => {

                                                                    var draggableItem = (
                                                                        <div className="py-1" key={`1_${questionAnswer.id}`} ref={draggableProvided.innerRef} {...draggableProvided.draggableProps}>
                                                                            <Card className={`shadow-sm pl-0 pr-2 py-2 ${questionAnswerChoices[questionAnswerIndex] ? `${(questionAnswerFeedback == 'wrong' ? 'callout callout-danger' : (questionAnswerFeedback == 'correct' ? 'callout callout-success' : 'callout callout-primary'))}` : `${content.questionType == 'choice' ? 'cursor-pointer border-hover border-primary' : ''}`}`}
                                                                                onClick={() => {
                                                                                    if (content.questionType == 'choice') {
                                                                                        const newQuestionAnwserChoices = (() => {
                                                                                            switch (content.questionChoice) {
                                                                                                case 'single': return Object.assign([], questionAnswerChoices.map(x => false), { [questionAnswerIndex]: !questionAnswerChoices[questionAnswerIndex] });
                                                                                                case 'multiple': return Object.assign([], questionAnswerChoices, { [questionAnswerIndex]: !questionAnswerChoices[questionAnswerIndex] });
                                                                                                default: return null;
                                                                                            }

                                                                                        })();

                                                                                        const newQuestionAnwserIds = newQuestionAnwserChoices.map((chosen, chosenIndex) => chosen ? content.questionAnswers[chosenIndex].id : null).filter(x => x != null);

                                                                                        // Remove all question ids.
                                                                                        Array.from({ length: content.questionAnswers.length }, (v, i) => {
                                                                                            form.unregister(`questionAnwserIds[${i}]`);
                                                                                        });

                                                                                        newQuestionAnwserIds.forEach((v, i) => {
                                                                                            form.register(`questionAnwserIds[${i}]`);
                                                                                            form.setValue(`questionAnwserIds[${i}]`, v);
                                                                                        });

                                                                                        setQuestionAnswerChoices(newQuestionAnwserChoices);
                                                                                        setQuestionAnswerFeedback(null);
                                                                                    }
                                                                                }}>
                                                                                <div className="d-flex justify-content-between align-items-stretch">
                                                                                    <div className="d-flex align-items-center flex-grow-1 pl-3 py-2 pr-2">
                                                                                        <div className="flex-grow-1 text-break">
                                                                                            <div className="mb-0">
                                                                                                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(questionAnswer.description) }}></div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className={content.questionType != 'reorder' ? 'd-none' : ''} >
                                                                                        <OverlayTrigger overlay={(props) => <Tooltip {...props}>Drag</Tooltip>}>
                                                                                            <Button as="div" variant="default" className="icon-btn borderless" {...draggableProvided.dragHandleProps}>
                                                                                                <i className={`far fa-arrows-alt`}></i>
                                                                                            </Button>
                                                                                        </OverlayTrigger>
                                                                                    </div>
                                                                                </div>
                                                                            </Card>
                                                                        </div>
                                                                    );

                                                                    return draggableItem;
                                                                }}</Draggable>

                                                        ))}
                                                        {droppableProvided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </DragDropContext>
                                    </>
                                )}
                            </Form>
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer className="position-relative border-0">
                    <div className="position-absolute w-100" style={{ right: "0%", bottom: "70%", padding: "inherit", pointerEvents: "none" }}>
                        <div className="row no-gutters justify-content-center w-100">
                            <div className="col-md-8 col-lg-6 align-content-end">
                                <div className="d-flex justify-content-end">
                                    <div style={{ pointerEvents: "all" }}>
                                       
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row no-gutters justify-content-center w-100">
                        <div className="col-md-8 col-lg-6 align-content-end">
                            <div className="d-flex justify-content-end">
                                <Button className="w-100 w-md-auto" type="button" variant="primary" size="lg" style={{ minWidth: "140px" }}
                                    disabled={updating}
                                    onClick={() => { goToNext(); }}>{updating ? (<Spinner animation="border" className="text-white" as="span" />) : (currentView == 'question' ? (questionAnswerFeedback != 'correct' ? 'Check Answer' : 'Continue') : 'Continue')}</Button>
                            </div>
                        </div>
                    </div>
                </Modal.Footer>
            </Modal.Dialog>
        </>
    );
};

export default withRemount(ContentPage);