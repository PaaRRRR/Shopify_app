require('isomorphic-fetch');
const dotenv = require('dotenv');
const Koa = require('koa');
const next = require('next');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const session = require('koa-session');

const Router = require('@koa/router');
const axios = require('axios');

dotenv.config();
const { default: graphQLProxy } = require('@shopify/koa-shopify-graphql-proxy');
const { ApiVersion } = require('@shopify/koa-shopify-graphql-proxy');

const port = parseInt(process.env.PORT) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const { SHOPIFY_API_SECRET_KEY, SHOPIFY_API_KEY } = process.env;

const getSubscriptionUrl = require('./components/graphql/Subscription');
const { default: CreateOrdersList } = require('./components/graphql/CreateOrdersList');

app.prepare().getRequestHandler(() => {
    const server = new Koa();
    const router = new Router();
    server.use(session({ secure: true, sameSite: 'none'}, server));
    server.keys = [SHOPIFY_API_SECRET_KEY];

    server.use(
        createShopifyAuth(
            {
                apiKey: SHOPIFY_API_KEY,
                secret: SHOPIFY_API_SECRET_KEY,
                scopes: [
                    'read_products', 
                    'write_products', 
                    'read_script_tags', 
                    'write_script_tags',
                    'read_orders',
                    'write_orders',
                    'read_draft_orders',
                    'write_draft_orders'
                ],
                async afterAuth(ctx) {
                    const { shop, accessToken } = ctx.session;
                    // await getSubscriptionUrl(ctx, accessToken, shop);
                    ctx.redirect('https://' + shop + '/admin/apps');
                }
            }
        )
    );

    server.use(graphQLProxy({ version: ApiVersion.October20 }))
    server.use(verifyRequest());

    //======================================================//
    //          GET PRODUCTS ROUTER
    //======================================================//

    router.get('/getProducts', verifyRequest(), async (ctx, res) => {
        const { shop, accessToken } = ctx.session;
        const url = `https://${shop}/admin/api/2020-10/products.json`;

        const shopifyHeader = (token) => ({
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': token,
        });

        const getProducts = await axios.get(url, { headers: shopifyHeader(accessToken) });

        ctx.body = getProducts.data;
        ctx.res.statusCode = 200;
    });

    //======================================================//
    //          DELETE PRODUCTS ROUTER
    //======================================================//

    router.get('/deleteProduct', verifyRequest(), async (ctx, res) => {
        const { shop, accessToken } = ctx.session;
        const productID = ctx.query.id;
        const url = `https://${shop}/admin/api/2020-10/products/${productID}.json`;

        const shopifyHeader = (token) => ({
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': token,
        });

        const getProducts = await axios.delete(url, { headers: shopifyHeader(accessToken) })
            .then(response => { console.log(response); })
            .catch(error => console.log(error));

        ctx.res.statusCode = 200;
    });

    //======================================================//
    //          CREATE SCRIPT TAGS
    //======================================================//

    router.get('/installScriptTags', verifyRequest(), async (ctx, res) => {
        const { shop, accessToken } = ctx.session;
        const url = `https://${shop}/admin/api/2020-10/script_tags.json`;
        const src = 'https://example.com/example.js';

        let scriptTagExist = false;

        const shopifyHeader = (token) => ({
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': token,
        });

        const scriptTagBody = JSON.stringify({
            script_tag: {
                event: 'onload',
                src,
            },
        });

        const getScriptTags = await axios.get(url, { headers: shopifyHeader(accessToken) });

        //console.log(getScriptTags.data);

        getScriptTags.data.script_tags.map((script) => {
            //console.log(script);
            if(script.src == src) {
                scriptTagExist = true;
            }
        });

        if(!scriptTagExist) {
            await axios.post(url, scriptTagBody, { headers: shopifyHeader(accessToken) })
                .then(response => { console.log(response); })
                .catch(error => console.log(error));
        }
        

        ctx.res.statusCode = 200;
    });

    //======================================================//
    //          DELETE SCRIPT TAG ROUTER
    //======================================================//

    router.get('/uninstallScriptTag', verifyRequest(), async (ctx, res) => {
        const { shop, accessToken } = ctx.session;
        const scriptTagID = ctx.query.id;
        const url = `https://${shop}/admin/api/2020-10/script_tags/${scriptTagID}.json`;

        const shopifyHeader = (token) => ({
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': token,
        });

        await axios.delete(url, { headers: shopifyHeader(accessToken) })
            .then(response => { console.log(response); })
            .catch(error => console.log(error));

        ctx.res.statusCode = 200;
    });

    //======================================================//
    //          CREATE ORDER ROUTER
    //======================================================//

    router.get('/createDraftOrder', verifyRequest(), async (ctx, resp) => {
        const { shop, accessToken } = ctx.session;

        const title = ctx.query.title;
        const quantity = ctx.query.quantity;
        const price = ctx.query.price;

        const url = `https://${shop}/admin/api/2020-10/graphql.json`;

        const CREATE_DRAFT_ORDER_QUERY = JSON.stringify({
            query: `mutation {
                draftOrderCreate (
                    input: {
                        lineItems: {
                            title: "${title}"
                            quantity: ${quantity}
                            originalUnitPrice: "${price}"
                        }
                    }
                ) {
                    draftOrder {
                        id
                    }
                    userErrors {
                        message
                    }
                }
            }`
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
            },
            body: CREATE_DRAFT_ORDER_QUERY
        });

        const responseJson = await response.json();

        const COMPLETE_DRAFT_ORDER_QUERY = JSON.stringify({
            query: `mutation {
                draftOrderComplete (
                    id: "${responseJson.data.draftOrderCreate.draftOrder.id}"
                ) {
                    draftOrder {
                        id
                    }
                }
            }`
        });

        const completeDraftOrderResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
            },
            body: COMPLETE_DRAFT_ORDER_QUERY
        });

        const responseCompleteDraftOrderJson = await completeDraftOrderResponse.json();
        console.log(responseCompleteDraftOrderJson);

        ctx.res.statusCode = 200;
    });


    //======================================================//
    //          CREATE ORDER LIST ROUTER
    //======================================================//

    router.get('/createDraftOrderList', verifyRequest(), async (ctx, resp) => {
        const { shop, accessToken } = ctx.session;
        const items = ctx.query.items;

        const url = `https://${shop}/admin/api/2020-10/graphql.json`;

        let variantIDs = '';

        if (items.length > 0) {
            variantIDs = items.map(
                (item) => { return `{ varaintId: "${item}" quantity: 1}` }
            ).join(',');
        }

        const CREATE_DRAFT_ORDER_QUERY = JSON.stringify({
            query: `mutation {
                draftOrderCreate (
                    input: {
                        lineItems: [${variantIDs}]
                    }
                ) {
                    draftOrder {
                        id
                    }
                    userErrors {
                        message
                    }
                }
            }`
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
            },
            body: CREATE_DRAFT_ORDER_QUERY
        });

        const responseJson = await response.json();

        const COMPLETE_DRAFT_ORDER_QUERY = JSON.stringify({
            query: `mutation {
                draftOrderComplete (
                    id: "${responseJson.data.draftOrderCreate.draftOrder.id}"
                ) {
                    draftOrder {
                        id
                    }
                }
            }`
        });

        const completeDraftOrderResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
            },
            body: COMPLETE_DRAFT_ORDER_QUERY
        });

        const responseCompleteDraftOrderJson = await completeDraftOrderResponse.json();
        console.log(responseCompleteDraftOrderJson);

        ctx.res.statusCode = 200;
    });



    server.use(router.routes());
    server.use(router.allowedMethods());



    server.use(async (ctx) => {
        await handle(ctx.req, ctx.res);
        ctx.respond = false;
        ctx.res.statusCode = 200;
        return;
    });

    server.listen(port, () => {
        console.log('> ');
    })


})