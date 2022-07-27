import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { Button, Card, ProgressBar, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import { prettifyString, prettifyNumber, withRemount, downloadFromUrl } from '../../../utilities';
import appService from '../../../utilities/appService';

import AppLoader from '../../shared/AppLoader';

import { CircularProgressbarWithChildren as CircularProgressbar, buildStyles as buildCircularProgressbarStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import TruncateMarkup from 'react-truncate-markup';

import * as moment from 'moment';

const UserPage = (props) => {
    const userId = props.match.params.userId;
    const authorization = props.authorization;

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState({});
    const loadingProps = { retry: props.remount };

    const dialog = props.dialog;

    const appSettings = window.appSettings;
    const themeSettings = window.themeSettings;

    const MAX_COURSE_COUNT = 4;
    const MAX_CERTIFICATE_COUNT = 4;

    useEffect(() => {
        ((async () => {
            setLoading({});

            const userResult = await appService.getUser(userId);

            if (!userResult.success) {
                setLoading({ status: 'error', message: userResult.message });
            }
            else {
                setUser(userResult.data);
                setLoading(null);
            }
        })());
    }, []);

    if (loading != null) {
        return <AppLoader {...loadingProps} {...loading} />
    }


    const CoursesProgressContent = (showAll) => {
        const courses = showAll ? user.courses : user.courses.slice(0, MAX_COURSE_COUNT);
        return (
            <>
                {courses.length == 0 && (
                    <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="h4 mb-0">No courses</div>
                    </div>
                )}
                {courses.map((course, courseIndex) => {
                    return (
                        <div key={course.id} className="m-2">
                            <Card className="shadow-none border-hover border-primary bg-body cursor-default p-0">
                                <Card.Body className="d-flex align-items-center p-0">
                                    <div className="d-flex justify-content-center align-items-center theme-bg-dark rounded-circle m-2" style={{ width: "48px", height: "48px" }}>
                                        {course.image != null ? <img src={course.image.fileUrl} className="w-100 h-100 img-fluid rounded-circle" /> : <i className="fad fa-book fa-2x theme-text-white"></i>}
                                    </div>
                                    <div className="my-2 mr-2 flex-grow-1 mb-2">
                                        <div className="d-flex justify-content-between mb-2">
                                            <div className="d-flex align-items-center"><div className="mr-2"><TruncateMarkup><Link className="h5 mb-0 stretched-link text-reset d-inline-block" to={`/learn/${course.id}`}>{course.title}</Link></TruncateMarkup></div></div>
                                            <div>{(Math.round((((course.progress || 0) * 100) + Number.EPSILON) * 100) / 100)}%</div>
                                        </div>
                                        <div><ProgressBar className="bg-dark" style={{ height: "4px" }} now={(Math.round((((course.progress || 0) * 100) + Number.EPSILON) * 100) / 100)} /></div>
                                    </div>
                                    <div className="mr-3 ml-2"><i className="far fa-play theme-text-dark"></i></div>
                                </Card.Body>
                            </Card>
                        </div>
                    );
                })}
            </>
        );
    };

    const CertificatesContent = (showAll) => {
        const certificates = showAll ? user.certificates : user.certificates.slice(0, MAX_COURSE_COUNT);
        return (
            <>
                {certificates.length == 0 && (
                    <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="h4 mb-0">No certificates</div>
                    </div>
                )}
                {certificates.map((certificate, certificateIndex) => {
                    return (
                        <div key={certificate.id} className="m-2">
                            <Card className="shadow-none border-hover border-primary bg-body cursor-default p-0">
                                <Card.Body className="d-flex align-items-center p-0">
                                    <div className="d-flex justify-content-center align-items-center m-2" style={{ width: "48px", height: "48px" }}>
                                        <i className="fad fa-file-certificate fa-2x text-primary"></i>
                                    </div>
                                    <div className="my-2 mr-2 flex-grow-1 mb-2">
                                        <div className="d-flex justify-content-between mb-2">
                                            <div className="d-flex align-items-center"><div className="mr-2"><TruncateMarkup><div className="h5 mb-0 d-inline-block">{certificate.fileName}</div></TruncateMarkup></div></div>
                                        </div>
                                        <Button variant="primary" size="sm" onClick={() => {
                                            downloadFromUrl(certificate.fileUrl, certificate.fileName);
                                        }}>Download</Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    );
                })}
            </>
        );
    };

    return (
        <div className="container container-p-y">
            <div className="row justify-content-center">
                <div className="col-12 col-md-9">
                    <div className="row justify-content-center text-center justify-content-md-start text-md-left pb-5">
                        <div className="col-12 col-lg-8">
                            <div className="row justify-content-center">
                                <div className="col-auto pb-3">
                                    <div className="mb-2" style={{ width: "132px", height: "132px" }}>
                                        <CircularProgressbar value={(Math.round((((user.progress || 0) * 100) + Number.EPSILON) * 100) / 100)} strokeWidth={3}
                                            styles={buildCircularProgressbarStyles({
                                                textColor: themeSettings.settings.theme.colors.primary,
                                                pathColor: themeSettings.settings.theme.colors.primary,
                                                trailColor: themeSettings.settings.theme.colors.light,
                                                strokeLinecap: "butt",
                                            })}>
                                            <div className="d-flex justify-content-center align-items-center rounded-circle" style={{ width: "120px", height: "120px" }}>
                                                {user.avatar != null ? <img src={user.avatar.fileUrl} className="w-100 h-100 img-fluid rounded-circle" /> : <i className="fad fa-user fa-4x text-theme-dark"></i>}
                                            </div>
                                        </CircularProgressbar>
                                    </div>
                                </div>
                                <div className="col-12 col-md">
                                    <h2 className="mb-0">{user.preferredName}</h2>
                                    <div className="mb-1"><time dateTime={user.createdOn} className="text-muted small">Member since {moment(user.createdOn).format('Do MMMM YYYY')}</time></div>
                                    <div className="mb-2">
                                        <i className="fas fa-star text-primary"></i> {user.xp} XP · <i className="fas fa-sort-circle-up text-primary"></i>
                                        <span> Level {user.level}</span>
                                    </div>
                                    <div className="mb-2 d-inline-flex">
                                        <div className="mr-4"><span className="font-weight-semibold">{prettifyNumber(user.followersCount)}</span> {user.followersCount != 1 ? 'followers' : 'follower'}</div>
                                        <div><span className="font-weight-semibold">{prettifyNumber(user.followingCount)}</span> following</div>
                                    </div>
                                    <div className="d-flex justify-content-center text-center justify-content-md-start">
                                        {(authorization.user && authorization.user.id == user.id) && (<>
                                            <div className="mx-1"><Button variant="outline-primary" as={Link} to="/account#edit-profile">Edit Profile</Button></div>
                                            <div className="mx-1"><Button variant="primary" as={Link} to="/learn">Start Learning <i class="fal fa-arrow-right"></i></Button></div> </>
                                        )}
                                        {(authorization.user && authorization.user.id != user.id) && <div className="mx-1"><Button variant="primary" disabled={user.loading} onClick={async () => {
                                            setUser({ ...user, loading: true });

                                            const result = !user.following ?
                                                await appService.followUser(user.id) :
                                                await appService.unfollowUser(user.id);

                                            if (result.success) {
                                                setUser({
                                                    ...user,
                                                    following: !user.following,
                                                    followersCount: Math.max(0, (!user.following ? (user.followersCount + 1) : (user.followersCount - 1)))
                                                });
                                            }
                                            else {
                                                setUser({ ...user, loading: false });

                                                toast.error(result.message);
                                            }

                                        }}>{user.loading ? <Spinner animation="border" size="sm" as="span" /> : (user.following ? <span>Following</span> : <span>Follow</span>)}</Button></div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        {authorization.user && authorization.user.recentContent &&
                            ((() => {
                                const recentContent = authorization.user.recentContent;
                                return (
                                    <div className="col-12 pb-4">
                                        <div className="h5 mb-2">Here is where you left off</div>
                                        <Card>
                                            <Card.Body className="py-3 d-flex flex-wrap align-items-center justify-content-between">
                                                <div className="m-1">
                                                    <TruncateMarkup><div className="h5 mb-1">{recentContent.courseTitle}</div></TruncateMarkup>
                                                    <TruncateMarkup><div className="small">{recentContent.lessonTitle}</div></TruncateMarkup>
                                                </div>
                                                <div className="m-1">
                                                    <Button as={Link} to={`/learn/${recentContent.courseId}/${recentContent.sectionId}/${recentContent.lessonId}/${recentContent.id}`} variant="primary">Continue</Button>
                                                </div>
                                            </Card.Body>
                                        </Card>

                                    </div>);
                            })())
                        }
                        <div className="col-12 col-lg-6 pb-4">
                            <Card>
                                <Card.Header className="border-bottom-0 px-3 pt-3 pb-2 d-flex justify-content-between">
                                    <div className="h5 mb-0">Progress</div>
                                    <Button variant="link" className="p-0" onClick={() => {
                                        dialog.alert(CoursesProgressContent(true), { title: 'Progress', size: 'sm', showFooter: false, bodyProps: { className: 'p-2' } });
                                    }}>Show All <i className="fal fa-arrow-right"></i></Button>
                                </Card.Header>
                                <Card.Body className="p-1" style={{ height: `${(MAX_COURSE_COUNT * 77)}px` }}>
                                    {CoursesProgressContent(false)}
                                </Card.Body>
                            </Card>
                        </div>
                        <div className="col-12 col-lg-6 pb-4">
                            <Card>
                                <Card.Header className="border-bottom-0 px-3 pt-3 pb-2 d-flex justify-content-between">
                                    <div className="h5 mb-0">Certificates</div>
                                    <Button variant="link" className="p-0" onClick={() => {
                                        dialog.alert(CertificatesContent(true), { title: 'Certificates', size: 'sm', showFooter: false, bodyProps: { className: 'p-2' } });
                                    }}>Show All <i className="fal fa-arrow-right"></i></Button>
                                </Card.Header>
                                <Card.Body className="p-1" style={{ height: `${(MAX_CERTIFICATE_COUNT * 77)}px` }}>
                                    {CertificatesContent(false)}
                                </Card.Body>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default withRemount(UserPage);