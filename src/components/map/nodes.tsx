import {
    h,
    Component,
    createRef,
    ComponentChild,
    RefObject
} from 'preact';

import * as d3Shape from 'd3-shape';
import * as d3Drag from 'd3-drag';
import * as d3Force from 'd3-force';
import * as d3Selection from 'd3-selection';
import { NodeI, LinkI, Device, DeviceType, Dictionary } from './types';
import cx from 'classnames';

import * as style from './map.css';
import { HoverableNode } from '.';
const stylesDict: Dictionary = { ...style };

const getStarShape = (r1: number, r2: number): string | null => {
    const radialLineGenerator = d3Shape.lineRadial<[number, number]>();
    const radialpoints: [number, number][] = [
        [0, r1],
        [Math.PI * 0.2, r2],
        [Math.PI * 0.4, r1],
        [Math.PI * 0.6, r2],
        [Math.PI * 0.8, r1],
        [Math.PI * 1, r2],
        [Math.PI * 1.2, r1],
        [Math.PI * 1.4, r2],
        [Math.PI * 1.6, r1],
        [Math.PI * 1.8, r2],
        [Math.PI * 2, r1]
    ];
    return radialLineGenerator(radialpoints);
};
//TODO: figure how to forward ref to parent comp
// interface StarProps {
//     r1: number;
//     r2: number;
//     [k: string]: unknown;
// }
// const Star: FunctionalComponent<StarProps> = (props: StarProps) => {
//     const { r1, r2, forwardRef, ...rest } = props;
//     debugger;
//     const radialLineGenerator = d3Shape.lineRadial<[number, number]>();
//     const radialpoints: [number, number][] = [
//         [0, r1],
//         [Math.PI * 0.2, r2],
//         [Math.PI * 0.4, r1],
//         [Math.PI * 0.6, r2],
//         [Math.PI * 0.8, r1],
//         [Math.PI * 1, r2],
//         [Math.PI * 1.2, r1],
//         [Math.PI * 1.4, r2],
//         [Math.PI * 1.6, r1],
//         [Math.PI * 1.8, r2],
//         [Math.PI * 2, r1]
//     ];

//     return (
//         <path
//             ref={forwardRef}
//             {...rest}
//             d={radialLineGenerator(radialpoints) as string}
//         />
//     );
// };

interface NodeProps extends HoverableNode {
    node: NodeI;
}

class Node extends Component<NodeProps, {}> {
    ref = createRef<SVGPathElement | SVGCircleElement>();

    componentDidMount(): void {
        const { current } = this.ref;
        const { node } = this.props;

        d3Selection.select(current as SVGElement).data([node]);
    }


    onMouseOut = (): void => {
        const { node, onMouseOut } = this.props;
        onMouseOut && onMouseOut(node);
    }

    onMouseOver = (): void => {
        const { node, onMouseOver } = this.props;
        onMouseOver && onMouseOver(node);
    }


    render(): ComponentChild {
        const { node } = this.props;
        const { onMouseOver, onMouseOut } = this;
        const deviceType = (node.device as Device).type as string;
        const mappedClas = stylesDict[deviceType] as string;
        const cn = cx(style.node, mappedClas);

        switch (node.device.type) {
            case DeviceType.Coordinator:
                return (
                    <path
                        className={cn}
                        ref={this.ref as RefObject<SVGPathElement>}
                        d={getStarShape(14, 5) as string}
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                    />
                );
            default:
                return (
                    <circle
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        className={cn}
                        ref={this.ref as RefObject<SVGCircleElement>}
                        r={5}
                    />);
        }
    }
}
interface NodesProps extends HoverableNode {
    nodes: NodeI[];
    simulation: d3Force.Simulation<NodeI, LinkI>;
}

interface NodesState {
    tooltipNode: NodeI | undefined;
}

export default class Nodes extends Component<NodesProps, NodesState> {
    updateDrag(): void {
        const { simulation } = this.props;
        const drag = d3Drag
            .drag<SVGCircleElement, NodeI>()
            .on('start', d => {
                if (!d3Selection.event.active) {
                    simulation.alphaTarget(0.3).restart();
                }
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', d => {
                d.fx = d3Selection.event.x;
                d.fy = d3Selection.event.y;
            })
            .on('end', d => {
                if (!d3Selection.event.active) {
                    simulation.alphaTarget(0);
                }
                d.fx = undefined;
                d.fy = undefined;
            });

        d3Selection
            .selectAll<SVGCircleElement, NodeI>(`.${style.node}`)
            .call(drag);
    }

    componentDidMount(): void {
        this.updateDrag();
    }
    componentDidUpdate(): void {
        this.updateDrag();
    }

    render(): ComponentChild {
        const { nodes, onMouseOut, onMouseOver } = this.props;
        return (
            <g className={style.nodes}>
                {nodes.map((node: NodeI, index: number) => (
                    <Node
                        onMouseOut={onMouseOut}
                        onMouseOver={onMouseOver}
                        key={index}
                        node={node}
                    />
                ))}
            </g>
        );
    }
}