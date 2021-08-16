const axios = require('axios');

const createScriptTag = async (accessToken, shop) => {
    const url = `https://${shop}/admin/api/2020-10/script_tags.json`;
    const src = 'https://example.com/example.js';

    let scriptTagExist = false;

    const shopifyHeader = (token) => ({
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
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
}

const deleteScriptTag = async (accessToken, shop, scriptTagID) => {
    const url = `https://${shop}/admin/api/2020-10/script_tags/${scriptTagID}.json`;

    const shopifyHeader = (token) => ({
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
    });

    await axios.delete(url, { headers: shopifyHeader(accessToken) })
        .then(response => { console.log(response); })
        .catch(error => console.log(error));
}


module.exports = { createScriptTag, deleteScriptTag };