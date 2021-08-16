const getSubscriptionUrl = async (ctx, accessToken, shop) => {
    const SUBSCRIPTION_QUERY = JSON.stringify({
        query: `mutation {
            appSubscriptionCreate(
                name: "Elena Subscription"
                lineItems: {
                    plan: {
                        appRecurringPricingDetails: {
                            price: {
                                amount: 10.0
                                currencyCode: USD
                            }
                        }
                    }
                } 
                test: true
                returnUrl: "https://${shop}/admin/apps"
            )
        }`
    });

    const response = await fetch(`https://${shop}/admin/api/2020-10/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
        },
        body: SUBSCRIPTION_QUERY
    });

    const responseJson = await response.json();
    const confirmationUrl = responseJson.data.appSubscriptionCreate.confirmationUrl
    return ctx.redirect(confirmationUrl);
}

module.export = getSubscriptionUrl;