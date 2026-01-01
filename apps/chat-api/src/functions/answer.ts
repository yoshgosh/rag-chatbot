import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { answerUsecase } from '../usecases/answer.js';

const AnswerBodySchema = z.object({
    query: z.string().min(1, 'query must not be empty'),
});

type AnswerBody = z.infer<typeof AnswerBodySchema>;

export async function answer(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log(`Http function "answer" invoked for url "${request.url}"`);

    let body: unknown;
    let parsed: AnswerBody;

    try {
        body = await request.json();
    } catch {
        return {
            status: 400,
            jsonBody: {
                error: 'invalid_json',
                message: 'Request body must be valid JSON.',
            },
        };
    }

    try {
        parsed = AnswerBodySchema.parse(body);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return {
                status: 400,
                jsonBody: {
                    error: 'invalid_request',
                    message: 'Request body is invalid.',
                    issues: err.issues,
                },
            };
        }

        return {
            status: 400,
            jsonBody: {
                error: 'invalid_request',
                message: 'Request body is invalid.',
            },
        };
    }

    try {
        const result = await answerUsecase({
            query: parsed.query,
        });

        return {
            status: 200,
            jsonBody: {
                answer: result.answer,
                docs: result.docs,
            },
        };
    } catch (err) {
        context.log('Error in answerUsecase', err);

        return {
            status: 500,
            jsonBody: {
                error: 'internal_error',
                message: 'Unexpected error occurred.',
            },
        };
    }
}

app.http('answer', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: answer,
});
