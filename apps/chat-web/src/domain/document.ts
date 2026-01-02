export type Document = {
    id: string;
    content: string;
    title: string;
    parentId: string;
};

export type AnswerResponse = {
    answer: string;
    docs: Document[];
};
