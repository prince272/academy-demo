import React, { useState, useEffect } from 'react';
import { useForm, Controller as FormController, } from 'react-hook-form';
import { Modal, Form, Button, Table } from 'react-bootstrap';
import toast from 'react-hot-toast';
import AssetUploader from '../shared/AssetUploader';
import AppLoader from '../shared/AppLoader';
import appService from '../../utilities/appService';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';

import { } from '../../utilities';

const CourseImportModal = (props) => {
    const dispatcher = props.dispatcher;

    const form = {
        ...useForm(),
        defaultValues: (() => {
            const values = {
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
    };

    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(true);

    const handleSubmit = async (values) => {
        setLoading(true);

        let result = await appService.importCourses(values);

        if (!result.success) {
            toast.error(result.message);

            form.setErrors(result.errors);
            setLoading(false);
        }
        else {
            toast.success(`Courses imported.`);

            setLoading(false);
            setShow(false);

            dispatcher.trigger(`IMPORT_COURSES`);
        }
    };

    return (
        <Modal dialogClassName="modal-fullscreen-sm" show={show} animation={false} backdrop="static" scrollable={true} onHide={() => setShow(false)}>
            <div className="d-flex justify-content-between align-items-center p-3">
                <h4 className="mb-0">Import Courses</h4>
                <Button type="button" variant="default" className="icon-btn" onClick={() => setShow(false)}><i className="far fa-times"></i></Button>
            </div>

            {loading && <div className="overlay"><AppLoader /></div>}

            <Modal.Body className={loading ? 'invisible' : ''}>
                <Form onSubmit={form.handleSubmit(handleSubmit)}>
                    <Form.Group>
                        <Form.Label className="font-weight-normal">Upload the JSON file with the info you want to import.</Form.Label>
                        <FormController
                            name="documentId"
                            defaultValue={""}
                            control={form.control}
                            render={(controllerProps) => {
                                return (
                                    <>
                                        {<AssetUploader
                                            assetExtension=".json"
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
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-top-0">
                <Button type="button" variant="default" disabled={loading} onClick={() => setShow(false)}>Cancel</Button>
                <Button type="button" variant="primary" disabled={loading} onClick={form.handleSubmit(handleSubmit)}>Import</Button>
            </Modal.Footer>
        </Modal >
    );
};

export default CourseImportModal;