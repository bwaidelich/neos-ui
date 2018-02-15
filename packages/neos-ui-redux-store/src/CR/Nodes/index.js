import {createAction} from 'redux-actions';
import Immutable, {Map} from 'immutable';
import {$all, $set, $drop, $get, $merge} from 'plow-js';

import {handleActions} from '@neos-project/utils-redux';
import {actionTypes as system} from '../../System/index';

import * as selectors from './selectors';
import {parentNodeContextPath} from './helpers';

const ADD = '@neos/neos-ui/CR/Nodes/ADD';
const FOCUS = '@neos/neos-ui/CR/Nodes/FOCUS';
const UNFOCUS = '@neos/neos-ui/CR/Nodes/UNFOCUS';
const COMMENCE_CREATION = '@neos/neos-ui/CR/Nodes/COMMENCE_CREATION';
const COMMENCE_REMOVAL = '@neos/neos-ui/CR/Nodes/COMMENCE_REMOVAL';
const REMOVAL_ABORTED = '@neos/neos-ui/CR/Nodes/REMOVAL_ABORTED';
const REMOVAL_CONFIRMED = '@neos/neos-ui/CR/Nodes/REMOVAL_CONFIRMED';
const REMOVE = '@neos/neos-ui/CR/Nodes/REMOVE';
const SWITCH_DIMENSION = '@neos/neos-ui/CR/Nodes/SWITCH_DIMENSION';
const COPY = '@neos/neos-ui/CR/Nodes/COPY';
const CUT = '@neos/neos-ui/CR/Nodes/CUT';
const MOVE = '@neos/neos-ui/CR/Nodes/MOVE';
const PASTE = '@neos/neos-ui/CR/Nodes/PASTE';
const HIDE = '@neos/neos-ui/CR/Nodes/HIDE';
const SHOW = '@neos/neos-ui/CR/Nodes/SHOW';
const UPDATE_URI = '@neos/neos-ui/CR/Nodes/UPDATE_URI';

//
// Export the action types
//
export const actionTypes = {
    ADD,
    FOCUS,
    UNFOCUS,
    COMMENCE_CREATION,
    COMMENCE_REMOVAL,
    REMOVAL_ABORTED,
    REMOVAL_CONFIRMED,
    REMOVE,
    SWITCH_DIMENSION,
    COPY,
    CUT,
    MOVE,
    PASTE,
    HIDE,
    SHOW,
    UPDATE_URI
};

//
// Build up parent to children relations
//
const populateChildren = nodes => {
    // Clear out initial children
    Object.keys(nodes).forEach(contextPath => {
        const node = nodes[contextPath];
        node.children = [];
    });
    // Populate new children
    Object.keys(nodes).forEach(contextPath => {
        const node = nodes[contextPath];
        const parentNode = nodes[node.parentContextPath];
        if (parentNode && Array.isArray(parentNode.children)) {
            parentNode.children.push({
                contextPath,
                nodeType: node.nodeType,
                index: node.index
            });
        }
    });
    // Re-sort new children
    Object.keys(nodes).forEach(contextPath => {
        const node = nodes[contextPath];
        node.children.sort((a, b) => {
            const aIndex = $get('index', a);
            const bIndex = $get('index', b);
            if (aIndex < bIndex) {
                return -1;
            }
            if (aIndex > bIndex) {
                return 1;
            }
            return 0;
        });
    });
    return nodes;
};

/**
 * Adds nodes to the application state. Completely *replaces*
 * the nodes from the application state with the passed nodes.
 *
 * @param {Object} nodeMap A map of nodes, with contextPaths as key
 */
const add = createAction(ADD, nodeMap => ({nodeMap}));

/**
 * Marks a node as focused
 *
 * @param {String} contextPath The context path of the focused node
 * @param {String} fusionPath The fusion path of the focused node, needed for out-of-band-rendering, e.g. when
 *                            adding new nodes
 */
const focus = createAction(FOCUS, (contextPath, fusionPath) => ({contextPath, fusionPath}));

/**
 * Un-marks all nodes as not focused.
 */
const unFocus = createAction(UNFOCUS);

/**
 * Start node removal workflow
 *
 * @param {String} contextPath The context path of the node to be removed
 */
const commenceRemoval = createAction(COMMENCE_REMOVAL, contextPath => contextPath);

/**
 * Start node creation workflow
 *
 * @param {String} referenceNodeContextPath The context path of the referenceNode
 * @param {String} referenceNodeFusionPath The fusion path of the referenceNode
 */
const commenceCreation = createAction(COMMENCE_CREATION, (referenceNodeContextPath, referenceNodeFusionPath) => ({
    referenceNodeContextPath,
    referenceNodeFusionPath
}));

/**
 * Abort the ongoing node removal workflow
 */
const abortRemoval = createAction(REMOVAL_ABORTED);

/**
 * Confirm the ongoing removal
 */
const confirmRemoval = createAction(REMOVAL_CONFIRMED);

/**
 * Remove the node that was marked for removal
 *
 * @param {String} contextPath The context path of the node to be removed
 */
const remove = createAction(REMOVE, contextPath => contextPath);

/**
 * Switch to new site- and documentNodes, add initial nodes for the new dimension
 */
const switchDimension = createAction(
    SWITCH_DIMENSION,
    ({siteNodeContextPath, documentNodeContextPath, nodes}) => ({
        siteNodeContextPath,
        documentNodeContextPath,
        nodes
    })
);

/**
 * Mark a node for copy on paste
 *
 * @param {String} contextPath The context path of the node to be copied
 */
const copy = createAction(COPY, contextPath => contextPath);

/**
 * Mark a node for cut on paste
 *
 * @param {String} contextPath The context path of the node to be cut
 */
const cut = createAction(CUT, contextPath => contextPath);

/**
 * Move a node
 *
 * @param {String} nodeToBeMoved The context path of the node to be moved
 * @param {String} targetNode The context path of the target node
 * @param {String} position "into", "before" or "after"
 */
const move = createAction(MOVE, (nodeToBeMoved, targetNode, position) => ({nodeToBeMoved, targetNode, position}));

/**
 * Paste the contents of the node clipboard
 *
 * @param {String} contextPath The context path of the target node
 * @param {String} fusionPath The fusion path of the target node, needed for out-of-band-rendering
 */
const paste = createAction(PASTE, (contextPath, fusionPath) => ({contextPath, fusionPath}));

/**
 * Hide the given node
 *
 * @param {String} contextPath The context path of the node to be hidden
 */
const hide = createAction(HIDE, contextPath => contextPath);

/**
 * Show the given node
 *
 * @param {String} contextPath The context path of the node to be shown
 */
const show = createAction(SHOW, contextPath => contextPath);

/**
 * Update uris of all affected nodes after uriPathSegment of a node has changed
 * Must update the node itself and all of its descendants
 *
 * @param {String} oldUriFragment
 * @param {String} newUriFragment
 */
const updateUri = createAction(UPDATE_URI, (oldUriFragment, newUriFragment) => ({oldUriFragment, newUriFragment}));

//
// Export the actions
//
export const actions = {
    add,
    focus,
    unFocus,
    commenceCreation,
    commenceRemoval,
    abortRemoval,
    confirmRemoval,
    remove,
    switchDimension,
    copy,
    cut,
    move,
    paste,
    hide,
    show,
    updateUri
};

//
// Export the reducer
//
export const reducer = handleActions({
    [system.INIT]: state => $set(
        'cr.nodes',
        new Map({
            byContextPath: Immutable.fromJS(populateChildren($get('cr.nodes.byContextPath', state))) || new Map(),
            siteNode: $get('cr.nodes.siteNode', state) || '',
            focused: new Map({
                contextPath: '',
                fusionPath: ''
            }),
            toBeRemoved: '',
            clipboard: '',
            clipboardMode: ''
        })
    ),
    [ADD]: ({nodeMap}) => state => {
        const updatedState = $merge(['cr', 'nodes', 'byContextPath'], Immutable.fromJS(JSON.parse(JSON.stringify(nodeMap))), state);
        const crNodes = $get(['cr', 'nodes', 'byContextPath'], updatedState);
        const processedCrNodes = populateChildren(crNodes.toJS());
        return $set(['cr', 'nodes', 'byContextPath'], Immutable.fromJS(processedCrNodes), state);
    },
    [MOVE]: ({nodeToBeMoved: sourceNodeContextPath, targetNode: targetNodeContextPath, position}) => state => {
        // Determine new index
        let newIndex;
        const targetNodeIndex = $get(['cr', 'nodes', 'byContextPath', targetNodeContextPath, 'index'], state);
        if (position === 'into') {
            // push the node down below any possible node
            newIndex = 9007199254740991;
        } else if (position === 'before') {
            newIndex = targetNodeIndex - 1;
        } else {
            newIndex = targetNodeIndex + 1;
        }
        state = $set(['cr', 'nodes', 'byContextPath', sourceNodeContextPath, 'index'], newIndex, state);

        // Determine base node into which we'll be inserting
        let baseNodeContextPath;
        if (position === 'into') {
            baseNodeContextPath = targetNodeContextPath;
        } else {
            baseNodeContextPath = parentNodeContextPath(targetNodeContextPath);
        }
        state = $set(['cr', 'nodes', 'byContextPath', sourceNodeContextPath, 'parentContextPath'], baseNodeContextPath, state);

        const crNodes = $get(['cr', 'nodes', 'byContextPath'], state);
        const processedCrNodes = populateChildren(crNodes.toJS());
        return $set(['cr', 'nodes', 'byContextPath'], Immutable.fromJS(processedCrNodes), state);
    },
    [FOCUS]: ({contextPath, fusionPath}) => $set('cr.nodes.focused', new Map({contextPath, fusionPath})),
    [UNFOCUS]: () => $set('cr.nodes.focused', new Map({
        contextPath: '',
        fusionPath: ''
    })),
    [COMMENCE_REMOVAL]: contextPath => $set('cr.nodes.toBeRemoved', contextPath),
    [REMOVAL_ABORTED]: () => $set('cr.nodes.toBeRemoved', ''),
    [REMOVAL_CONFIRMED]: () => $set('cr.nodes.toBeRemoved', ''),
    [REMOVE]: contextPath => $drop(['cr', 'nodes', 'byContextPath', contextPath]),
    [SWITCH_DIMENSION]: ({siteNodeContextPath, documentNodeContextPath, nodes}) => $all(
        $set('cr.nodes.siteNode', siteNodeContextPath),
        $set('ui.contentCanvas.contextPath', documentNodeContextPath),
        $set('cr.nodes.focused', new Map({
            contextPath: '',
            fusionPath: ''
        })),
        $merge('cr.nodes.byContextPath', Immutable.fromJS(populateChildren(nodes)))
    ),
    [COPY]: contextPath => $all(
        $set('cr.nodes.clipboard', contextPath),
        $set('cr.nodes.clipboardMode', 'Copy')
    ),
    [CUT]: contextPath => $all(
        $set('cr.nodes.clipboard', contextPath),
        $set('cr.nodes.clipboardMode', 'Move')
    ),
    [PASTE]: () => $set('cr.nodes.clipboard', ''),
    [HIDE]: contextPath => $set(['cr', 'nodes', 'byContextPath', contextPath, 'properties', '_hidden'], true),
    [SHOW]: contextPath => $set(['cr', 'nodes', 'byContextPath', contextPath, 'properties', '_hidden'], false),
    [UPDATE_URI]: ({oldUriFragment, newUriFragment}) => state => {
        const allNodes = $get('cr.nodes.byContextPath', state);
        return $all(
            ...allNodes.map(node => {
                const nodeUri = $get('uri', node);
                if (
                    nodeUri &&
                    // Make sure to not include false positives by checking that the given segment ends either with "/" or "@"
                    (nodeUri.includes(oldUriFragment + '/') || nodeUri.includes(oldUriFragment + '@'))
                ) {
                    const contextPath = $get('contextPath', node);
                    return $set(
                        ['cr', 'nodes', 'byContextPath', contextPath, 'uri'],
                        nodeUri
                            // node with changes uriPathSegment
                            .replace(oldUriFragment + '@', newUriFragment + '@')
                            // descendant of a node with changed uriPathSegment
                            .replace(oldUriFragment + '/', newUriFragment + '/')
                    );
                }
                return null;
            }).filter(i => i).toArray(),
            state
        );
    }
});

//
// Export the selectors
//
export {selectors};
