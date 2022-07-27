import React, { useEffect, useState, useMemo } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ApplicationPaths } from '../../api-authorization/ApiAuthorizationConstants';
import appService from '../../utilities/appService';
import { cleanObject } from '../../utilities';

import AppLoader from '../shared/AppLoader';

const AccountChangePasswordModal = (props) => {
    const populateAuthorization = props.populateAuthorization;

    const [show, setShow] = useState(true);
    const [loading, setLoading] = useState(false);

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
    const handleSubmit = async (values) => {
        setLoading(true);

        let result = await appService.changePassword(values);

        if (!result.success) {

            form.setErrors(result.errors);
            toast.error(result.message);

            setLoading(false);
        }
        else {
            populateAuthorization();
            toast.success('Password changed.');
            setLoading(false);
            setShow(false);
        }
    }

    useEffect(() => {
        form.setValues(form.defaultValues);
    }, []);

    return (
        <Modal dialogClassName="modal-fullscreen-sm" show={show} animation={false} backdrop="static" size="sm" centered onHide={() => setShow(false)}>
            <div className="d-flex justify-content-between align-items-center p-3">
                <h4 className="mb-0">Change password</h4>
                <Button type="button" variant="default" className="icon-btn" onClick={() => setShow(false)}><i className="far fa-times"></i></Button>
            </div>

            {loading && <div className="overlay"><AppLoader /></div>}

            <Modal.Body className={loading ? 'invisible' : ''}>
                <Form onSubmit={form.handleSubmit(handleSubmit)}>
                    <Form.Group>
                        <div className="d-flex justify-content-between">
                            <Form.Label>Current password</Form.Label>
                            <Form.Label as={Link} to={'/account/code/send?' + new URLSearchParams(cleanObject({ action: 'resetPassword' })).toString()}>Forgot password?</Form.Label>
                        </div>
                        <Form.Control name="currentPassword" type="text" ref={form.register()} className={`${form.errors.currentPassword ? 'is-invalid' : ''}`} />
                        <Form.Control.Feedback type="invalid">{form.errors.currentPassword?.message}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>New password</Form.Label>
                        <Form.Control name="newPassword" type="text" ref={form.register()} className={`${form.errors.newPassword ? 'is-invalid' : ''}`} />
                        <Form.Control.Feedback type="invalid">{form.errors.newPassword?.message}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group>
                        <Button type="button" variant="primary" className="w-100" onClick={form.handleSubmit(handleSubmit)}>Change password</Button>
                    </Form.Group>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AccountChangePasswordModal;