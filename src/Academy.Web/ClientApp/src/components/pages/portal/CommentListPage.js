import * as moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Button, Card, Dropdown, Form, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import TextareaAutosize from 'react-textarea-autosize';
import { prettifyString, Remount, withRemount } from '../../../utilities';
import appService from '../../../utilities/appService';
import AppLoader from '../../shared/AppLoader';


const CommentListPage = (props) => {
    const authorization = props.authorization;
    const [commentPage, setCommentPage] = useState(null);

    return (
        <>
            <div className="container container-p-x pt-0 pb-3">
                <div className="d-flex flex-wrap align-items-center justify-content-between py-3 bg-body position-sticky" style={{ top: "58px", zIndex: 1 }}>
                    <h1 className="h4 mb-0">Comments ({commentPage != null ? commentPage.totalItems : 0})</h1>
                    <div>
                        
                    </div>
                </div>

                <div className="row justify-content-center">
                    <div className="col-12 col-md-8">
                        <CommentList currentUser={authorization.user} onSetCommentPage={(value) => { setCommentPage(value); }} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default CommentListPage;

const CommentListItem = (props) => {
    const { commentPage, setCommentPage, parentCommentPage, setParentCommentPage } = props;
    const comment = props.comment;
    const currentUser = props.currentUser;

    const [action, setAction] = useState(props.action);
    const [showReplies, setShowReplies] = useState(null);
    const [loading, setLoading] = useState(false);

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

    const handleSubmit = async (values) => {
        setLoading(true);

        let result = action == 'add' ? await appService.addComment(values) :
            action == 'edit' ? await appService.editComment(values) :
                action == 'delete' ? await appService.deleteComment(values) : null;

        setLoading(false);

        if (!result.success) {

            toast.error(result.message);
            form.setErrors(result.errors);
        }
        else {
            toast.success(`Comment ${(() => {
                switch (action) {
                    case 'add': return 'added';
                    case 'edit': return 'updated';
                    case 'delete': return 'deleted';
                }
            })()}.`);

            const ADD_COMMENT = (comment) => {
                setParentCommentPage && setParentCommentPage({
                    ...parentCommentPage,
                    items: parentCommentPage.items.map(x => x.id != comment.parentId ? x : { ...x, repliesCount: x.repliesCount + 1 }),
                    totalItems: parentCommentPage.totalItems + 1,
                });
                setCommentPage({ ...commentPage, items: [comment, ...commentPage.items], totalItems: commentPage.totalItems + 1 });
            };

            const EDIT_COMMENT = (comment) => {
                setCommentPage({ ...commentPage, items: commentPage.items.map(x => x.id != comment.id ? x : comment) });
            };

            const DELETE_COMMENT = (comment) => {
                setParentCommentPage && setParentCommentPage({
                    ...parentCommentPage,
                    items: parentCommentPage.items.map(x => x.id != comment.parentId ? x : { ...x, repliesCount: x.repliesCount - 1 }),
                    totalItems: parentCommentPage.totalItems - 1,
                });
                setCommentPage({ ...commentPage, items: commentPage.items.filter(x => x.id != comment.id), totalItems: commentPage.totalItems - 1 });
            };

            if (action == 'add') ADD_COMMENT(result.data);
            else if (action == 'edit') EDIT_COMMENT(result.data);
            else if (action == 'delete') DELETE_COMMENT(result.data);

            if (action == 'edit') setAction('view');

            form.reset({});
        }
    };

    useEffect(() => {
        form.setValues(comment);

        return () => {

        };
    }, [, action]);

    return (<div className="d-flex pb-0">
        <div>
            <Link className="d-inline-flex align-items-center align-middle" to={`/learners/${comment.user.id}`}>
                <div className="d-flex justify-content-center align-items-center theme-bg-dark rounded-circle" style={{ width: "38px", height: "38px" }}>
                    {comment.user.avatar != null ? <img src={comment.user.avatar.fileUrl} className="w-100 h-100 img-fluid rounded-circle" /> : <i className="fad fa-user theme-text-white"></i>}
                </div>
            </Link>
        </div>
        <div className="flex-grow-1">
            <Card className="pl-3 pr-1 pt-1 ml-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1" style={{ height: "38px" }}>
                    <div className="h6 mb-0"><Link className="text-reset" to={`/learners/${comment.user.id}`}>{comment.user.preferredName}</Link></div>
                    {(action == 'edit' || action == 'view') && (
                        <div>
                            <OverlayTrigger overlay={(overlayProps) => <Tooltip {...overlayProps}>Options</Tooltip>}>
                                <Dropdown className="dropdown-toggle-hide-arrow" drop="left">
                                    <Dropdown.Toggle variant="default" className="icon-btn borderless">
                                        <i className={`far fa-ellipsis-v`}></i>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        {(currentUser != null && (comment.user.id == currentUser.id || currentUser.roles.includes('admin'))) && <Dropdown.Item onClick={() => { setAction('edit'); }}>Edit</Dropdown.Item>}
                                        {(currentUser != null && (comment.user.id == currentUser.id || currentUser.roles.includes('admin'))) && <Dropdown.Item onClick={() => { setAction('delete'); }}>Delete</Dropdown.Item>}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </OverlayTrigger>
                        </div>
                    )}
                </div>
                <div className="pr-2">
                    {(action == 'add' || action == 'edit' || action == 'delete') &&
                        <Form onSubmit={form.handleSubmit(handleSubmit)}>
                            <input name={`id`} type="hidden" ref={form.register()} />
                            <input name={`entityName`} type="hidden" ref={form.register()} />
                            <input name={`entityId`} type="hidden" ref={form.register()} />
                            <input name={`parentId`} type="hidden" ref={form.register()} />

                            {action != 'delete' &&
                                <Form.Group>
                                    <Form.Control as={TextareaAutosize} placeholder={`${!comment.parentId ? 'Write a comment...' : 'Write a reply...'}`} ref={form.register()} name="message" className={`mr-2 p-0 border-0 bg-transparent ${form.errors.message ? 'is-invalid' : ''}`} style={{ resize: "none" }} type="text" />
                                </Form.Group>
                            }

                            {action == 'delete' && <Form.Group>Are you sure you want to delete this comment?</Form.Group>}

                            <Form.Group className="d-flex">
                                <div className="mx-auto"></div>
                                {action != 'add' && <Button variant="default" className="ml-2" onClick={() => { setAction('view'); }}>Cancel</Button>}
                                <Button variant={action == 'delete' ? 'danger' : 'primary'} className="ml-2" onClick={form.handleSubmit(handleSubmit)}>{prettifyString(action)} {!comment.parentId ? 'Comment' : 'Reply'} {loading && <Spinner animation="border" size="sm" className="text-white" as="span" />}</Button>
                            </Form.Group>
                        </Form>
                    }
                    {action == 'view' && <Form.Group className="text-break mb-2">{comment.message}</Form.Group>}

                    {action != 'add' &&
                        <div className="d-flex mb-2">
                            {!comment.parentId && <div><Button variant="link" className="p-0" onClick={() => { setShowReplies(!showReplies) }}>{comment.repliesCount != 0 ? <>{showReplies ? 'Hide' : 'View'} {comment.repliesCount} {comment.repliesCount == 1 ? 'reply' : 'replies'}</> : "Add Reply"}</Button></div>}
                            <div className="small ml-auto"><Remount delay={1000}>{() => moment(comment.createdOn).fromNow()}</Remount></div>
                        </div>
                    }

                </div>
            </Card>
            {!comment.parentId && showReplies != null && <div className={`${!showReplies ? 'd-none' : ''}`}><CommentList currentUser={currentUser} parentId={comment.id} entityName={comment.entityName} entityId={comment.entityId} setParentCommentPage={setCommentPage} parentCommentPage={commentPage} /></div>}
        </div>
    </div>);
};

const CommentList = withRemount((props) => {
    const entityName = props.entityName;
    const entityId = props.entityId;
    const parentId = props.parentId;
    const currentUser = props.currentUser;

    const [loading, setLoading] = useState({});
    const loadingProps = { retry: props.remount };
    const [commentPage, setCommentPage] = useState(null);
    const { parentCommentPage, setParentCommentPage } = props;

    useEffect(() => {
        ((async () => {
            await fetchCommentPage();
        })());

        return () => {

        };
    }, []);

    useEffect(() => { props.onSetCommentPage && props.onSetCommentPage(commentPage); }, [commentPage]);

    const fetchCommentPage = async () => {
        const result = await appService.getComments({ entityName, entityId, parentId, pageNumber: (commentPage?.pageNumber || 0) + 1 });

        if (!result.success) {
            setLoading({ status: 'error', message: result.message });
        }
        else {
            setCommentPage({
                ...commentPage,
                ...result.data,
                items: (commentPage?.items || []).concat(result.data.items),
            });
            setLoading(null);
        }
    }

    if (loading != null) {
        return <AppLoader {...loadingProps} {...loading} />
    }

    return (
        <div className="d-flex flex-column h-100">
            {entityName && entityId && (
                <CommentListItem action={'add'} comment={{
                    user: currentUser,
                    id: 0,
                    parentId,
                    entityName,
                    entityId
                }} {...{ commentPage, setCommentPage, parentCommentPage, setParentCommentPage, currentUser }} />
            )}
            {commentPage.items.map((comment, commentIndex) => (
                <CommentListItem key={comment.id} action={'view'} {...{ commentPage, setCommentPage, parentCommentPage, setParentCommentPage, comment, commentIndex, currentUser }} />
            ))}
            {commentPage.hasNextPage && <div className="text-center"><Button className="mt-1 mb-3" variant="link"
                onClick={async () => {
                    await fetchCommentPage();
                }}>Load more...</Button></div>}
        </div>
    );
});

export { CommentList };
