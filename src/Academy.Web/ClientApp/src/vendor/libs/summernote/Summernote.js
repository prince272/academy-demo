/* global $ */
import $ from 'jquery';

// Import bootstrap(v4) dependencies
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/dropdown';
import 'bootstrap/js/dist/tooltip';

import 'codemirror/lib/codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/mode/xml/xml';


import 'summernote/dist/summernote-bs4';
import './summernote.scss';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import DOMPurify from 'dompurify';

const randomUid = () => Math.floor(Math.random() * 100000);

class Summernote extends Component {
    constructor(props) {
        super(props);

        this.uid = `react-summernote-${randomUid()}`;
        this.editor = {};
        this.noteEditable = null;
        this.notePlaceholder = null;

        this.onInit = this.onInit.bind(this);
        this.onImageUpload = this.onImageUpload.bind(this);

        this.focus = this.focus.bind(this);
        this.isEmpty = this.isEmpty.bind(this);
        this.reset = this.reset.bind(this);
        this.replace = this.replace.bind(this);
        this.disable = this.disable.bind(this);
        this.enable = this.enable.bind(this);
        this.toggleState = this.toggleState.bind(this);
        this.insertImage = this.insertImage.bind(this);
        this.insertNode = this.insertNode.bind(this);
        this.insertText = this.insertText.bind(this);

        Summernote.focus = this.focus.bind(this);
        Summernote.isEmpty = this.isEmpty.bind(this);
        Summernote.reset = this.reset.bind(this);
        Summernote.replace = this.replace.bind(this);
        Summernote.disable = this.disable.bind(this);
        Summernote.enable = this.enable.bind(this);
        Summernote.toggleState = this.toggleState.bind(this);
        Summernote.insertImage = this.insertImage.bind(this);
        Summernote.insertNode = this.insertNode.bind(this);
        Summernote.insertText = this.insertText.bind(this);
    }

    componentDidMount() {
        const options = this.props.options || {};
        options.callbacks = this.callbacks;

        this.editor = $(`#${this.uid}`);
        this.editor.summernote(options);
    }

    componentWillReceiveProps(nextProps) {
        const { props } = this;

        if (typeof nextProps.value === 'string' && props.value !== nextProps.value) {
            this.replace(nextProps.value);
        }

        if (typeof nextProps.disabled === 'boolean' && props.disabled !== nextProps.disabled) {
            this.toggleState(nextProps.disabled);
        }
    }

    shouldComponentUpdate() {
        return false;
    }

    componentWillUnmount() {
        if (this.editor.summernote) {
            this.editor.summernote('destroy');
        }
    }

    onInit() {
        const { disabled, onInit } = this.props;

        const $container = this.editor.parent();
        this.noteEditable = $container.find('.note-editable');
        this.notePlaceholder = $container.find('.note-placeholder');

        $container.find('.btn-light').removeClass('btn-light').addClass('btn-default');

        if (typeof disabled === 'boolean') {
            this.toggleState(disabled);
        }

        if (typeof onInit === 'function') {
            onInit({
                summernote: this.editor.summernote,
                focus: this.focus,
                isEmpty: this.isEmpty,
                reset: this.reset,
                replace: this.replace,
                disable: this.disable,
                enable: this.enable,
                insertImage: this.insertImage,
                insertNode: this.insertNode,
                insertText: this.insertText
            });
        }
    }

    onImageUpload(images) {
        const { onImageUpload } = this.props;

        if (typeof onImageUpload === 'function') {
            onImageUpload(images, this.insertImage);
        }
    }

    focus() {
        this.editor.summernote('focus');
    }

    isEmpty() {
        return this.editor.summernote('isEmpty');
    }

    reset() {
        this.editor.summernote('reset');
    }

    replace(content) {
        const { noteEditable, notePlaceholder } = this;
        const prevContent = noteEditable.html();
        const contentLength = content.length;

        if (prevContent !== content) {
            if (this.isEmpty() && contentLength > 0) {
                notePlaceholder.hide();
            } else if (contentLength === 0) {
                notePlaceholder.show();
            }

            noteEditable.html(content);
        }
    }

    disable() {
        this.editor.summernote('disable');
    }

    enable() {
        this.editor.summernote('enable');
    }

    toggleState(disabled) {
        if (disabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    insertImage(url, filenameOrCallback) {
        this.editor.summernote('insertImage', url, filenameOrCallback);
    }

    insertNode(node) {
        this.editor.summernote('insertNode', node);
    }

    insertText(text) {
        this.editor.summernote('insertText', text);
    }

    get callbacks() {
        const props = this.props;

        return {
            onInit: this.onInit,
            onEnter: props.onEnter,
            onFocus: props.onFocus,
            onBlur: props.onBlur,
            onKeyup: props.onKeyUp,
            onKeydown: props.onKeyDown,
            onPaste: props.onPaste,
            onChange: props.onChange,
            onImageUpload: this.onImageUpload
        };
    }

    render() {
        const { value, defaultValue, className } = this.props;
        const html = value || defaultValue;

        return (
            <div className={className}>
                <div id={this.uid} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
            </div>
        );
    }
}

Summernote.propTypes = {
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    className: PropTypes.string,
    options: PropTypes.object,
    disabled: PropTypes.bool,
    onInit: PropTypes.func,
    onEnter: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onKeyUp: PropTypes.func,
    onKeyDown: PropTypes.func,
    onPaste: PropTypes.func,
    onChange: PropTypes.func,
    onImageUpload: PropTypes.func
};

export default Summernote;