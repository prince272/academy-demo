import React from 'react';
import _ from 'lodash';

export function useMounted() {
    const ref = React.useRef(true);
    React.useEffect(() => {
        return () => {
            ref.current = false;
        };
    }, []);
    return React.useCallback(() => ref.current, []);
}

export const EventDispatcher = function () {
    class EventObject {
        constructor(eventName) {
            this.eventName = eventName;
            this.callbacks = [];
        }

        registerCallback(callback) {
            this.callbacks.push(callback);
        }

        unregisterCallback(callback) {
            const index = this.callbacks.indexOf(callback);
            if (index > -1) {
                this.callbacks.splice(index, 1);
            }
        }

        fire(data) {
            const callbacks = this.callbacks.slice(0);
            callbacks.forEach((callback) => {
                callback(data);
            });
        }
    }

    const events = {};

    function trigger(eventName, data) {
        const event = events[eventName];
        if (event) {
            event.fire(data);
        }
    }

    function on(eventName, callback) {
        let event = events[eventName];
        if (!event) {
            event = new EventObject(eventName);
            events[eventName] = event;
        }
        event.registerCallback(callback);
    }

    function off(eventName, callback) {
        const event = events[eventName];
        if (event && event.callbacks.indexOf(callback) > -1) {
            event.unregisterCallback(callback);
            if (event.callbacks.length === 0) {
                delete events[eventName];
            }
        }
    }

    return { trigger, on, off };
}

// How to use callback with useState hook in react [duplicate]
// source: https://stackoverflow.com/questions/54954091/how-to-use-callback-with-usestate-hook-in-react
export function useStateCallback(initialState) {
    const [state, setState] = React.useState(initialState);
    const cbRef = React.useRef(null); // mutable ref to store current callback

    const setStateCallback = React.useCallback((state, cb) => {
        cbRef.current = cb; // store passed callback to ref
        setState(state);
    }, []);

    React.useEffect(() => {
        // cb.current is `null` on initial render, so we only execute cb on state *updates*
        if (cbRef.current) {
            cbRef.current(state);
            cbRef.current = null; // reset callback after execution
        }
    }, [state]);

    return [state, setStateCallback];
}

export function withRemount(Component) {
    return (props) => {
        const [key, setKey] = React.useState(1);
        return (<Component key={key} {...props} remount={() => setKey(key + 1)} />);
    };
}

// useBreakpoint Hook — Get Media Query Breakpoints in React
// source: https://betterprogramming.pub/usebreakpoint-hook-get-media-query-breakpoints-in-react-3f1779b73568
export const useBreakpoint = () => {

    const getDeviceConfig = (width) => {

        if (width < 576) {
            return 'xs';
        }
        else if (width >= 576 && width < 768) {
            return 'sm';
        }
        else if (width >= 768 && width < 992) {
            return 'md';
        }
        else if (width >= 992 && width < 1200) {
            return 'lg';
        }
        else if (width > 1200) {
            return 'xl';
        }
    };

    const [brkPnt, setBrkPnt] = React.useState(() => getDeviceConfig(window.innerWidth));

    React.useEffect(() => {
        const calcInnerWidth = _.throttle(function () {
            setBrkPnt(getDeviceConfig(window.innerWidth))
        }, 200);
        window.addEventListener('resize', calcInnerWidth);
        return () => window.removeEventListener('resize', calcInnerWidth);
    }, []);

    return brkPnt;
}

// Persisting React State in localStorage
// source: https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/
export function useLocalState(defaultValue, key) {
    const storage = window.localStorage;
    const [value, setValue] = React.useState(() => {
        const storageValue = storage.getItem(key);
        return storageValue !== null
            ? JSON.parse(storageValue)
            : defaultValue;
    });
    React.useEffect(() => {
        storage.setItem(key, JSON.stringify(value));
    }, [key, value]);
    return [value, setValue];
}

export function useSessionState(defaultValue, key) {
    const storage = window.sessionStorage;
    const [value, setValue] = React.useState(() => {
        const storageValue = storage.getItem(key);
        return storageValue !== null
            ? JSON.parse(storageValue)
            : defaultValue;
    });
    React.useEffect(() => {
        storage.setItem(key, JSON.stringify(value));
    }, [key, value]);
    return [value, setValue];
}

// Source Code for useTimeout React Hook
// source: https://codezup.com/usetimeout-useinterval-custom-react-hook-implementation/
export const useTimeout = (callback, timer) => {
    const timeoutIdRef = React.useRef()

    React.useEffect(() => {
        timeoutIdRef.current = callback
    }, [callback])

    React.useEffect(() => {
        const fn = () => {
            timeoutIdRef.current()
        }
        if (timer !== null) {
            let timeoutId = setTimeout(fn, timer)
            return () => clearTimeout(timeoutId)
        }
    }, [timer])
};

// Source Code for useInterval React Hook
// source: https://codezup.com/usetimeout-useinterval-custom-react-hook-implementation/
export const useInterval = (callback, timer) => {
    const intervalIdRef = React.useRef()

    React.useEffect(() => {
        intervalIdRef.current = callback
    }, [callback])

    React.useEffect(() => {
        const fn = () => {
            intervalIdRef.current()
        }
        if (timer !== null) {
            let intervalId = setInterval(fn, timer)
            return () => clearInterval(intervalId)
        }
    }, [timer])
};

// How to set focus on an input field after rendering?
// source: https://stackoverflow.com/questions/28889826/how-to-set-focus-on-an-input-field-after-rendering
export const useFocus = () => {
    const htmlElRef = React.useRef(null)
    const setFocus = () => { htmlElRef.current && htmlElRef.current.focus() }

    return { ref: htmlElRef, setFocus };
}

// useCombinedRefs - CodeSandbox
// source: https://codesandbox.io/s/uhj08?file=/src/App.js:223-537
export const setRefs = (...refs) => (element) => {
    refs.forEach((ref) => {
        if (!ref) {
            return;
        }

        // Ref can have two types - a function or an object. We treat each case.
        if (typeof ref === "function") {
            return ref(element);
        }

        ref.current = element;
    });
};