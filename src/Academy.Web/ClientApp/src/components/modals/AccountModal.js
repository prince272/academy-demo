import React, { useEffect, useState, useMemo } from 'react';
import { Button, Card, Form, InputGroup, ListGroup, Modal, Nav, ProgressBar, Tab } from 'react-bootstrap';
import { useForm, Controller as FormController,} from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import { cleanObject, withRemount } from '../../utilities';
import appService from '../../utilities/appService';

import AppLoader from '../shared/AppLoader';
import _ from 'lodash';
import AssetUploader from '../shared/AssetUploader';

import '../../vendor/libs/react-phone-number-input/react-phone-number-input.scss';
import PhoneInput from 'react-phone-number-input/react-hook-form';

const AccountModal = (props) => {
    const location = props.location;
    const [show, setShow] = useState(true);
    const tabs = [
        {
            key: 'edit-profile',
            title: 'Edit Profile',
            component: EditProfileTab
        },
        {
            key: 'payments',
            title: 'Payments',
            component: withRemount(PaymentsTab)
        }
    ];
    const [selectedTabKey, setSelectedTabKey] = useState(tabs.filter(x => x.key == _.trimStart(location.hash, '#'))[0]?.key || null);

    return (
        <Modal dialogClassName="modal-fullscreen-sm" scrollable={true} show={show} animation={false} backdrop="static" size={`${selectedTabKey != null ? 'md' : 'sm'}`} centered onHide={() => setShow(false)}>
            <div className="row no-gutters row-bordered row-border-light" style={{ minHeight: "550px", height: "100%" }}>
                <Tab.Container activeKey={selectedTabKey} onSelect={(value) => setSelectedTabKey(value)} transition={false} mountOnEnter={true} unmountOnExit={true}>
                    <div className={`col-sm-4 ${selectedTabKey != null ? 'd-none' : 'col-md-12 text-center'} d-sm-block`}>
                        <div className="d-flex justify-content-between align-items-center p-3" style={{ minHeight: "78px" }}>
                            <h4 className="mb-0">Account</h4>
                            <Button variant="default" className={`icon-btn ${selectedTabKey != null ? 'd-sm-none' : 'd-sm'}`} onClick={() => setShow(false)}><i className="far fa-times"></i></Button>
                        </div>
                        <Nav className="list-group list-group-flush">
                            {tabs.map((tab) => {
                                return (
                                    <Nav.Link key={tab.key} className="cursor-pointer d-flex align-items-center justify-content-between" as={ListGroup.Item} eventKey={tab.key}>
                                        <div>{tab.title}</div>
                                        <div className={`mr-3 ${selectedTabKey != null ? 'd-sm-none' : ''}`}><i className="far fa-arrow-right"></i></div>
                                    </Nav.Link>
                                );
                            })}
                        </Nav>
                    </div>
                    <div className="col-sm" style={{ minHeight: "inherit", height: "100%" }}>
                        <Tab.Content style={{ minHeight: "inherit", height: "100%" }}>
                            {tabs.map((tab) => {
                                return (
                                    <Tab.Pane key={tab.key} eventKey={tab.key} style={{ minHeight: "inherit", height: "100%" }}>
                                        <div className="d-flex flex-column" style={{ minHeight: "inherit", height: "100%" }}>
                                            <div className={`d-flex justify-content-between align-items-center px-3 pt-3`}>
                                                <Button variant="default" className="icon-btn d-sm-none" onClick={() => setSelectedTabKey(null)}><i className="far fa-arrow-left"></i></Button>
                                                <h4 className="mb-0">{tabs.filter(x => x.key == selectedTabKey)[0]?.title}</h4>
                                                <Button variant="default" className="icon-btn" onClick={() => setShow(false)}><i className="far fa-times"></i></Button>
                                            </div>
                                            <tab.component {...props} show={show} setShow={setShow} />
                                        </div>
                                    </Tab.Pane>
                                );
                            })}
                        </Tab.Content>
                    </div>
                </Tab.Container>
            </div>
        </Modal >
    );
};

const EditProfileTab = (props) => {
    const authorization = props.authorization;
    const populateAuthorization = props.populateAuthorization;
    const form = {
        ...useForm(),
        defaultValues: (() => {
            const values = {
                ...(authorization.user)
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
    const handleSubmit = async (values) => {
        setLoading(true);

        let result = await appService.editCurrentUser(values);

        if (!result.success) {

            form.setErrors(result.errors);
            toast.error(result.message);

            setLoading(false);
        }
        else {
            populateAuthorization();
            toast.success('Profile updated.');
            setLoading(false);
        }
    }
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        form.setValues(form.defaultValues);
        form.setInitialized(true);
    }, []);

    return (
        <>
            {loading && <div className="overlay"><AppLoader /></div>}

            <Modal.Body className={loading ? 'invisible' : ''}>
                <Form onSubmit={form.handleSubmit(handleSubmit)}>
                    <Form.Group>
                        <Form.Label>Avatar</Form.Label>
                        <div className="d-flex justify-content-center">
                            <div style={{ width: "180px", height: "180px" }}>
                                <FormController
                                    name="avatarId"
                                    defaultValue={""}
                                    control={form.control}
                                    render={(controllerProps) => {
                                        return (
                                            <>
                                                {form.initialized && <AssetUploader
                                                    assetType="image"
                                                    assetStyle="circle"
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
                            </div>
                        </div>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Name</Form.Label>
                        <Form.Control name="preferredName" type="text" ref={form.register()} className={`${form.errors.preferredName ? 'is-invalid' : ''}`} />
                        <Form.Control.Feedback type="invalid">{form.errors.preferredName?.message}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Username</Form.Label>
                        <InputGroup hasValidation={true}>
                            <InputGroup.Prepend>
                                <InputGroup.Text>@</InputGroup.Text>
                            </InputGroup.Prepend>
                            <Form.Control name="userName" type="text" ref={form.register()} className={`${form.errors.userName ? 'is-invalid' : ''}`} />
                            <Form.Control.Feedback type="invalid">{form.errors.userName?.message}</Form.Control.Feedback>
                        </InputGroup>
                    </Form.Group>
                    <Form.Group>
                        <div className="d-flex justify-content-between">
                            <Form.Label>Email</Form.Label>
                            <Form.Label as={Link} to={'/account/code/send?' + new URLSearchParams(cleanObject({ action: 'confirm', provider: 'email', currentId: authorization.user.id, currentEmail: authorization.user.email })).toString()}>{authorization.user.email ? 'Change' : 'Set'} email</Form.Label>
                        </div>
                        <Form.Control name="email" type="text" ref={form.register()} className={`${form.errors.email ? 'is-invalid' : ''}`} disabled />
                    </Form.Group>
                    <Form.Group>
                        <div className="d-flex justify-content-between">
                            <Form.Label>Phone number</Form.Label>
                            <Form.Label as={Link} to={'/account/code/send?' + new URLSearchParams(cleanObject({ action: 'confirm', provider: 'phoneNumber', currentId: authorization.user.id, currentPhoneNumber: authorization.user.phoneNumber })).toString()}>{authorization.user.phoneNumber ? 'Change' : 'Set'} phone number</Form.Label>
                        </div>
                        <PhoneInput
                            name="phoneNumber"
                            control={form.control}

                            defaultCountry={window.appSettings.culture.countryCode}
                            numberInputProps={{
                                className: `form-control ${form.errors.phoneNumber ? 'is-invalid' : ''}`,
                                readOnly: true
                            }}
                            countrySelectProps={{
                                disabled: true
                            }}
                        />
                    </Form.Group>
                    <Form.Group>
                        <div className="d-flex justify-content-between">
                            <Form.Label>Password</Form.Label>
                            <Form.Label as={Link} to={'/account/password/change'}>Change password</Form.Label>
                        </div>
                        <Form.Control name="" type="password" value="************" disabled />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Bio</Form.Label>
                        <Form.Control name="bio" type="text" as="textarea" ref={form.register()} className={`${form.errors.bio ? 'is-invalid' : ''}`} />
                        <Form.Control.Feedback type="invalid">{form.errors.bio?.message}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Location</Form.Label>
                        <Form.Control name="location" type="text" ref={form.register()} className={`${form.errors.location ? 'is-invalid' : ''}`} />
                        <Form.Control.Feedback type="invalid">{form.errors.location?.message}</Form.Control.Feedback>
                    </Form.Group>

                </Form>
            </Modal.Body>

            <Modal.Footer className="border-top-0">
                <Button type="button" variant="primary" disabled={loading} onClick={form.handleSubmit(handleSubmit)}>Save</Button>
            </Modal.Footer>
        </>
    );
}

const PaymentsTab = (props) => {
    return (
        <div>
        </div>
    );
}

export default AccountModal;