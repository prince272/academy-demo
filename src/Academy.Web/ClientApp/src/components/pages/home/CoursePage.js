import React, { useRef, useState, useEffect  } from 'react';
import { Button, Card, Dropdown, Collapse, OverlayTrigger, Tooltip, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ApplicationPaths } from '../../../api-authorization/ApiAuthorizationConstants';
import toast from 'react-hot-toast';
import { withRemount, downloadFromUrl, prettifyNumber, useSessionState, prettifyString } from '../../../utilities';
import appService from '../../../utilities/appService';

import AppLoader from '../../shared/AppLoader';

import { CircularProgressbarWithChildren as CircularProgressbar, buildStyles as buildCircularProgressbarStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import TruncateMarkup from 'react-truncate-markup';

import ReactDOM from 'react-dom';
import * as Scroll from 'react-scroll';
import * as moment from 'moment';

import confetti from 'canvas-confetti';
import { UserList } from './UserListPage';

const CertificateConfetti = (props) => {

    useEffect(() => {
        var duration = 10 * 1000;
        var animationEnd = Date.now() + duration;
        var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2090 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        var interval = setInterval(function () {
            var timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            var particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }, []);
    return (<></>);
};

const ScrollToElement = (props) => {
    const elementNameRef = useRef(`${Math.floor(Math.random() * 100000)}`);
    const scroller = Scroll.scroller;

    useEffect(() => {
        if (props.scroll) {

            var defaults = {
                smooth: true,
                containerId: 'layout-content'
            };

            scroller.scrollTo(elementNameRef.current, Object.assign({}, defaults, props.scrollTo));
        }
    }, []);

    return <Scroll.Element name={elementNameRef.current}>{props.children}</Scroll.Element>
};

const CoursePage = (props) => {
    const appSettings = window.appSettings;
    const themeSettings = window.themeSettings;
    const authorization = props.authorization;
    const history = props.history;
    const location = props.location;
    const action = props.match.params.action;
    const dialog = props.dialog;

    const blockPage = props.blockPage;
    const unblockPage = props.unblockPage;

    const [loading, setLoading] = useState({});
    const loadingProps = { retry: props.remount };

    const courseId = props.match.params.courseId;
    const [course, setCourse] = useState(null);

    const [sectionCollapse, setSectionCollapse] = useState([]);
    const [sections, setSections] = useState(null);

    const [paymentRedirect, setPaymentRedirect] = useSessionState(null, 'paymentRedirect');

    useEffect(() => {
        (async () => {
            if (action == 'payment') {

                // TODO: Payment gateway appends transaction query params wrongly to redirect url when that url already has queries added to it. Since there are no farther issues caused, we only take what we need.
                const transactionId = (new URLSearchParams(location.search).get('transactionId'))?.split('?')[0];
                const verifyPaymentResult = await appService.verifyPayment({ transactionId });

                if (!verifyPaymentResult.success) {
                    toast.error(verifyPaymentResult.message);
                }
                else {
                    toast.success('Payment successful. You can take this course now!');

                    if (paymentRedirect != null)
                        history.replace(paymentRedirect);
                }
            }

            const courseResult = await appService.populateCourses({ courseId });

            if (!courseResult.success) {
                setLoading({ status: 'error', message: courseResult.message });
            }
            else {
                setCourse(courseResult.data);
                setSections(courseResult.data.sections);
                setSectionCollapse(courseResult.data.sections.map((section, sectionIndex) => sectionIndex == 0 || section.status == 'started'));
                setLoading(null);

                if (action == 'complete' && courseResult.data.status == 'completed') {
                    dialog.alert((
                        <>
                            <CertificateConfetti />
                            <div className="row flex-column justify-content-center text-center">
                                <div className="col pb-3">
                                    <div className="rounded-pill bg-primary d-flex align-items-center justify-content-center mx-auto" style={{ width: "128px", height: "128px" }}><i className="fad fa-clipboard-check text-white fa-5x"></i></div>
                                </div>
                                {courseResult.data.certificated ? (
                                    <div className="col pb-3">
                                        <div className="pb-3">Congratulations! You have successfully completed this course and we happy to present your certificate to you.</div>
                                        <Button variant="primary" onClick={() => {
                                            const certificate = courseResult.data.certificate;
                                            if (certificate != null) {
                                                downloadFromUrl(certificate.fileUrl, certificate.fileName);
                                            }
                                        }}>Download Certificate</Button>
                                    </div>
                                ) : (<div>Congratulations! You have successfully completed this course.</div>)}
                            </div>
                        </>
                    ), { title: 'Congratulations!', size: 'sm', showFooter: false });
                }
            }
        })();
    }, []);


    if (loading != null) {
        return <AppLoader {...loadingProps} {...loading} />
    }

    return (
        <>
            <div className="theme-bg-dark position-absolute w-100" style={{ left: "0px", height: "280px" }}></div>
            <div className="container container-p-y">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-9">
                        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3">
                            <div>
                                <Button variant="white" as={Link} to="/learn"><i className="far fa-arrow-left mr-2"></i>Courses</Button>
                            </div>
                            <div></div>
                        </div>
                        <div className="d-flex align-items-center mb-4 text-white">
                            <div className="flex-shrink-0" style={{ width: "84px", height: "84px" }}>
                                <CircularProgressbar value={(Math.round((((course.progress || 0) * 100) + Number.EPSILON) * 100) / 100)} strokeWidth={3}
                                    styles={buildCircularProgressbarStyles({
                                        textColor: themeSettings.settings.theme.colors.primary,
                                        pathColor: themeSettings.settings.theme.colors.primary,
                                        trailColor: themeSettings.settings.theme.colors.light,
                                        strokeLinecap: "butt",
                                    })}>
                                    <div className="d-flex justify-content-center align-items-center theme-bg-dark rounded-circle" style={{ width: "72px", height: "72px" }}>
                                        {course.image != null ? <img src={course.image.fileUrl} className="w-100 h-100 img-fluid rounded-circle" /> : <i className="fad fa-book fa-2x theme-text-white"></i>}
                                    </div>
                                </CircularProgressbar>
                            </div>
                            <div className="ml-3">
                                <div className="d-flex align-items-center mb-1">
                                    <h1 className="h4 mb-0">
                                        <TruncateMarkup lines={1}>
                                            <div>
                                                <div>{course.title}</div>
                                            </div>
                                        </TruncateMarkup>
                                    </h1>
                                </div>
                                <div className="small mb-1">
                                    <TruncateMarkup lines={2}>
                                        <div>{course.description}</div>
                                    </TruncateMarkup>
                                </div>
                                <div className="row mx-n1">
                                    <div className="col-auto p-1"><Button variant="white" className="badge py-2" onClick={() => {
                                        dialog.alert(<><UserList courseIds={[course.id]} currentUser={authorization.user} onSetUserPage={(value) => { dialog.update({ title: `Learners (${value?.totalItems || 0})` }); }} /></>, { title: 'Learners (0)', scrollable: true, showFooter: false })
                                    }}><i className="fas fa-users mr-1"></i>{prettifyNumber(course.learnersCount)} {course.learnersCount == 1 ? 'Learner' : 'Learners'}</Button></div>

                                    <div className="col-auto p-1"><Button variant="white" className="badge py-2" onClick={() => {
                                        dialog.alert(<CourseDetailsDiv course={course} />, { title: `${course.title} Analysis`, scrollable: true, showFooter: false })}}><i className="fas fa-heart-rate mr-1"></i>Analysis</Button></div>
                                </div>
                            </div>
                        </div>
                        <div>
                            {(sections.length > 0) &&
                                <div className="row">
                                    {sections.map((section, sectionIndex) => (
                                        <div key={section.id} className="col-12 pb-3">
                                            <Card>
                                                <Card.Header className="p-0 d-flex justify-content-between align-items-stretch border-bottom-0">
                                                    <div className="d-flex align-items-center flex-grow-1 pl-3 pr-2 cursor-pointer" onClick={() => setSectionCollapse(Object.assign([], sectionCollapse.map(x => false), { [sectionIndex]: !sectionCollapse[sectionIndex] }))}>
                                                        <div className="flex-grow-1 text-break">
                                                            <Card.Title className="mb-0">
                                                                <TruncateMarkup lines={1}><div>{section.title}</div></TruncateMarkup>
                                                            </Card.Title>
                                                        </div>
                                                    </div>
                                                    <div className="p-2 d-flex align-items-center">
                                                        <div className="mr-2">{section.lessons.filter(x => x.status == 'completed').length}/{section.lessons.length}</div>
                                                        <div>
                                                            <OverlayTrigger overlay={(props) => <Tooltip {...props}>Extend</Tooltip>}>
                                                                <Button as="div" variant="default" className="icon-btn borderless" onClick={() => setSectionCollapse(Object.assign([], sectionCollapse.map(x => false), { [sectionIndex]: !sectionCollapse[sectionIndex] }))}>
                                                                    {sectionCollapse[sectionIndex] ? <i className={`far fa-chevron-up`}></i> : <i className={`far fa-chevron-down`}></i>}
                                                                </Button>
                                                            </OverlayTrigger>
                                                        </div>
                                                    </div>
                                                </Card.Header>
                                                <Collapse in={sectionCollapse[sectionIndex]}>
                                                    <div>
                                                        <div style={{ minHeight: "54px" }}>
                                                            {section.lessons.map((lesson, lessonIndex) =>
                                                                <Card name={lesson.id} key={lesson.id} className={`shadow-sm ${lesson.status == 'locked' ? '' : 'border-hover border-primary'} bg-body cursor-default p-0 m-2`}>
                                                                    <ScrollToElement scroll={lesson.status == 'started'}>
                                                                        <div className={`${lesson.status == 'locked' ? 'opacity-50' : ''}`}>
                                                                            <div className="d-flex justify-content-between align-items-stretch py-1">
                                                                                <div className="d-flex align-items-center flex-grow-1 pl-4 pr-2">
                                                                                    <div className="flex-grow-1">
                                                                                        <div className="h5 text-break mb-1">
                                                                                            <TruncateMarkup>
                                                                                                <div>
                                                                                                    {(lesson.contents.length > 0) && (lesson.status == 'started' || lesson.status == 'completed') ?
                                                                                                        (<div className="stretched-link cursor-pointer" onClick={async () => {

                                                                                                            const contentUrl = `/learn/${course.id}/${section.id}/${lesson.id}/${lesson.contents[0].id}`;

                                                                                                            if (course.fee > 0 && !course.feePaid) {
                                                                                                                const confirmed = await dialog.confirm(<span>You need to pay a fee of {appSettings.culture.currencySymbol}{course.fee} to take this course?</span>,
                                                                                                                    { title: 'Payment for course', confirmButtonProps: { children: <span>Pay Now</span> } });

                                                                                                                if (confirmed) {
                                                                                                                    const paymentModel = {
                                                                                                                        purpose: 'learn',
                                                                                                                        refString: course.id,
                                                                                                                        redirectUrl: window.location.origin + `/learn/${course.id}/payment`
                                                                                                                    };

                                                                                                                    blockPage(<AppLoader />);
                                                                                                                    const paymentResult = await appService.processPayment(paymentModel);
                                                                                                                    unblockPage();

                                                                                                                    if (!paymentResult.success) {
                                                                                                                        toast.error('Unable to process payment.');
                                                                                                                    }
                                                                                                                    else {
                                                                                                                        setPaymentRedirect(contentUrl);
                                                                                                                        window.location.replace(paymentResult.data.checkoutUrl);
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                            else {
                                                                                                                history.push(contentUrl);
                                                                                                            }
                                                                                                        }}>{lesson.title}</div>) :
                                                                                                        (<div>{lesson.title}</div>)
                                                                                                    }
                                                                                                </div>
                                                                                            </TruncateMarkup>
                                                                                        </div>

                                                                                        <TruncateMarkup>
                                                                                            <div className="d-flex text-muted small">
                                                                                                <div>{`${lesson.contents.length} ${lesson.contents.length == 1 ? 'content' : 'contents'}`}</div>
                                                                                                <div className="mx-1">•</div>
                                                                                                <div>{moment.duration(lesson.duration, "minutes").humanize()}</div>
                                                                                            </div>
                                                                                        </TruncateMarkup>
                                                                                    </div>
                                                                                </div>
                                                                                <div className={`${lesson.status == 'locked' ? 'bg-dark' : lesson.status == 'completed' ? 'bg-success' : 'bg-primary'} rounded-pill d-flex justify-content-center align-items-center m-3`}
                                                                                    style={{ width: "32px", height: "32px" }}>
                                                                                    <i className={`text-white far ${lesson.status == 'completed' ? 'fa-check' :
                                                                                        lesson.status == 'locked' ? 'fa-lock' :
                                                                                            lesson.status == 'started' ? 'fa-play' : ''}`}></i>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </ScrollToElement>
                                                                </Card>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Collapse>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            }

                            {course.certificated &&
                                <Card>
                                    <Card.Body>
                                        <div className="d-flex align-items-center">
                                            <div>
                                                <i className="fad fa-file-certificate fa-4x"></i>
                                            </div>
                                            <div className="flex-grow-1 ml-3">
                                                <h1 className="h4 mb-1">Certification</h1>
                                                <div className="mb-3">{(course.status == 'completed') ?
                                                    <span>We are happy to present your certificate to you for completing this course.</span> :
                                                    <span>In order to get you certificate, you should complete the course. Certificates allow you to prove your education.</span>} </div>
                                                <div className="row align-items-center">

                                                    <div className="col-12 col-lg pb-lg-0">
                                                        <div className="mb-2">Lessons Completed ({(Math.round((((course.progress || 0) * 100) + Number.EPSILON) * 100) / 100)}%)</div>
                                                        <div className="mb-3"><ProgressBar className="bg-dark" now={(Math.round((((course.progress || 0) * 100) + Number.EPSILON) * 100) / 100)} /></div>
                                                    </div>
                                                    <div className="col-auto"><Button variant="primary" disabled={course.status != 'completed'} onClick={() => {
                                                        const certificate = course.certificate;
                                                        if (certificate != null) {
                                                            downloadFromUrl(certificate.fileUrl, certificate.fileName);
                                                        }
                                                    }}>Download Certificate</Button></div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default withRemount(CoursePage);


const CourseDetailsDiv = (props) => {
    const course = props.course;

    return (
        <div className="row">
            <div className="col-6 col-sm-4 py-2">
                <div className="mb-0 small font-weight-bold">Course Duration</div>
                {course.duration != null ? <div>{moment.duration(course.duration, "minutes").humanize()}</div> : <div>Not yet</div>}
            </div>
            <div className="col-6 col-sm-4 py-2">
                <div className="mb-0 small font-weight-bold">Course Certificated</div>
                {course.certificated != null ? <div>{prettifyString(course.certificated.toString())}</div> : <div>Not yet</div>}
            </div>

            <div className="col-6 col-sm-4 py-2">
                <div className="mb-0 small font-weight-bold">Current Progress</div>
                <div>{(Math.round((((course.progress || 0) * 100) + Number.EPSILON) * 100) / 100)}%</div>
            </div>
            <div className="col-6 col-sm-4 py-2">
                <div className="mb-0 small font-weight-bold">Current Score</div>
                <div>{course.correctCount} of {course.contentsCount}</div>
            </div>
            <div className="col-6 col-sm-4 py-2">
                <div className="mb-0 small font-weight-bold">Current Performance</div>
                {course.performance != null ? <div>{course.performance}</div> : <div>Not yet</div>}
            </div>
            <div className="col-6 col-sm-4 py-2">
                <div className="mb-0 small font-weight-bold">Current Status</div>
                {course.status != null ? <div>{prettifyString(course.status)}</div> : <div>Not yet</div>}
            </div>
            <div className="col-6 col-sm-4 py-2">
                <div className="mb-0 small font-weight-bold">Created Date</div>
                {course.createdOn != null ? <div>{moment(course.createdOn).format('l')}</div> : <div>Not yet</div>}
            </div>
            <div className="col-6 col-sm-4 py-2">
                <div className="mb-0 small font-weight-bold">Started Date</div>
                {course.startedOn != null ? <div>{moment(course.startedOn).format('l')}</div> : <div>Not yet</div>}
            </div>
            <div className="col-6 col-sm-4 py-2">
                <div className="mb-0 small font-weight-bold">Completed Date</div>
                {course.completedOn != null ? <div>{moment(course.completedOn).format('l')}</div> : <div>Not yet</div>}
            </div>
        </div>
    );
};

export { CourseDetailsDiv }