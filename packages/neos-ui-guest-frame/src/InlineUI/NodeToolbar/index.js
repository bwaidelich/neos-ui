import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import mergeClassNames from 'classnames';
import debounce from 'lodash.debounce';
import animate from 'amator';

import {getGuestFrameBody, findNodeInGuestFrame} from '@neos-project/neos-ui-guest-frame/src/dom';

import {
    AddNode,
    CopySelectedNode,
    CutSelectedNode,
    DeleteSelectedNode,
    HideSelectedNode,
    PasteClipBoardNode
} from './Buttons/index';
import style from './style.css';

export const position = nodeElement => {
    if (nodeElement && nodeElement.getBoundingClientRect) {
        const bodyBounds = getGuestFrameBody().getBoundingClientRect();
        const domBounds = nodeElement.getBoundingClientRect();

        return {
            top: domBounds.top - bodyBounds.top,
            right: bodyBounds.right - domBounds.right,
            bottom: bodyBounds.bottom - domBounds.bottom
        };
    }

    return {top: 0, right: 0, bottom: 0};
};

export default class NodeToolbar extends PureComponent {
    static propTypes = {
        contextPath: PropTypes.string,
        fusionPath: PropTypes.string,
        destructiveOperationsAreDisabled: PropTypes.bool.isRequired,
        // Flag triggered by content tree that tells inlineUI that it should scroll into view
        shouldScrollIntoView: PropTypes.bool.isRequired,
        // Unsets the flag
        requestScrollIntoView: PropTypes.func.isRequired
    };

    constructor() {
        super();
        this.iframeWindow = document.getElementsByName('neos-content-main')[0].contentWindow;
    }

    componentDidMount() {
        this.iframeWindow.addEventListener('resize', debounce(() => this.forceUpdate(), 20));
    }

    componentDidUpdate() {
        // Only scroll into view when triggered from content tree (on focus change)
        if (this.props.shouldScrollIntoView) {
            this.scrollIntoView();
            this.props.requestScrollIntoView(false);
        }
    }

    scrollIntoView() {
        const iframeDocument = this.iframeWindow.document;
        const currentScrollY = this.iframeWindow.scrollY || this.iframeWindow.pageYOffset || iframeDocument.body.scrollTop;
        const nodeElement = findNodeInGuestFrame(this.props.contextPath, this.props.fusionPath);

        if (nodeElement) {
            const nodeAbsolutePosition = position(nodeElement);
            const nodeRelativePosition = nodeElement.getBoundingClientRect();
            const offset = 100;
            const elementIsNotInView = nodeRelativePosition.top < offset || nodeRelativePosition.bottom + offset > this.iframeWindow.innerHeight;
            if (elementIsNotInView) {
                const scrollY = nodeAbsolutePosition.top - offset;

                animate({scrollY: currentScrollY}, {scrollY}, {
                    step: ({scrollY}) => this.iframeWindow.scrollTo(0, scrollY)
                });
            }
        }
    }

    render() {
        const {contextPath, fusionPath, destructiveOperationsAreDisabled} = this.props;

        if (!contextPath) {
            return null;
        }

        const props = {
            contextPath,
            fusionPath,
            destructiveOperationsAreDisabled,
            className: style.toolBar__btnGroup__btn
        };

        const nodeElement = findNodeInGuestFrame(contextPath, fusionPath);
        const {top, right} = position(nodeElement);

        const classNames = mergeClassNames({
            [style.toolBar]: true
        });

        return (
            <div className={classNames} style={{top: top - 50, right}}>
                <div className={style.toolBar__btnGroup}>
                    <AddNode {...props}/>
                    <HideSelectedNode {...props}/>
                    <CopySelectedNode {...props}/>
                    <CutSelectedNode {...props}/>
                    <PasteClipBoardNode {...props}/>
                    <DeleteSelectedNode {...props}/>
                </div>
            </div>
        );
    }
}
