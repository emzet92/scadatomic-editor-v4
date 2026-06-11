export type UINode = {
    id: string
    type: string
    props: Record<string, any>

    // parent: NodeId | null
    children: string[]
}

export type UITree = {
    root: string
    nodes: Record<string, UINode>
}
