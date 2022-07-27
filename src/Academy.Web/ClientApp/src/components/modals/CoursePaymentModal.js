import React, { useState, useEffect } from 'react';
import { useForm, Controller as FormController, } from 'react-hook-form';
import { Modal, Form, Button, Table, Card } from 'react-bootstrap';
import toast from 'react-hot-toast';
import AssetUploader from '../shared/AssetUploader';
import AppLoader from '../shared/AppLoader';
import appService from '../../utilities/appService';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';

import { } from '../../utilities';
import TruncateMarkup from 'react-truncate-markup';

const CoursePaymentModal = (props) => { 
    const location = props.location;
    const locationSearchParams = new URLSearchParams(location.search);

    const form = {
        ...useForm(),
        defaultValues: (() => {
            const values = {
                ...(Object.fromEntries(locationSearchParams))
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
    const [courses, setCourses] = useState(null);
    const [courseIds, setCourseIds] = useState([]);
    const [show, setShow] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);

            const coursesResult = await appService.populateCourses();

            if (!coursesResult.success) {
                toast.error(coursesResult.message);

                setLoading(false);
                setShow(false);
            }
            else {
                setCourses(coursesResult.data);
                setLoading(false);
            }
        })();

        return () => {

        };
    }, []);

    const handleSubmit = async (values) => {
        setLoading(true);

        let result = await appService.importCourses(values);

        if (!result.success) {
            toast.error(result.message);
            form.setErrors(result.errors);
            setLoading(false);
        }
        else {
            setLoading(false);
        }
    };

    return (
        <Modal dialogClassName="modal-fullscreen-sm" show={show} animation={false} backdrop="static" scrollable={true} onHide={() => setShow(false)}>
            <div className="d-flex justify-content-between align-items-center p-3">
                <h4 className="mb-0">Pay</h4>
                <Button type="button" variant="default" className="icon-btn" onClick={() => setShow(false)}><i className="far fa-times"></i></Button>
            </div>

            {loading && <div className="overlay"><AppLoader /></div>}

            <Modal.Body className={loading ? 'invisible' : ''}>
                <Form onSubmit={form.handleSubmit(handleSubmit)}>
                    <input name="purpose" type="hidden" ref={form.register()} />
                    <input name="refString" type="hidden" ref={form.register()} />
                    <input name="redirectUrl" type="hidden" ref={form.register()} />
                    <>
                        {courses == null || courses.length == 0 && (
                            <div className="d-flex justify-content-center align-items-center h-100 py-3">
                                <div className="h4 mb-0">No courses</div>
                            </div>
                        )}
                        {courses != null && courses.map((course, courseIndex) => {
                            return (
                                <div key={course.id} className="m-2">
                                    <Card className="shadow-none border-hover border-primary bg-body cursor-default p-0">
                                        <Card.Body className="d-flex align-items-center p-0">
                                            <div className="d-flex justify-content-center align-items-center theme-bg-dark rounded-circle m-2" style={{ width: "48px", height: "48px" }}>
                                                {course.image != null ? <img src={course.image.fileUrl} className="w-100 h-100 img-fluid rounded-circle" /> : <i className="fad fa-book fa-2x theme-text-white"></i>}
                                            </div>
                                            <div className="my-2 mr-2 flex-grow-1">
                                                <div className="d-flex justify-content-between">
                                                    <div className="d-flex align-items-center"><div className="mr-2"><TruncateMarkup><div className="h5 mb-0 stretched-link text-reset d-inline-block" onClick={() => {

                                                      
                                                    }}>{course.title}</div></TruncateMarkup></div></div>
                                                </div>
                                            </div>
                                            <div className="ml-2">
                                                <div className={`badge-default rounded-pill d-flex justify-content-center align-items-center m-3`}
                                                    style={{ width: "32px", height: "32px" }}>
                                                    <i className={`text-dark far fa-minus`}></i>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </div>
                            );
                        })}
                    </>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-top-0">
                <Button type="button" variant="default" disabled={loading} onClick={() => setShow(false)}>Cancel</Button>
                <Button type="button" variant="primary" disabled={loading} onClick={form.handleSubmit(handleSubmit)}>Pay</Button>
            </Modal.Footer>
        </Modal >
    );
};

export default CoursePaymentModal;