import React from 'react';
import { Dropdown, Nav, Navbar, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import appService from '../../utilities/appService';
import { ApplicationPaths } from '../../api-authorization/ApiAuthorizationConstants';

const LayoutPage = (props) => {
    const authorization = props.authorization;
    const history = props.history;
    const themeSettings = window.themeSettings;

    return (
        <div className="layout-wrapper layout-2">
            <div className="layout-inner">

                <div className="layout-container">

                    <Navbar expand="lg" className={`fixed-top navbar-light bg-navbar-theme shadow-sm align-items-lg-center container-p-x`}>
                        <div className="container container-p-x">
                            <Navbar.Brand as={Link} to="/" className="app-brand py-0 mr-4">
                                <span className="app-brand-text ml-2 font-weight-bold text-uppercase">Academy</span>
                            </Navbar.Brand>

                            <div className="mx-auto"></div>

                            <Nav.Item className="order-lg-2 mr-2 mr-lg-0 d-flex align-items-center">
                                <div>
                                    <Dropdown.Toggle variant="default" className="border-0 icon-btn text-large" bsPrefix=" " onClick={() => {

                                        if (themeSettings.isLightStyle())
                                            themeSettings.setStyle('dark');
                                        else
                                            themeSettings.setStyle('light');
                                    }}>
                                        {themeSettings.isLightStyle() ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
                                    </Dropdown.Toggle>
                                </div>
                                <Dropdown alignRight={true} className="d-none d-lg-block">
                                    <Dropdown.Toggle variant="default" className="py-1 px-2 border-0" bsPrefix=" ">
                                        <div className="d-inline-flex align-items-center align-middle">
                                            <span className="px-1 mr-2 d-none d-lg-block">{authorization.user ? authorization.user.preferredName : 'Account'}</span>
                                            <div className="d-flex justify-content-center align-items-center theme-bg-dark rounded-circle" style={{ width: "32px", height: "32px" }}>
                                                {authorization.user && authorization.user.avatar != null ? <img src={authorization.user.avatar.fileUrl} className="w-100 h-100 img-fluid rounded-circle" /> : <i className="fad fa-user theme-text-white"></i>}
                                            </div>
                                        </div>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        {authorization.user && (
                                            <>
                                                <Dropdown.Item as={Link} to={`/learners/${authorization.user.id}`}><i className="far fa-user mr-2"></i>Profile</Dropdown.Item>
                                                <Dropdown.Item as={Link} to="/account"><i className="far fa-cog mr-2"></i>Settings</Dropdown.Item>
                                                <Dropdown.Divider />
                                                <Dropdown.Item as="button" onClick={() => { history.push({ pathname: `${ApplicationPaths.LogOut}`, state: { local: true } }) }}><i className="far fa-sign-out mr-2"></i>Log out</Dropdown.Item>
                                            </>
                                        )}
                                        {!authorization.user && (
                                            <>
                                                <Dropdown.Item as={Link} to={ApplicationPaths.IdentityLoginPath}><i className="far fa-sign-in mr-2"></i>Log in</Dropdown.Item>
                                                <Dropdown.Item variant="primary" as={Link} to={ApplicationPaths.IdentityRegisterPath}><i className="far fa-user mr-2"></i>Register</Dropdown.Item>
                                            </>
                                        )}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </Nav.Item>

                            <Navbar.Toggle />

                            <Navbar.Collapse className="flex-grow-0 order-lg-1">

                                <Nav className="ml-auto">
                                    <Nav.Link as={Link} to="/learn" className="text-body"><i className="far fa-book-reader text-large align-middle mr-2"></i>Start learning</Nav.Link>
                                </Nav>

                                {authorization.user && authorization.user.roles.includes('admin') && (
                                    <Nav className="ml-auto">
                                        <Nav.Link as={Link} to="/courses" className="text-body"><i className="far fa-books text-large align-middle mr-2"></i>Courses</Nav.Link>
                                    </Nav>
                                )}

                                {authorization.user && authorization.user.roles.includes('admin') && (
                                    <>
                                        <Nav className="ml-auto">
                                            <Nav.Link as={Link} to="/learners" className="text-body"><i className="far fa-users text-large align-middle mr-2"></i>Learners</Nav.Link>
                                        </Nav>

                                        <Nav className="ml-auto">
                                            <Nav.Link as={Link} to="/comments" className="text-body"><i className="far fa-comments text-large align-middle mr-2"></i>Comments</Nav.Link>
                                        </Nav>
                                    </>
                                )}

                                {authorization.user && (
                                    <>
                                        <Nav className="ml-auto d-lg-none">
                                            <Nav.Link as={Link} to={`/learners/${authorization.user.id}`} className="text-body"><i className="far fa-user text-large align-middle mr-2"></i>Profile</Nav.Link>
                                        </Nav>
                                        <Nav className="ml-auto d-lg-none">
                                            <Nav.Link as={Link} to="/account" className="text-body"><i className="far fa-cog text-large align-middle mr-2"></i>Settings</Nav.Link>
                                        </Nav>
                                        <Nav className="ml-auto d-lg-none">
                                            <Nav.Link as={Link} className="text-body" onClick={() => { history.replace(`${ApplicationPaths.LogOut}`, { local: true }) }}><i className="far fa-sign-out text-large align-middle mr-2"></i>Log out</Nav.Link>
                                        </Nav>
                                    </>
                                )}
                                {!authorization.user && (
                                    <>
                                        <Nav className="ml-auto d-lg-none">
                                            <Nav.Link as={Link} to={ApplicationPaths.IdentityLoginPath} className="text-body"><i className="far fa-sign-in text-large align-middle mr-2"></i>Log in</Nav.Link>
                                            <Nav.Link as={Link} to={ApplicationPaths.IdentityRegisterPath} className="text-body"><i className="far fa-user text-large align-middle mr-2"></i>Register</Nav.Link>
                                        </Nav>
                                    </>
                                )}
                            </Navbar.Collapse>
                        </div>
                    </Navbar>


                    <div id="layout-content" className="layout-content" style={{ paddingTop: "58px" }}>
                        {props.children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LayoutPage;
