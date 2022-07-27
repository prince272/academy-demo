import React, { useState } from 'react';
import { BrowserRouter, Switch, Route, Redirect, Prompt, useHistory, matchPath } from 'react-router-dom';
import _ from 'lodash';

import loadable from '@loadable/component';
import pMinDelay from 'p-min-delay';

import LayoutPage from '../../components/pages/LayoutPage';

import { ApplicationPaths, getAuthenticationUrl, QueryParameterNames } from '../../api-authorization/ApiAuthorizationConstants';
import ApiAuthorizationRoutes from '../../api-authorization/ApiAuthorizationRoutes';
import authService from '../../api-authorization/AuthorizeService';

import AppLoader from './AppLoader';
import { generateUUID, useSessionState } from '../../utilities';
import { useEffect } from 'react';
import appService from '../../utilities/appService';

import NotFoundPage from '../pages/home/NotFoundPage';
import { DialogConsumer, DialogProvider } from './Dialog';

const basename = document.getElementsByTagName('base')[0].getAttribute('href');

function getRoutes() {

    const loadPageContent = (cb) => loadable(() => pMinDelay(cb(), 0), { fallback: <AppLoader /> });
    const loadModalContent = loadable;

    const routes = [
        {
            path: '/account/code/send',
            contentPromise: import('../../components/modals/AccountActionModal'),
            contentType: 'modal',
            authenticate: false,
        },
        {
            path: '/account/password/change',
            contentPromise: import('../../components/modals/AccountChangePasswordModal'),
            contentType: 'modal',
            authenticate: true,
        },
        {
            path: '/account',
            contentPromise: import('../../components/modals/AccountModal'),
            contentType: 'modal',
            authenticate: true,
        },
        {
            path: ApplicationPaths.IdentityLoginPath,
            contentPromise: import('../../components/modals/LoginModal'),
            contentType: 'modal',
            authenticate: false,
        },
        {
            path: ApplicationPaths.IdentityRegisterPath,
            contentPromise: import('../../components/modals/RegisterModal'),
            contentType: 'modal',
            authenticate: false,
        },
        {
            path: '/comments',
            contentPromise: import('../../components/pages/portal/CommentListPage'),
            contentType: 'page',
            layout: LayoutPage,
            authenticate: true,
            roles: ['admin']
        },
        {
            path: '/users',
            contentPromise: import('../../components/pages/home/UserListPage'),
            contentType: 'page',
            layout: LayoutPage,
            authenticate: true,
            roles: ['admin']
        },
        {
            path: '/users/:userId',
            contentPromise: import('../../components/pages/home/UserPage'),
            contentType: 'page',
            layout: LayoutPage,
            authenticate: true,
            roles: ['admin']
        },
        {
            path: '/courses',
            contentPromise: import('../../components/pages/portal/CourseListPage'),
            contentType: 'page',
            layout: LayoutPage,
            authenticate: true,
            roles: ['admin']
        },
        {
            path: ['/courses/:action(add)', '/courses/:courseId/:action(edit|delete)'],
            contentPromise: import('../../components/modals/CourseModal'),
            contentType: 'modal',
            authenticate: true,
            roles: ['admin']
        },
        {
            path: '/courses/import',
            contentPromise: import('../../components/modals/CourseImportModal'),
            contentType: 'modal',
            authenticate: true,
            roles: ['admin']
        },
        {
            path: '/courses/:courseId',
            contentPromise: import('../../components/pages/portal/CoursePage'),
            contentType: 'page',
            layout: LayoutPage,
            authenticate: true,
            roles: ['admin']
        },
        {
            path: ['/courses/:courseId/sections/:action(add)', '/courses/:courseId/sections/:sectionId/:action(edit|delete)'],
            contentPromise: import('../../components/modals/SectionModal'),
            contentType: 'modal',
            authenticate: true,
            roles: ['admin']
        },
        {
            path: ['/courses/:courseId/sections/:sectionId/lessons/:action(add)', '/courses/:courseId/sections/:sectionId/lessons/:lessonId/:action(edit|delete)'],
            contentPromise: import('../../components/modals/LessonModal'),
            contentType: 'modal',
            authenticate: true,
            roles: ['admin']
        },
        {
            path: '/courses/:courseId/sections/:sectionId/lessons/:lessonId',
            contentPromise: import('../../components/pages/portal/LessonPage'),
            contentType: 'page',
            layout: LayoutPage,
            authenticate: true,
            roles: ['admin']
        },
        {
            path: ['/courses/:courseId/sections/:sectionId/lessons/:lessonId/contents/:action(add)', '/courses/:courseId/sections/:sectionId/lessons/:lessonId/contents/:contentId/:action(edit|delete)'],
            contentPromise: import('../../components/modals/ContentModal'),
            contentType: 'modal',
            authenticate: true,
            roles: ['admin']
        },
        {

            path: '/about',
            contentPromise: import('../../components/pages/home/AboutPage'),
            contentType: 'page',
            layout: LayoutPage,
            authenticate: false,
        },
        {

            path: '/learn/pay',
            contentPromise: import('../../components/modals/CoursePaymentModal'),
            contentType: 'modal',
            authenticate: true,
        },
        {

            path: ['/learn/:courseId', '/learn/:courseId/:action(complete|payment)'],
            contentPromise: import('../../components/pages/home/CoursePage'),
            contentType: 'page',
            layout: LayoutPage,
            authenticate: false,
        },
        {

            path: '/learn/:courseId/:sectionId/:lessonId/:contentId',
            contentPromise: import('../../components/pages/home/ContentPage'),
            contentType: 'page',
            layout: null,
            authenticate: true,
        },
        {

            path: '/learners',
            contentPromise: import('../pages/home/UserListPage'),
            contentType: 'page',
            layout: LayoutPage,
            authenticate: false,
        },
        {

            path: '/learners/:userId',
            contentPromise: import('../../components/pages/home/UserPage'),
            contentType: 'page',
            layout: LayoutPage,
            authenticate: false,
        },
        {

            path: '/learn',
            contentPromise: import('../../components/pages/home/CourseListPage'),
            contentType: 'page',
            layout: LayoutPage,
            authenticate: false,
        },
        {

            path: '/',
            contentPromise: import('../../components/pages/home/IndexPage'),
            contentType: 'page',
            layout: LayoutPage,
            authenticate: false,
        },
    ];

    routes.forEach(route => {
        route.exact = typeof route.exact === 'undefined' ? true : route.exact;
        route.roles = typeof route.roles === 'undefined' ? [] : route.roles;

        if (route.contentPromise != null) {
            if (route.contentType == 'page')
                route.content = loadPageContent(() => route.contentPromise);

            else if (route.contentType == 'modal')
                route.content = loadModalContent(() => route.contentPromise);
        }

        route.key = generateUUID();

        return route;
    });

    return routes;
};
const routes = getRoutes();

const PageRoutes = (props) => {
    const authorization = props.authorization;
    const history = useHistory();
    const [loginRedirect, setLoginRedirect] = useSessionState(null, 'loginRedirect');
    const pageRoutes = routes.filter(route => route.contentType == 'page');

    return (
        <>
            <Switch>
                {pageRoutes.map((route, routeIndex) => {

                    return (
                        <Route
                            path={route.path}
                            key={route.key}
                            exact={route.exact}
                            render={(routeProps) => {
                                if (!authorization.initialized) {
                                    return <AppLoader />;
                                }
                                else if (!authorization.user && route.authenticate) {
                                    setLoginRedirect(history.location);
                                    history.replace(ApplicationPaths.IdentityLoginPath);
                                    return <Redirect to={`/`} replace={true} />;
                                }
                                else if (authorization.user && route.authenticate && (route.roles.length != 0 && !route.roles.some(r => authorization.user.roles.includes(r)))) {
                                    return <AppLoader status="error" message="You don't have access to the resource." backoff={() => { history.goBack(); }} />
                                }
                                else {
                                    if (route.layout != null) {
                                        return (
                                            <route.layout {...props} {...routeProps}>
                                                <route.content {...props} {...routeProps} key={routeProps.match.url} />
                                            </route.layout>
                                        );
                                    }
                                    else {
                                        return (<route.content {...props} {...routeProps} key={routeProps.match.url} />);
                                    }
                                }
                            }}>
                        </Route>
                    );
                })}
                <Route path={ApplicationPaths.ApiAuthorizationPrefix} component={ApiAuthorizationRoutes} />
            </Switch>
        </>
    );
};

const ModalRoutes = (props) => {
    const dialog = props.dialog;
    const history = useHistory();
    const authorization = props.authorization;
    const [route, setRoute] = useState(null);
    const [loginRedirect, setLoginRedirect] = useSessionState(null, 'loginRedirect');


    const getCurrentRoute = (location) => {
        const currentRoute = routes.map(currentRoute => {
            const match = matchPath(location.pathname,
                {
                    path: currentRoute.path,
                    exact: currentRoute.exact,
                    strict: currentRoute.strict
                });

            return {
                ...currentRoute,
                routeProps: match != null ? {
                    match,
                    location,
                    history,
                    key: generateUUID(),
                } : null
            };
        }).filter(currentRoute => currentRoute.routeProps != null)[0];
        return currentRoute;
    };

    const populateRoute = (location, prompted) => {
        const currentRoute = getCurrentRoute(location);

        if (currentRoute != null)
        {
            if (currentRoute.contentType == 'modal') {
                setRoute(currentRoute);

                if (!prompted) {
                    history.replace('/');
                }

                return true;
            }
            else if (authorization.initialized && !authorization.user && currentRoute.authenticate) {
                setLoginRedirect(location);
                history.replace(ApplicationPaths.IdentityRegisterPath);
                return true;
            }
        }

        dialog.destory();

        return false;
    }

    useEffect(() => {
        populateRoute({ ...history.location }, false);
    }, []);

    const render = () => {

        if (route == null)
            return <></>;

        if (!authorization.initialized)
            return <></>;

        if (route.authenticate && !authorization.user)
            return <></>;

        return (<route.content {...props} {...route.routeProps} />);
    }

    return (
        <>
            <Prompt when={true} message={(location) => {

                return !populateRoute({ ...location }, true);
            }} />

            {render()}
        </>
    );
};

const AppRouter = (props) => {
    const [authorization, setAuthorization] = useState({ initialized: false });

    const populateAuthorization = async () => {
        const authenticated = (await authService.isAuthenticated());
        const user = authenticated ? (await appService.getCurrentUser())?.data : null;

        setAuthorization({ initialized: true, user: user });
    };

    useEffect(() => {
        populateAuthorization();

        const authSubscription = authService.subscribe(populateAuthorization);
        return () => authService.unsubscribe(authSubscription);
    }, []);

    return (
        <BrowserRouter basename={basename}>
            <DialogProvider>
                <DialogConsumer>
                    {dialog => {
                        return (
                            <>
                                <PageRoutes {...props} {...{ dialog, authorization, populateAuthorization }}  />
                                <ModalRoutes  {...props} {...{ dialog, authorization, populateAuthorization }} />
                            </>)
                    }}
                </DialogConsumer>
            </DialogProvider>
        </BrowserRouter>
    );
};

export default AppRouter;