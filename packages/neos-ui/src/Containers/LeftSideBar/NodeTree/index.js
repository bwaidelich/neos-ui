import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {$get} from 'plow-js';
import mergeClassNames from 'classnames';

import {Tree, Icon} from '@neos-project/react-ui-components';

import {actions, selectors} from '@neos-project/neos-ui-redux-store';
import {SelectionModeTypes} from '@neos-project/neos-ts-interfaces';
import {dndTypes} from '@neos-project/neos-ui-constants';

import {PageTreeNode, ContentTreeNode} from './Node/index';

import style from './style.css';

// TODO extract to selector
const hasNestedNodes = focusedNodesContextPaths => {
    return !focusedNodesContextPaths.every(contextPathA => {
        const path = contextPathA.split('@')[0];
        // TODO: adjust this for the new CR when this is merged: https://github.com/neos/neos-ui/pull/2178
        return focusedNodesContextPaths.every(contextPathB => !(contextPathB.indexOf(path) === 0 && contextPathA !== contextPathB));
    });
};

export default class NodeTree extends PureComponent {
    static propTypes = {
        ChildRenderer: PropTypes.func,
        rootNode: PropTypes.object,
        allowOpeningNodesInNewWindow: PropTypes.bool,
        nodeTypeRole: PropTypes.string,
        contentCanvasSrc: PropTypes.string,
        reload: PropTypes.func,
        toggle: PropTypes.func,
        focus: PropTypes.func,
        requestScrollIntoView: PropTypes.func,
        setActiveContentCanvasSrc: PropTypes.func,
        setActiveContentCanvasContextPath: PropTypes.func,
        moveNodes: PropTypes.func
    };

    state = {
        currentlyDraggedNodes: []
    };

    handleToggle = contextPath => {
        const {toggle} = this.props;

        toggle(contextPath);
    }

    handleFocus = (contextPath, metaKeyPressed, altKeyPressed) => {
        const {focus} = this.props;

        if (altKeyPressed) {
            return;
        }

        focus(contextPath, undefined, metaKeyPressed ? SelectionModeTypes.MULTIPLE_SELECT : SelectionModeTypes.SINGLE_SELECT);
    }

    handleClick = (src, contextPath, metaKeyPressed, altKeyPressed) => {
        const {setActiveContentCanvasSrc, setActiveContentCanvasContextPath, requestScrollIntoView, reload, contentCanvasSrc} = this.props;
        if (altKeyPressed) {
            window.open(window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname + '?node=' + contextPath);
            return;
        }

        if (metaKeyPressed) {
            return;
        }

        // Set a flag that will imperatively tell ContentCanvas to scroll to focused node
        if (requestScrollIntoView) {
            requestScrollIntoView(true);
        }
        if (setActiveContentCanvasSrc) {
            setActiveContentCanvasSrc(src);
        }
        if (setActiveContentCanvasContextPath) {
            setActiveContentCanvasContextPath(contextPath);
        }
        // Trigger reload if clicking on the current document node
        if (reload && contentCanvasSrc === src) {
            reload();
        }
    }

    handleDrag = () => {
        this.setState({
            currentlyDraggedNodes: this.props.focusedNodesContextPaths
        });
    }

    handleDrop = (targetNode, position) => {
        const {currentlyDraggedNodes} = this.state;
        const {moveNodes, focus} = this.props;
        moveNodes(currentlyDraggedNodes, $get('contextPath', targetNode), position);
        // We need to refocus the tree, so all focus would be reset, because its context paths have changed while moving
        // Could be removed with the new CR
        focus($get('contextPath', targetNode));

        this.setState({
            currentlyDraggedNodes: []
        });
    }

    render() {
        const {rootNode, ChildRenderer, focusedNodesContextPaths} = this.props;
        if (!rootNode) {
            return (
                <div className={style.loader}>
                    <Icon icon="spinner" spin={true} />
                </div>
            );
        }

        const classNames = mergeClassNames({
            [style.pageTree]: true
        });

        return (
            <Tree className={classNames}>
                <ChildRenderer
                    ChildRenderer={ChildRenderer}
                    nodeDndType={dndTypes.NODE}
                    node={rootNode}
                    level={1}
                    onNodeToggle={this.handleToggle}
                    onNodeClick={this.handleClick}
                    onNodeFocus={this.handleFocus}
                    onNodeDrag={this.handleDrag}
                    onNodeDrop={this.handleDrop}
                    currentlyDraggedNodes={this.state.currentlyDraggedNodes}
                    dndDisabled={hasNestedNodes(focusedNodesContextPaths)}
                    />
            </Tree>
        );
    }
}

export const PageTree = connect(state => ({
    rootNode: selectors.CR.Nodes.siteNodeSelector(state),
    focusedNodesContextPaths: selectors.UI.PageTree.getAllFocused(state),
    ChildRenderer: PageTreeNode,
    allowOpeningNodesInNewWindow: true,
    contentCanvasSrc: $get('ui.contentCanvas.src', state)
}), {
    toggle: actions.UI.PageTree.toggle,
    focus: actions.UI.PageTree.focus,
    reload: actions.UI.ContentCanvas.reload,
    setActiveContentCanvasSrc: actions.UI.ContentCanvas.setSrc,
    setActiveContentCanvasContextPath: actions.CR.Nodes.setDocumentNode,
    moveNodes: actions.CR.Nodes.moveMultiple,
    requestScrollIntoView: null
})(NodeTree);

export const ContentTree = connect(state => ({
    rootNode: selectors.CR.Nodes.documentNodeSelector(state),
    focusedNodesContextPaths: selectors.CR.Nodes.focusedNodePathsSelector(state),
    ChildRenderer: ContentTreeNode,
    allowOpeningNodesInNewWindow: false
}), {
    toggle: actions.UI.ContentTree.toggle,
    focus: actions.CR.Nodes.focus,
    moveNodes: actions.CR.Nodes.moveMultiple,
    requestScrollIntoView: actions.UI.ContentCanvas.requestScrollIntoView
})(NodeTree);
