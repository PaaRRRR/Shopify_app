const axios = require('axios');
const fs = require('fs');

const shopifyHeader = (token) => ({
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': token
});

const THEME_SNIPPET = '{% include \'elena-theme\' %}';
const THEME_SNIPPET_VALUE = fs.readFileSync('snippets/elena-theme.liquid', 'utf-8');

const updateThemeLiquid = async (accessToken, shop) => {
    const theme_url = `https://${shop}/admin/api/2020-10/themes.json`;
    const getTheme = await axios.get(theme_url, { headers: shopifyHeader(accessToken) });
    const theme = getTheme.data.themes.filter(
        (theme) => theme.role == 'main'
    )[0];

    const asset_url = `https://${shop}/admin/api/2020-10/themes/${theme.id}/assets.json?asset[key]=layout/theme.liquid`;
    const getThemeLiquid = await axios.get(asset_url, { headers: shopifyHeader(accessToken) });
    let { value } = getThemeLiquid.data.asset;

    const asset_put_url = `https://${shop}/admin/api/2020-10/themes/${theme.id}/assets.json`;

    if (!value.includes(THEME_SNIPPET)) {
        value = value.replace('</body>', `${THEME_SNIPPET}\n</body>`);

        const themeBody = JSON.stringify({
            asset: {
                key: 'layout/theme.liquid',
                value
            }
        });

        await axios.put(asset_put_url, themeBody, { headers: shopifyHeader(accessToken) });
    }

    const snippetBody = JSON.stringify({
        asset: {
            key: 'snippets/elena-theme.liquid',
            value: THEME_SNIPPET_VALUE
        }
    });

    await axios.put(asset_put_url, snippetBody, { headers: shopifyHeader(accessToken) });
}

module.exports = { updateThemeLiquid }