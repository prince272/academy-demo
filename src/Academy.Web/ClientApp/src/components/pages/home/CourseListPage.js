import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ApplicationPaths } from '../../../api-authorization/ApiAuthorizationConstants';

import { prettifyNumber, withRemount } from '../../../utilities';
import appService from '../../../utilities/appService';

import AppLoader from '../../shared/AppLoader';

import { CircularProgressbarWithChildren as CircularProgressbar, buildStyles as buildCircularProgressbarStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import TruncateMarkup from 'react-truncate-markup';

function CourseListPage(props) {
    const [courses, setCourses] = useState(null);
    const [loading, setLoading] = useState({});
    const loadingProps = { retry: props.remount };

    const appSettings = window.appSettings;
    const themeSettings = window.themeSettings;

    useEffect(() => {
        ((async () => {
            setLoading({});

            const coursesResult = await appService.populateCourses();

            if (!coursesResult.success) {
                setLoading({ status: 'error', message: coursesResult.message });
            }
            else {

                setCourses(coursesResult.data);
                setLoading(null);
            }

        })());
    }, []);

    if (loading != null) {
        return <AppLoader {...loadingProps} {...loading} />
    }

    return (
        <>
            <div className="container container-p-y">
                <div className="d-flex flex-wrap align-items-center justify-content-between my-5">
                    <div className="w-100 text-center"><h1 className="h3 mb-0">What would you like to learn?</h1></div>
                </div>
                <div className="d-flex flex-wrap justify-content-center text-center">
                    {courses.map((course, courseIndex) => {
                        return (
                            <div key={course.id} className="m-2" style={{ width: "190px", height: "230px" }}>
                                <Card className="h-100">
                                    <Card.Body className="d-flex flex-column align-items-center p-0">
                                        <div className="d-flex flex-wrap align-items-center justify-content-end py-2 px-2 w-100"><div className="badge badge-primary">{course.fee > 0 ? <span>{appSettings.culture.currencySymbol}{course.fee}</span> : <span>Free</span>}</div></div>
                                        <div className="mb-3" style={{ width: "84px", height: "84px" }}>
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
                                        <Link className="h5 mb-1 mx-2 stretched-link text-reset" to={`/learn/${course.id}`}><TruncateMarkup lines={1}><div>{course.title}</div></TruncateMarkup></Link>
                                       
                                        <div className="d-inline-flex small mb-1">
                                            <div className="mx-1"><i className="fas fa-graduation-cap mr-1"></i>{prettifyNumber(course.learnersCount)} {course.learnersCount == 1 ? 'learner' : 'learners'}</div>
                                        </div>
                                        <div className="my-1"><Button variant="primary" size="sm">Enroll</Button></div>
                                    </Card.Body>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

export default withRemount(CourseListPage);