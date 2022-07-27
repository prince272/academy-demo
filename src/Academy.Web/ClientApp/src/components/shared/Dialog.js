import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

export const DialogContext = createContext(null);

export function DialogProvider({ children, ...providerOptions }) {
    const [showOptions, setShowOptions] = useState({});
    const [hidden, setHidden] = useState(true);
    const hiddenRef = useRef(hidden);
    const previousHiddenRef = useRef(hidden);
    const resolveDoneRef = useRef(null);
    const resolveHiddenRef = useRef(null);
    const doneResultRef = useRef();

    const mergedOptions = {
        ...providerOptions,
        ...showOptions,
    };

    function resolveDone(result) {
        if (resolveDoneRef.current) {
            resolveDoneRef.current(result);
            resolveDoneRef.current = null;
            doneResultRef.current = result;
        }
    }

    function resolveHidden() {
        if (resolveHiddenRef.current) {
            resolveHiddenRef.current(doneResultRef.current);
            resolveHiddenRef.current = null;
            doneResultRef.current = undefined;
        }
    }

    useEffect(() => {
        hiddenRef.current = hidden;
        const previousHidden = previousHiddenRef.current;
        previousHiddenRef.current = hidden;
        if (previousHidden === false && hidden === true) {
            resolveHidden();
        }
    }, [hidden]);

    const dialog = useMemo(() => {
        function buildMethod(methodOptions, failValue, okValue) {
            return function (body, userOptions) {
                setHidden(false);

                setShowOptions({
                    ...methodOptions,
                    ...userOptions,
                    visible: true,
                    body,
                    onCancel() {
                        setShowOptions({ ...showOptions, visible: false });
                        resolveDone(failValue);
                    },
                    onConfirm(result) {
                        setShowOptions({ ...showOptions, visible: false });
                        resolveDone(okValue === undefined ? result : okValue);
                    }
                });

                const donePromise = new Promise(resolve => {
                    resolveDoneRef.current = resolve;
                });
                donePromise.done = donePromise;
                donePromise.hidden = new Promise(resolve => {
                    resolveHiddenRef.current = resolve;
                });

                return donePromise;
            };
        }

        return {
            alert: buildMethod(
                {
                    input: false,
                    cancelButton: false,
                    confirmButton: true
                },
                false,
                true
            ),

            confirm: buildMethod(
                {
                    input: false,
                    cancelButton: true,
                    confirmButton: true
                },
                false,
                true
            ),

            prompt: buildMethod(
                {
                    input: true,
                    cancelButton: true,
                    confirmButton: true
                },
                null,
                undefined
            ),

            destory: () => {
                setShowOptions({});
            },
        };
    }, []);


    dialog.update = (options) => {
        setShowOptions({ ...showOptions, ...options });
    }

    return (
        <DialogContext.Provider value={dialog}>
            {children}
            <DialogUI {...mergedOptions} />
        </DialogContext.Provider>
    );
}

export const DialogConsumer = DialogContext.Consumer;

export function useDialog() {
  return useContext(DialogContext);
}

export function Dialog({ children, ...options }) {
  return (
    <DialogProvider {...options}>
      <DialogConsumer>{children}</DialogConsumer>
    </DialogProvider>
  );
}

export function DialogUI({
    visible, // boolean
    showHeader = true,
    showFooter = true,
    centered = true,
    slided = false,
    scrollable = true,
    size,
    fullscreen = 'sm',
    title, // string?
    body, // jsx?
    bodyProps,
    cancelButton, // boolean?
    cancelButtonProps, // object?
    confirmButton, // boolean?
    confirmButtonProps, // object?
    onConfirm, // (inputValue) => void
    onCancel, // () => void
}) {

    const showBody = !!body;

    function handleConfirm() {
        onConfirm();
    }

    function handleCancel() {
        onCancel();
    }

    function getFullScreenClassName() {
        if (fullscreen) {

            if (typeof fullscreen === 'string')
                return `modal-fullscreen-${fullscreen}`;
            else
                return 'modal-fullscreen';
        }
        else {
            return '';
        }
    }

    return (
        <Modal className={`${slided ? "modal-slide" : ""}`} dialogClassName={`${getFullScreenClassName()}`} show={visible} animation={false} backdrop="static" centered={centered} size={size} scrollable={scrollable} onHide={handleCancel}>
            {showHeader && (
                <div className="d-flex justify-content-between align-items-center p-3">
                    <h4 className="mb-0">{title}</h4>
                    <Button type="button" variant="default" className="icon-btn" onClick={() => handleCancel()}><i className="far fa-times"></i></Button>
                </div>
            )}
            {showBody && (
                <Modal.Body className="px-3 pt-0" {...bodyProps}>
                    {!!body && body}
                </Modal.Body>
            )}
            {showFooter && (
                <Modal.Footer>
                    {cancelButton && (
                        <Button
                            variant="default"
                            children="Cancel"
                            {...cancelButtonProps}
                            onClick={handleCancel}
                        />
                    )}
                    {confirmButton && (
                        <Button
                            variant="primary"
                            children="Confirm"
                            {...confirmButtonProps}
                            onClick={handleConfirm}
                        />
                    )}
                </Modal.Footer>
            )}
        </Modal>
    );
}