import React, { useEffect, useState, useMemo } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ApplicationPaths } from '../../api-authorization/ApiAuthorizationConstants';
import appService from '../../utilities/appService';
import { cleanObject, prettifyString, setRefs, useFocus } from '../../utilities';

import AppLoader from '../shared/AppLoader';

import '../../vendor/libs/react-phone-number-input/react-phone-number-input.scss';
import PhoneInput from 'react-phone-number-input/react-hook-form';

import * as changeCase from "change-case";

const AccountActionModal = (props) => {
    const authorization = props.authorization;
    const populateAuthorization = props.populateAuthorization;

    const history = props.history;
    const location = props.location;
    const locationSearchParams = new URLSearchParams(location.search);
    const action = locationSearchParams.get('action');
    const provider = locationSearchParams.get('provider');

    const [sent, setSent] = useState(false);

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
    const [show, setShow] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values) => {
        if (!sent) {

            setLoading(true);

            let result = await appService.sendCode(values);

            if (!result.success) {

                form.setErrors(result.errors);
                toast.error(result.message);

                setLoading(false);
            }
            else {
                toast.success('Security code sent.');

                setLoading(false);
                setSent(true);
            }
        }
        else {
            setLoading(true);

            let result = await appService.receiveCode(values);

            if (!result.success) {

                form.setErrors(result.errors);
                toast.error(result.message);

                setLoading(false);
            }
            else {

                toast.success(((() => {
                    switch (action) {
                        case 'confirm': return `Your ${prettifyString(provider).toLowerCase()} has been confirmed.`;
                        case 'reset': return 'Your account has been reset.';
                        default: return 'Your request has been processed.';
                    }
                })()));

                setLoading(false);
                setShow(false);

                if (!authorization.user) {
                    history.replace(`${ApplicationPaths.IdentityLoginPath}?` + new URLSearchParams(cleanObject({ ...(Object.fromEntries(locationSearchParams)), ...values, proceed: true, })).toString())
                }
                else {
                    populateAuthorization();
                }
            }
        }
    }

    useEffect(() => {

        Object.entries(form.defaultValues).forEach(([key]) => {
            form.register(key);
        })

        form.setValues(form.defaultValues);
    }, []);

    return (
        <Modal dialogClassName="modal-fullscreen-sm" show={show} animation={false} backdrop="static" size="sm" centered onHide={() => setShow(false)}>
            <div className="d-flex justify-content-between align-items-center p-3">
                <h4 className="mb-0">{(!sent ? `${prettifyString(action)} Account` : 'Enter Security Code')}</h4>
                <Button type="button" variant="default" className="icon-btn" onClick={() => setShow(false)}><i className="far fa-times"></i></Button>
            </div>

            {loading && <div className="overlay"><AppLoader /></div>}

            <Modal.Body className={`pt-0 ${loading ? 'invisible' : ''}`}>
                <Form onSubmit={form.handleSubmit(handleSubmit)}>
                    <Form.Group>
                        {(() => {

                            if (sent) {
                                return <div>Please enter the security code that was sent to you to {prettifyString(action).toLowerCase()} your account.</div>;
                            }
                            else if (action == 'confirm') {
                                return <div>We'll send you a security code to {prettifyString(action).toLowerCase()} your account.</div>;
                            }
                            else if (action == 'recover') {
                                return <div>Enter your {prettifyString(provider).toLowerCase()} and a new password and we'll send you a security code to verify shortly.</div>
                            }
                        })()}
                    </Form.Group>

                    {sent && (
                        <Form.Group>
                            <Form.Label>Security code</Form.Label>
                            <Form.Control name="code" type="text" ref={form.register()} className={`${form.errors.code ? 'is-invalid' : ''}`} />
                            <Form.Control.Feedback type="invalid">{form.errors.code?.message}</Form.Control.Feedback>
                        </Form.Group>
                    )}
                    <div className={`${sent ? 'd-none' : ''}`}>
                        {((action == 'confirm' || action == 'recover') && provider == 'email' && locationSearchParams.get('currentEmail')) && (
                            <Form.Group>
                                <Form.Label>Current email</Form.Label>
                                <Form.Control name="currentEmail" type="text" ref={form.register()} className={`${form.errors.currentEmail ? 'is-invalid' : ''}`} readOnly={true} />
                            </Form.Group>
                        )}
                        {((action == 'confirm' || action == 'recover') && provider == 'phoneNumber' && locationSearchParams.get('currentPhoneNumber')) && (
                            <Form.Group>
                                <Form.Label>Current phone number</Form.Label>

                                <PhoneInput
                                    name="currentPhoneNumber"
                                    control={form.control}
                                    defaultCountry={window.appSettings.culture.countryCode}
                                    value={locationSearchParams.get('currentPhoneNumber')}
                                    numberInputProps={{
                                        className: `form-control`,
                                        readOnly: true,
                                    }}
                                    countrySelectProps={{
                                        disabled: true,
                                    }}
                                />

                                <Form.Control.Feedback type="invalid">{form.errors.phoneNumber?.message}</Form.Control.Feedback>
                            </Form.Group>
                        )}

                        {((action == 'confirm' || action == 'recover') && provider == 'email') && (
                            <Form.Group>
                                <Form.Label>{changeCase.sentenceCase(`${locationSearchParams.get('currentEmail') ? 'New' : ''}Email`)}</Form.Label>
                                <Form.Control name="email" type="text" ref={form.register()} className={`${form.errors.email ? 'is-invalid' : ''}`} readOnly={sent} />
                                <Form.Control.Feedback type="invalid">{form.errors.email?.message}</Form.Control.Feedback>
                            </Form.Group>
                        )}
                        {((action == 'confirm' || action == 'recover') && provider == 'phoneNumber') && (
                            <Form.Group>
                                <Form.Label>{changeCase.sentenceCase(`${locationSearchParams.get('currentPhoneNumber') ? 'New' : ''}Phone Number`)}</Form.Label>

                                <PhoneInput
                                    name="phoneNumber"
                                    control={form.control}
                                    defaultCountry={window.appSettings.culture.countryCode}
                                    numberInputProps={{
                                        className: `form-control ${form.errors.phoneNumber ? 'is-invalid' : ''}`,
                                        readOnly: sent
                                    }}
                                    countrySelectProps={{
                                        disabled: sent
                                    }}
                                />

                                <Form.Control.Feedback type="invalid">{form.errors.phoneNumber?.message}</Form.Control.Feedback>
                            </Form.Group>
                        )}

                        {(action == 'recover') && (
                            <Form.Group>
                                <Form.Label>New password</Form.Label>
                                <Form.Control name="password" type="text" ref={form.register()} className={`${form.errors.password ? 'is-invalid' : ''}`} readOnly={sent} />
                                <Form.Control.Feedback type="invalid">{form.errors.password?.message}</Form.Control.Feedback>
                            </Form.Group>
                        )}
                    </div>

                    <Form.Group>
                        <Button type="button" variant="primary" className="w-100" onClick={form.handleSubmit(handleSubmit)}>Continue</Button>
                    </Form.Group>

                    {sent && (
                        <Form.Group>
                            <div className="text-center"><span>Didn't receive the code?</span> <Button className="p-0" type="button" variant="link"
                                onClick={async () => {
                                    setLoading(true);

                                    form.setValue('code', '');
                                    const result = await appService.sendCode(form.defaultValues);

                                    if (!result.success)
                                        toast.error(result.message);
                                    else
                                        toast.success('Security code sent.');

                                    setLoading(false);

                                }}>Resend code <i className="fal fa-arrow-right"></i></Button></div>
                        </Form.Group>
                    )}
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AccountActionModal;