import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Form, Button, Collapse, OverlayTrigger, Tooltip, FormGroup, Card, InputGroup, Modal } from 'react-bootstrap';
import { Controller as FormController, useForm, useFieldArray } from 'react-hook-form';
import Select from 'react-select';
import toast from 'react-hot-toast';
import '../../vendor/libs/react-select/react-select.scss';
import TruncateMarkup from 'react-truncate-markup';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { resolveDndResult } from '../../utilities';
import AssetUploader from '../shared/AssetUploader';
import { useEffect } from 'react';
import RichTextEditor from '../shared/RichTextEditor';
import _ from 'lodash';
import { Link } from 'react-router-dom';
import AppLoader from '../shared/AppLoader';
import appService from '../../utilities/appService';

import readingTime  from 'reading-time';

const portal = document.createElement("div");
document.body.appendChild(portal);

const ContentModal = (props) => {
    const dispatcher = props.dispatcher;
    const action = props.match.params.action;

    const courseId = props.match.params.courseId;
    const sectionId = props.match.params.sectionId;
    const lessonId = props.match.params.lessonId;
    let contentId = props.match.params.contentId || 0;

    const form = {
        ...useForm(),
        defaultValues: (() => {
            const values = {
                lessonId: lessonId,
                priority: 0,
                id: contentId,
                explanation: '',
                question: '',
                questionType: 'choice'
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
        },
        ...useState(false).reduce((obj, item, index) => ({ ...obj, [index == 0 ? 'initialized' : 'setInitialized']: item }), {}),
    };

    const questionAnswerForm = useFieldArray({ control: form.control, name: `questionAnswers`, keyName: 'fieldId' });
    const reorderQuestionAnswers = (position) => {
        if (position.destination == null) return;
        if (position.destination.droppableId == position.source.droppableId &&
            position.destination.index == position.source.index) return;

        const source = position.source;
        const destination = position.destination;

        // Clone the data to prevent nested values within the data from been rendered when their values change.
        let items = JSON.parse(JSON.stringify(form.watch('questionAnswers')));

        if (position.type == 'questionAnwser') {
            const reorderItem = items.splice(source.index, 1)[0];
            items.splice(destination.index, 0, reorderItem);
            items.forEach((item, itemIndex) => {
                item.priority = itemIndex + 1;
            });

            questionAnswerForm.remove();
            questionAnswerForm.append(items);
        }
    };

    const handleSubmit = async (content) => {
        setLoading(true);

        let result = action == 'add' ? await appService.addContent(content) :
            action == 'edit' ? await appService.editContent(content) :
                action == 'delete' ? await appService.deleteContent(content) : null;

        if (!result.success) {

            toast.error(result.message);

            form.setErrors(result.errors);
            setLoading(false);
        }
        else {
            content = { ...result.data };
            contentId = result.data.id;

            toast.success(`Content ${(() => {
                switch (action) {
                    case 'add': return 'added';
                    case 'edit': return 'updated';
                    case 'delete': return 'deleted';
                }
            })()}.`);

            setLoading(false);
            setShow(false);

            dispatcher.trigger(`${action.toUpperCase()}_CONTENT`, content);
        }
    };

    const [show, setShow] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            if (action == 'edit') {
                setLoading(true);

                const result = await appService.populateCourses({ courseId, sectionId, lessonId, contentId });

                if (!result.success) {
                    toast.error(result.message);

                    setLoading(false);
                    setShow(false);
                }
                else {
                    setLoading(false);

                    form.setValues(result.data);
                }
            }
            else {
                form.setValues(form.defaultValues);
            }

            form.setInitialized(true);
        })();

        return () => {

        };
    }, []);

    useEffect(() => {
        let duration = 1;
        duration += readingTime(form.watch('explanation') || '').minutes;
        duration += readingTime(form.watch('question') || '').minutes;
        form.setValue('duration', duration);

    }, [form.watch(['question']), form.watch(['explanation'])]);

    return (
        <Modal dialogClassName={`modal-fullscreen-sm`} show={show} size={`${action == 'delete' ? '' : 'lg'}`} animation={false} backdrop="static" scrollable={true} onHide={() => setShow(false)}>
            <div className="d-flex justify-content-between align-items-center p-3">
                <h4 className="mb-0">{action.toPascalCase()} Content</h4>
                <Button type="button" variant="default" className="icon-btn" onClick={() => setShow(false)}><i className="far fa-times"></i></Button>
            </div>

            {loading && <div className="overlay"><AppLoader /></div>}

            <Modal.Body className={loading ? 'invisible' : ''}>
                <Form onSubmit={form.handleSubmit(handleSubmit)}>
                    <input name="priority" type="hidden" ref={form.register()} />
                    <input name="id" type="hidden" ref={form.register()} />
                    <input name="lessonId" type="hidden" ref={form.register()} />
                    {(action == 'add' || action == 'edit') ? (
                        <React.Fragment>
                            <input name={`lessonId`} type="hidden" ref={form.register()} />
                            <input name={`id`} type="hidden" ref={form.register()} />
                            <input name={`priority`} type="hidden" ref={form.register()} />
                            <input name={`duration`} type="hidden" ref={form.register()} />

                            <Form.Group>
                                <Form.Label>Explanation</Form.Label>
                                <FormController
                                    name={`explanation`}
                                    defaultValue={form.defaultValues.explanation}
                                    control={form.control}
                                    render={(controllerProps) => {
                                        return (
                                            <>
                                                <RichTextEditor
                                                    value={controllerProps.value}
                                                    options={{ height: 230 }}
                                                    onChange={(value) => {
                                                        controllerProps.onChange(value);
                                                    }}
                                                />
                                                <input {...controllerProps} type="hidden" />
                                            </>
                                        );
                                    }}
                                />
                                <Form.Control.Feedback type="invalid">{_.get(form.errors, `explanation`)?.message || ''}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group>
                                <Form.Label>Question</Form.Label>
                                <FormController
                                    name={`question`}
                                    defaultValue={form.defaultValues.question}
                                    control={form.control}
                                    render={(controllerProps) => {
                                        return (
                                            <>
                                                <RichTextEditor
                                                    value={controllerProps.value}
                                                    options={{
                                                        height: 230,
                                                    }}
                                                    onChange={(value) => {
                                                        controllerProps.onChange(value);
                                                    }}
                                                />
                                                <input {...controllerProps} type="hidden" />
                                            </>
                                        );
                                    }}
                                />
                                <Form.Control.Feedback type="invalid">{_.get(form.errors, `question`)?.message || ''}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Row className="mb-3 align-items-end">
                                <Form.Group className="col-6 mb-0">
                                    <Form.Label>Question type</Form.Label>
                                    <FormController name={`questionType`} defaultValue={form.defaultValues.questionType} control={form.control}
                                        render={(controllerProps) => {
                                            const options = [
                                                { value: 'choice', label: 'Choice' },
                                                { value: 'reorder', label: 'Reorder' }
                                            ];
                                            return (
                                                <Select className="react-select" classNamePrefix="react-select"
                                                    {...controllerProps}
                                                    onChange={option => {
                                                        controllerProps.onChange(option.value);

                                                        // Reset question answers.
                                                        questionAnswerForm.fields.forEach((f, i) => { form.setValue(`questionAnswers[${i}].correct`, false); });
                                                    }}
                                                    options={options}
                                                    value={options.filter(x => x.value == controllerProps.value)[0]} />
                                            );
                                        }} />
                                    <Form.Control.Feedback type="invalid">{_.get(form.errors, `questionType`)?.message || ''}</Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group className="col-auto ml-auto mb-0">
                                    <Button variant="primary" className="mr-2" onClick={() => {

                                        // default content option inputs
                                        questionAnswerForm.append({
                                            contentId: contentId,
                                            priority: 0,
                                            id: 0,
                                            correct: false,
                                        });
                                    }}><i className="far fa-plus mr-2"></i>Add Answer</Button>
                                </Form.Group>
                            </Form.Row>

                            <FormGroup>

                                <DragDropContext onDragEnd={(result) => {
                                    var position = resolveDndResult(result);
                                    reorderQuestionAnswers(position);
                                }}>
                                    <Droppable droppableId={`droppable_1_${contentId}`} direction="vertical" type="questionAnwser">
                                        {(droppableProvided) => (
                                            <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                                                {questionAnswerForm.fields.map((questionAnswer, questionAnswerIndex) => (
                                                    <Draggable draggableId={`draggable_${questionAnswer.fieldId}_${questionAnswer.id}`} index={questionAnswerIndex} key={`${questionAnswer.fieldId}_${questionAnswer.id}`}>
                                                        {(draggableProvided, draggableSnapshot) => {
                                                            const usePortal = draggableSnapshot.isDragging;

                                                            var draggableItem = (
                                                                <div className="py-2" key={`${questionAnswer.fieldId}_${questionAnswer.id}`} ref={draggableProvided.innerRef} {...draggableProvided.draggableProps}>
                                                                    <Card className="shadow-none border p-1">
                                                                        <input name={`questionAnswers[${questionAnswerIndex}].priority`} type="hidden" defaultValue={questionAnswer.priority} ref={form.register()} />
                                                                        <input name={`questionAnswers[${questionAnswerIndex}].contentId`} type="hidden" defaultValue={questionAnswer.contentId} ref={form.register()} />
                                                                        <input name={`questionAnswers[${questionAnswerIndex}].id`} type="hidden" defaultValue={questionAnswer.id} ref={form.register()} />

                                                                        <Form.Group className="mb-0">
                                                                            <div className="d-flex align-items-center">
                                                                                <div className="flex-grow-1">
                                                                                    <InputGroup>
                                                                                        {form.watch('questionType') == 'choice' &&
                                                                                            <InputGroup.Prepend>
                                                                                                <InputGroup.Text>
                                                                                                    <FormController
                                                                                                        name={`questionAnswers[${questionAnswerIndex}].correct`}
                                                                                                        control={form.control}
                                                                                                        defaultValue={questionAnswer.correct}
                                                                                                        render={(controllerProps) => {

                                                                                                            return (
                                                                                                                <>
                                                                                                                    <Form.Label className="custom-control custom-checkbox mb-0">
                                                                                                                        <Form.Control {...controllerProps}
                                                                                                                            onChange={(e) => controllerProps.onChange(e.target.checked)}
                                                                                                                            checked={controllerProps.value} type="checkbox" className="custom-control-input" />
                                                                                                                        <span className="custom-control-label">Correct</span>
                                                                                                                    </Form.Label>
                                                                                                                </>
                                                                                                            );
                                                                                                        }}
                                                                                                    />
                                                                                                </InputGroup.Text>
                                                                                            </InputGroup.Prepend>
                                                                                        }

                                                                                        <Form.Control name={`questionAnswers[${questionAnswerIndex}].description`} defaultValue={questionAnswer.description} type="text" ref={form.register()}
                                                                                            className={`${_.get(form.errors, `questionAnswers[${questionAnswerIndex}].description`) ? 'is-invalid' : ''}`} />
                                                                                    </InputGroup>
                                                                                    <Form.Control.Feedback type="invalid">{_.get(form.errors, `questionAnswers[${questionAnswerIndex}].description`)?.message || ''}</Form.Control.Feedback>
                                                                                    <Form.Control.Feedback type="invalid">{_.get(form.errors, `questionAnswers[${questionAnswerIndex}].correct`)?.message || ''}</Form.Control.Feedback>
                                                                                </div>
                                                                                <div className="d-flex">
                                                                                    <div className="ml-2">
                                                                                        <OverlayTrigger overlay={(props) => <Tooltip {...props}>Delete</Tooltip>}>
                                                                                            <Button as="div" variant="default" className="icon-btn borderless" onClick={() => questionAnswerForm.remove(questionAnswerIndex)}>
                                                                                                <i className={`far fa-trash-alt`}></i>
                                                                                            </Button>
                                                                                        </OverlayTrigger>
                                                                                    </div>
                                                                                    <div className="ml-2">
                                                                                        <OverlayTrigger overlay={(props) => <Tooltip {...props}>Drag</Tooltip>}>
                                                                                            <Button as="div" variant="default" className="icon-btn borderless" {...draggableProvided.dragHandleProps}>
                                                                                                <i className={`far fa-arrows-alt`}></i>
                                                                                            </Button>
                                                                                        </OverlayTrigger>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </Form.Group>
                                                                    </Card>
                                                                </div>
                                                            );

                                                            return usePortal ? ReactDOM.createPortal(draggableItem, portal) : draggableItem;
                                                        }}</Draggable>

                                                ))}
                                                {droppableProvided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>

                            </FormGroup>

                            <Form.Group>
                                <Form.Label>Media</Form.Label>

                                <FormController
                                    name="mediaId"
                                    defaultValue={""}
                                    control={form.control}
                                    render={(controllerProps) => {
                                        return (
                                            <>
                                                {form.initialized && <AssetUploader
                                                    assetType="image, video, audio"
                                                    onInitialize={(pond) => {
                                                        if (controllerProps.value)
                                                            pond.addFile(controllerProps.value, { type: 'local' });
                                                    }}
                                                    onChange={files => {
                                                        controllerProps.onChange(files[0]?.id || '');
                                                    }} />}

                                                <input {...controllerProps} type="hidden" />
                                            </>
                                        );
                                    }}
                                />
                                <Form.Control.Feedback type="invalid">{_.get(form.errors, `mediaId`)?.message || ''}</Form.Control.Feedback>
                            </Form.Group>

                        </React.Fragment>
                    ) : (action) ? (
                        <p className="mb-0">Are you sure you want to {action} this content?</p>
                    ) : null
                    }
                </Form>
            </Modal.Body>

            {
                (action == 'add' || action == 'edit') ? (

                    <Modal.Footer className="border-top-0">
                        {(action == 'edit') && <Button type="button" variant="danger" className="mr-auto" disabled={loading} as={Link} to={`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/delete`}>Delete</Button>}
                        <Button type="button" variant="default" disabled={loading} onClick={() => setShow(false)}>Cancel</Button>
                        <Button type="button" variant="primary" disabled={loading} onClick={form.handleSubmit(handleSubmit)}>Save</Button>
                    </Modal.Footer>

                ) : (action) ? (

                    <Modal.Footer className="border-top-0">
                        <Button type="button" variant="default" disabled={loading} onClick={() => setShow(false)}>Cancel</Button>
                            <Button type="button" variant={action == 'delete' ? 'danger' : 'primary'} disabled={loading} onClick={form.handleSubmit(handleSubmit)}>{action.toPascalCase()}</Button>
                    </Modal.Footer>

                ) : null
            }
        </Modal >
    );
};

export default ContentModal;