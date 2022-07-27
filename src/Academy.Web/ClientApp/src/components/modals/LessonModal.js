import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Form, Button } from 'react-bootstrap';
import toast from 'react-hot-toast';
import AppLoader from '../shared/AppLoader';
import appService from '../../utilities/appService';
import { Link } from 'react-router-dom';
import { } from '../../utilities';

import _ from 'lodash';


const LessonModal = (props) => {
    const action = props.match.params.action;
    const dispatcher = props.dispatcher;

   
    const courseId = props.match.params.courseId;
    const sectionId = props.match.params.sectionId;
    let lessonId = props.match.params.lessonId || 0;

    const form = {
        ...useForm(),
        defaultValues: (() => {
            const values = {
                priority: 0,
                sectionId: sectionId,
                id: lessonId,
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

    const [show, setShow] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (lesson) => {
        setLoading(true);

        let result = action == 'add' ? await appService.addLesson(lesson) :
            action == 'edit' ? await appService.editLesson(lesson) :
                action == 'delete' ? await appService.deleteLesson(lesson) : null;

        if (!result.success) {

            toast.error(result.message);

            form.setErrors(result.errors);
            setLoading(false);
        }
        else {
            lesson = { ...result.data };
            lessonId = result.data.id;

            toast.success(`Lesson ${(() => {
                switch (action) {
                    case 'add': return 'added';
                    case 'edit': return 'updated';
                    case 'delete': return 'deleted';
                }
            })()}.`);

            setLoading(false);
            setShow(false);

            dispatcher.trigger(`${action.toUpperCase()}_LESSON`, lesson);
        }
    };

    useEffect(() => {
        (async () => {
            if (action == 'edit') {
                setLoading(true);

                const result = await appService.populateCourses({ courseId, sectionId, lessonId });

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
        })();

        return () => {

        };
    }, []);

    return (
        <Modal dialogClassName={`modal-fullscreen-sm`} show={show} animation={false} backdrop="static" scrollable={true} onHide={() => setShow(false)}>
            <div className="d-flex justify-content-between align-items-center p-3">
                <h4 className="mb-0">{action.toPascalCase()} Lesson</h4>
                <Button type="button" variant="default" className="icon-btn" onClick={() => setShow(false)}><i className="far fa-times"></i></Button>
            </div>

            {loading && <div className="overlay"><AppLoader /></div>}

            <Modal.Body className={loading ? 'invisible' : ''}>
                <Form onSubmit={form.handleSubmit(handleSubmit)}>
                    <input name="priority" type="hidden" ref={form.register()} />
                    <input name="id" type="hidden" ref={form.register()} />
                    <input name="sectionId" type="hidden" ref={form.register()} />
                    {(action == 'add' || action == 'edit') ? (
                        <React.Fragment>

                            <Form.Group>
                                <Form.Label>Title</Form.Label>
                                <Form.Control name="title" type="text" ref={form.register()} className={`${form.errors.title ? 'is-invalid' : ''}`} />
                                <Form.Control.Feedback type="invalid">{form.errors.title?.message}</Form.Control.Feedback>
                            </Form.Group>

                        </React.Fragment>
                    ) : (action) ? (
                        <p className="mb-0">Are you sure you want to {action} this lesson?</p>
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

export default LessonModal;