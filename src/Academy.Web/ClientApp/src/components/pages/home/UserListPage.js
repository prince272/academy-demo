import * as moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import { buildStyles as buildCircularProgressbarStyles, CircularProgressbarWithChildren as CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { prettifyNumber, withRemount } from '../../../utilities';
import appService from '../../../utilities/appService';
import AppLoader from '../../shared/AppLoader';

const UserListPage = (props) => {
    const authorization = props.authorization;
    const [userPage, setUserPage] = useState(null);

    return (
        <>
            <div className="container container-p-x pt-0 pb-3">
                <div className="d-flex flex-wrap align-items-center justify-content-between py-3 bg-body position-sticky" style={{ top: "58px", zIndex: 1 }}>
                    <h1 className="h4 mb-0">Leaners ({userPage != null ? userPage.totalItems : 0})</h1>
                    <div>
                        <Button as={Link} to="/learn" type="button" variant="primary">Start Learning</Button>
                    </div>
                </div>

                <div className="row justify-content-center">
                    <div className="col-12 col-md-8">
                        <UserList currentUser={authorization.user} onSetUserPage={(value) => { setUserPage(value); }} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserListPage;

const UserListItem = (props) => {
    const [user, setUser] = useState(props.user);
    const [action, setAction] = useState(props.action);
    const [loading, setLoading] = useState(false);
    const currentUser = props.currentUser;
    const themeSettings = window.themeSettings;

    const form = {
        ...useForm(),
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

    useEffect(() => {

        return () => {

        };
    }, [, action]);

    return (<div className="d-flex pb-0">
        <div>
            <div className="mb-2" style={{ width: "57px", height: "57px" }}>
                <CircularProgressbar value={(Math.round((((user.progress || 0) * 100) + Number.EPSILON) * 100) / 100)} strokeWidth={3}
                    styles={buildCircularProgressbarStyles({
                        textColor: themeSettings.settings.theme.colors.primary,
                        pathColor: themeSettings.settings.theme.colors.primary,
                        trailColor: themeSettings.settings.theme.colors.light,
                        strokeLinecap: "butt",
                    })}>
                    <div className="d-flex justify-content-center align-items-center rounded-circle" style={{ width: "50px", height: "50px" }}>
                        {user.avatar != null ? <img src={user.avatar.fileUrl} className="w-100 h-100 img-fluid rounded-circle" /> : <i className="fad fa-user text-large text-theme-dark"></i>}
                    </div>
                </CircularProgressbar>
            </div>
        </div>
        <div className="flex-grow-1">
            <Card className="ml-3 mb-3">
                <Card.Body className="px-2 pt-2 pb-0 d-flex justify-content-between">
                    <div className="d-flex flex-column w-100">
                        <div className="d-flex justify-content-between">
                            <div className="mr-2">
                                <div><div className="h5 mb-0"><Link className="text-reset" to={`/learners/${user.id}`}>{user.preferredName}</Link></div></div>
                                <div className="mb-1"><time dateTime={user.createdOn} className="text-muted small">{moment(user.createdOn).format('Do MMMM YYYY')}</time></div>
                            </div>
                            <div>
                                {(currentUser && currentUser.id == user.id) && <div><Button variant="default" as={Link} to="/account#edit-profile">Edit Profile</Button></div>}
                                {(currentUser && currentUser.id != user.id) && <div><Button variant={`${user.following ? 'primary' : 'default'}`} disabled={user.loading} onClick={async () => {
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

                        <div className="mb-1">
                            <i className="fas fa-star text-primary"></i> {user.xp} XP · <i className="fas fa-sort-circle-up text-primary"></i>
                            <span> Level {user.level}</span>
                        </div>
                        <div className="d-inline-flex mb-2">
                            <div className="mr-2"><span className="font-weight-semibold">{prettifyNumber(user.followersCount)}</span> {user.followersCount != 1 ? 'followers' : 'follower'}</div>
                            <div><span className="font-weight-semibold">{prettifyNumber(user.followingCount)}</span> following</div>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </div>
    </div>);
};

const UserList = withRemount((props) => {
    const courseIds = props.courseIds;
    const currentUser = props.currentUser;
    const [loading, setLoading] = useState({});
    const loadingProps = { retry: props.remount };
    const [userPage, setUserPage] = useState(null);

    useEffect(() => {
        ((async () => {
            await fetchUserPage();
        })());

        return () => {

        };
    }, []);

    useEffect(() => { props.onSetUserPage && props.onSetUserPage(userPage); }, [userPage]);

    const fetchUserPage = async () => {
        const result = await appService.getUsers({ pageNumber: ((userPage?.pageNumber || 0) + 1), courseIds });

        if (!result.success) {
            setLoading({ status: 'error', message: result.message });
        }
        else {
            setUserPage({
                ...userPage,
                ...result.data,
                items: (userPage?.items || []).concat(result.data.items),
            });
            setLoading(null);
        }
    }

    if (loading != null) {
        return <AppLoader {...loadingProps} {...loading} />
    }

    return (
        <div className="d-flex flex-column h-100">
            {userPage.items.map((user, userIndex) => (
                <UserListItem key={user.id} action={'view'} {...{ currentUser, userPage, setUserPage, user, userIndex }} />
            ))}
            {userPage.hasNextPage && <div className="text-center"><Button className="mt-1 mb-3" variant="link"
                onClick={async () => {
                    await fetchUserPage();
                }}>Load more...</Button></div>}
            {(userPage.items.length == 0) &&
                <div className="d-flex justify-content-center h-100 text-center">
                    <div className="d-flex flex-column align-items-center justify-content-center pt-5 pb-5 mb-5">
                        <div className="mb-3"><i className="fad fa-users" style={{ fontSize: "64px" }}></i></div>
                        <h5>No learners</h5>
                    </div>
                </div>
            }
        </div>
    );
});

export { UserList };
