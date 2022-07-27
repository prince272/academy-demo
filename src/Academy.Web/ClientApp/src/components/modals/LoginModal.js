import React, { useEffect, useState, useMemo } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ApplicationPaths, getAuthenticationUrl, refreshAuthentication } from '../../api-authorization/ApiAuthorizationConstants';
import { cleanObject, useSessionState } from '../../utilities';

import appService from '../../utilities/appService';
import AppLoader from '../shared/AppLoader';

import '../../vendor/libs/react-phone-number-input/react-phone-number-input.scss';
import PhoneInput from 'react-phone-number-input/react-hook-form';

const LoginModal = (props) => {
    const history = props.history;
    const [returnLocation, setReturnLocation] = useSessionState(null, 'returnLocation');
    const location = props.location;
    const locationSearchParams = new URLSearchParams(location.search);
    const proceed = locationSearchParams.get('proceed') == 'true';

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
        }
    };
    const [show, setShow] = useState(true);
    const [loading, setLoading] = useState(false);

    const provider = form.watch('provider');

    const handleSubmit = async (values) => {
        setLoading(true);

        let result = await appService.login(values);

        if (!result.success) {
            setLoading(false);
            form.setErrors(result.errors);

            if (result.action == 'confirm') {
                history.replace('/account/code/send?' + new URLSearchParams(cleanObject({ ...values, action: result.action, })).toString());
            }
            else {
                toast.error(result.message);
            }
        }
        else {
            setLoading(false);
            setShow(false);

            window.location.replace(getAuthenticationUrl(returnLocation ?? history.location));
        }
    }

    useEffect(() => {
        if (proceed) {
            Object.entries(form.defaultValues).forEach(([key]) => {
                form.register(key);
            })
            form.setValues(form.defaultValues);
            form.handleSubmit(handleSubmit)();
        }
        else {
            form.setValues(form.defaultValues);
        }
    }, []);

    return (
        <Modal dialogClassName="modal-fullscreen-sm" show={show} animation={false} backdrop="static" size="sm" centered onHide={() => setShow(false)}>
            <div className="d-flex justify-content-between align-items-center p-3">
                <h4 className="mb-0">Login</h4>
                <Button type="button" variant="default" className="icon-btn" onClick={() => setShow(false)}><i className="far fa-times"></i></Button>
            </div>

            {loading && <div className="overlay"><AppLoader /></div>}

            <Modal.Body className={loading ? 'invisible' : ''}>
                <Form onSubmit={form.handleSubmit(handleSubmit)}>
                    <input name="provider" type="hidden" ref={form.register()} />

                    {(provider == null) && (
                        <>
                            <Form.Group>
                                <Button type="button" variant="primary" className="w-100" onClick={() => form.setValue('provider', 'email')}>Login with Email</Button>
                            </Form.Group>

                            <Form.Group>
                                <Button type="button" variant="secondary" className="w-100" onClick={() => form.setValue('provider', 'phoneNumber')}>Login with Phone Number</Button>
                            </Form.Group>
                        </>
                    )}

                    {(provider == 'email') && (
                        <Form.Group>
                            <Form.Label>Email</Form.Label>
                            <Form.Control name="email" type="text" ref={form.register()} className={`${form.errors.email ? 'is-invalid' : ''}`} />
                            <Form.Control.Feedback type="invalid">{form.errors.email?.message}</Form.Control.Feedback>
                        </Form.Group>
                    )}

                    {(provider == 'phoneNumber') && (
                        <Form.Group>
                            <Form.Label>Phone number</Form.Label>

                            <PhoneInput
                                name="phoneNumber"
                                control={form.control}
                                countrySelectProps
                                defaultCountry={window.appSettings.culture.countryCode}
                                numberInputProps={{ className: `form-control ${form.errors.phoneNumber ? 'is-invalid' : ''}` }} />

                            <Form.Control.Feedback type="invalid">{form.errors.phoneNumber?.message}</Form.Control.Feedback>
                        </Form.Group>
                    )}

                    {(provider == 'email' || provider == 'phoneNumber') && (
                        <>
                            <Form.Group>
                                <div className="d-flex justify-content-between">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Label as={Link} to={'/account/code/send?' + new URLSearchParams(cleanObject({ provider, action: 'recover' })).toString()}>Forgot password?</Form.Label>
                                </div>
                                <Form.Control name="password" type="password" ref={form.register()} className={`${form.errors.password ? 'is-invalid' : ''}`} />
                                <Form.Control.Feedback type="invalid">{form.errors.password?.message}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group>
                                <Button type="button" variant="primary" className="w-100" onClick={form.handleSubmit(handleSubmit)}>Login</Button>
                            </Form.Group>
                        </>
                    )}

                    <Form.Group>
                        <div className="text-center"><span>Don't have an account yet?</span> <Link to={`${ApplicationPaths.IdentityRegisterPath}?` + new URLSearchParams(cleanObject({ provider })).toString()}>Register <i className="fal fa-arrow-right"></i></Link></div>
                    </Form.Group>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default LoginModal;