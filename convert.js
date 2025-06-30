const postmanToOpenApi = require('postman-to-openapi');

const postmanCollection = './collection/jobbee_API.postman_collection.json';
const outputFile = './collection/swagger.yml';

async function convert() {
    try {
        const result = await postmanToOpenApi(postmanCollection, outputFile, { defaultTag: 'General', raw: false });
        console.log(`OpenAPI spec saved to: ${result}`);

        const result2 = await postmanToOpenApi(postmanCollection, null, { defaultTag: 'General', raw: true });
        console.log("Raw OpenAPI YAML:\n", result2);
    } catch (err) {
        console.error('Conversion error:', err);
    }
}

convert();
