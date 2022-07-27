import React, { useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { Link, Redirect } from 'react-router-dom';
import { ApplicationPaths } from '../../../api-authorization/ApiAuthorizationConstants';

const Index = (props)  => {
    const authorization = props.authorization;

    if (authorization.user) {
        return <Redirect to={`/learners/${authorization.user.id}`} />
    }

    return (
        <>
            <section className="container container-p-y">
                <div className="row align-items-center text-center text-lg-left py-5">
                    <div className="col-lg-6 col-12 order-lg-2">
                        <img src={`${process.env.PUBLIC_URL}/miscellaneous/banner.svg`} className="w-100 img-fluid" />
                    </div>
                    <div className="col-lg-6 col-12 py-5 order-lg-1">
                        <h1 className="mb-4 display-3 font-weight-bold">Interactive Lessons on the Go</h1>
                        <p className="pt-3 lead">Interactive lessons that can speak to students the way traditional lessons may not be able to.</p>
                        <div>
                            <Button as={Link} to="/learn" type="button" variant="primary" size="lg" className="mb-3">Start Learning<i className="far fa-arrow-right ml-2"></i></Button>
                        </div>
                        <p>Already have an account? <Link to={ApplicationPaths.IdentityLoginPath}>Sign in</Link>.</p>
                    </div>
                </div>
            </section>

            <section action="start" className="ui-bg-cover ui-bg-overlay-container text-white py-5" style={{ backgroundImage: `url('${process.env.PUBLIC_URL}/images/bg/1.jpg')` }}>
                <div className="ui-bg-overlay bg-dark rounded opacity-75"></div>

                <div className="container py-5">
                    <div className="row justify-content-center">
                        <div className="col-lg-10 text-center">
                            <span className="d-block mb-4 h6 font-weight-normal">Are you ready to start your journey with us?</span>
                            <h2 className="mb-4 display-3 font-weight-bold">Education for Individual and Social Responsibility</h2>
                            <div>
                                <Button as={Link} to="/learn" type="button" variant="primary" size="lg">Start Learning<i className="far fa-arrow-right ml-2"></i></Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="benefits">
                <div className="py-5 theme-bg-white">
                    <div className="container">
                        <div className="row justify-content-center align-items-center text-center py-4">
                            <div className="col-sm-9">
                                <div className="mb-2 text-primary h5">BENEFITS</div>
                                <h2 className="mb-4 display-3 font-weight-bold">Why start studying <span className="text-primary">Online</span></h2>
                                <hr className="mt-2 mb-3 bg-primary" style={{ width: "90px", paddingBottom: "1px"}} />
                                <p className="mb-0 text-medium">Be committed to your business and build a great business plan with so many benefits along the way.</p>
                            </div>
                        </div>
                        <div className="row align-items-center pt-4">
                            <div className="col-md-6 col-lg-4">
                                <div className="media flex-column align-items-center text-center pb-4">
                                    <div><i className="fad fa-globe-africa fa-5x text-primary"></i></div>
                                    <div className="media-body pt-3">
                                        <h3 className="h4">Scheduling Flexibility</h3>
                                        <p className="text-medium mb-0">If you are already in the workforce, have a family, or just want a way to pursue a course without uprooting your entire life. Studying online affords you that opportunity.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6 col-lg-4">
                                <div className="media flex-column align-items-center text-center pb-4">
                                    <div><i className="fad fa-money-bill-alt fa-5x text-primary"></i></div>
                                    <div className="media-body pt-3">
                                        <h3 className="h4">Lower costs and debts</h3>
                                        <p className="text-medium mb-0">Studying online means that you pay the tuition fee, possibly courses. You don’t, however, incur the costs of housing and transportation, which translates to lower debts and more savings.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6 col-lg-4">
                                <div className="media flex-column align-items-center text-center pb-4">
                                    <div><i className="fad fa-lock fa-5x text-primary"></i></div>
                                    <div className="media-body pt-3">
                                        <h3 className="h4">Self-discipline and responsibility</h3>
                                        <p className="text-medium mb-0">It is true that studying online requires more self-motivation because you will spend a lot of time on your own without someone physically close to keep you focused on deadlines.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default Index;