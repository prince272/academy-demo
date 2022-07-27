import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Form, Button, Table, InputGroup } from 'react-bootstrap';
import { Controller as FormController, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import AssetUploader from '../shared/AssetUploader';
import AppLoader from '../shared/AppLoader';
import appService from '../../utilities/appService';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import Cleave from 'cleave.js/react';


const CourseModal = (props) => {
    let courseId = props.match.params.courseId || 0;
    const action = props.match.params.action;
    const dispatcher = props.dispatcher;
    const dialog = props.dialog;
    const appSettings = window.appSettings;

    const form = {
        ...useForm(),
        defaultValues: (() => {
            const values = {
                priority: 0,
                id: courseId,
                published: true,
                fee: 0,
            };
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

    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(true);

    const handleSubmit = async (course) => {
        setLoading(true);

        let result = action == 'add' ? await appService.addCourse(course) :
            action == 'edit' ? await appService.editCourse(course) :
                action == 'delete' ? await appService.deleteCourse(course) : null;

        if (!result.success) {
            toast.error(result.message);

            form.setErrors(result.errors);
            setLoading(false);
        }
        else {
            course = { ...result.data };
            courseId = result.data.id;

            toast.success(`Course ${(() => {
                switch (action) {
                    case 'add': return 'added';
                    case 'edit': return 'updated';
                    case 'delete': return 'deleted';
                }
            })()}.`);

            setLoading(false);
            setShow(false);

            dispatcher.trigger(`${action.toUpperCase()}_COURSE`, course);
        }
    };

    useEffect(() => {
        (async () => {

            if (action == 'edit') {
                setLoading(true);

                const result = await appService.populateCourses({ courseId });

                if (!result.success) {
                    toast.error(result.message);

                    setLoading(false);
                    setShow(false);
                }
                else {
                    form.setValues(result.data);
                    setLoading(false);
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

    return (
        <Modal dialogClassName="modal-fullscreen-sm" show={show} animation={false} backdrop="static" scrollable={true} onHide={() => setShow(false)}>
            <div className="d-flex justify-content-between align-items-center p-3">
                <h4 className="mb-0">{action.toPascalCase()} Course</h4>
                <Button type="button" variant="default" className="icon-btn" onClick={() => setShow(false)}><i className="far fa-times"></i></Button>
            </div>

            {loading && <div className="overlay"><AppLoader /></div>}

            <Modal.Body className={loading ? 'invisible' : ''}>
                <Form onSubmit={form.handleSubmit(handleSubmit)}>
                    <input name="priority" type="hidden" ref={form.register()} />
                    <input name="id" type="hidden" ref={form.register()} />
                    {(action == 'add' || action == 'edit') ? (
                        <>
                            <Form.Group>
                                <Form.Label>Image</Form.Label>
                                <FormController
                                    name="imageId"
                                    defaultValue={""}
                                    control={form.control}
                                    render={(controllerProps) => {
                                        return (
                                            <>
                                                {form.initialized && <AssetUploader
                                                    assetType="image"
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
                            </Form.Group>

                            <Form.Group>
                                <Form.Label>Title</Form.Label>
                                <Form.Control name="title" type="text" ref={form.register()} className={`${form.errors.title ? 'is-invalid' : ''}`} />
                                <Form.Control.Feedback type="invalid">{form.errors.title?.message}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group>
                                <Form.Label>Description</Form.Label>
                                <Form.Control name="description" as="textarea" rows="3" ref={form.register()} className={`${form.errors.description ? 'is-invalid' : ''}`} />
                                <Form.Control.Feedback type="invalid">{form.errors.description?.message}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Row>
                                <Form.Group className="col-12 col-sm-6">
                                    <Form.Label>Fee</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Prepend>
                                            <InputGroup.Text>{appSettings.culture.currencySymbol}</InputGroup.Text>
                                        </InputGroup.Prepend>

                                        <FormController
                                            name="fee"
                                            defaultValue={form.defaultValues.fee}
                                            control={form.control}
                                            render={(controllerProps) => {
                                                return (
                                                    <>
                                                        <input {...controllerProps} type="hidden" />
                                                        <Form.Control as={Cleave} options={{
                                                            numeral: true,
                                                            numeralThousandsGroupStyle: "thousand"
                                                        }} value={controllerProps.value}
                                                            onChange={(e) => {
                                                                controllerProps.onChange(e.target.rawValue);
                                                            }} type="text" className={`${form.errors.fee ? 'is-invalid' : ''}`} />
                                                    </>
                                                );
                                            }}
                                        />

                                    </InputGroup>
                                    <Form.Control.Feedback type="invalid">{form.errors.fee?.message}</Form.Control.Feedback>
                                </Form.Group>
                            </Form.Row>

                            <Form.Group>
                                <Form.Label>Certificate template <Button variant="link" className="p-0 ml-1" onClick={() => {
                                    dialog.alert(
                                        <div>
                                            <p>Your certificate template can contain a selection of placeholders which will be replaced with the relevant values when the certificate is issued. You can upload your certificate template as a .doc, .docx, or .rtf file</p>
                                            <Table bordered>
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th>Placeholder</th>
                                                        <th>Description</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>Course_Title</td>
                                                        <td>The title of the course.</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Learner_Name</td>
                                                        <td>The name of the learner at the time the certification.</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Certificate_Number</td>
                                                        <td>A unique number assigned to the certificate for identification.</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Certificate_IssuedOn</td>
                                                        <td>The date the certificate was issed.</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Certificate_Url</td>
                                                        <td>A downloadable url for the certificate.</td>
                                                    </tr>
                                                </tbody>
                                            </Table>
                                        </div>
                                        , { title: 'Certificate template', size: 'lg', confirmButtonProps: { children: 'OK' } });
                                }}><i className="far fa-info-circle"></i></Button></Form.Label>

                                <FormController
                                    name="certificateTemplateId"
                                    defaultValue={""}
                                    control={form.control}
                                    render={(controllerProps) => {
                                        return (
                                            <>
                                                {form.initialized && <AssetUploader
                                                    assetExtension=".doc, .docx, .rtf"
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
                            </Form.Group>

                            <Form.Group>
                                <Form.Label className="custom-control custom-checkbox">
                                    <Form.Control name="published" type="checkbox" className="custom-control-input" ref={form.register()} />
                                    <span className="custom-control-label">Mark as published</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid">{form.errors.published?.message}</Form.Control.Feedback>
                            </Form.Group>
                        </>
                    ) : (action) ? (
                        <p className="mb-0">Are you sure you want to {action} this course?</p>
                    ) : null}
                </Form>
            </Modal.Body>
            {
                (action == 'add' || action == 'edit') ? (

                    <Modal.Footer className="border-top-0">
                        {(action == 'edit') && <Button type="button" variant="danger" className="mr-auto" disabled={loading} as={Link} to={`/courses/${courseId}/delete`}>Delete</Button>}
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

export default CourseModal;