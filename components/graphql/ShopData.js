import React from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import { Card, EmptyState, SkeletonPage, Layout, SkeletonBodyText, SkeletonThumbnail } from '@shopify/polaris';

const GET_SHOP_DATA = gql`
    query Shop {
        shop {
            name
            contactEmail
            myshopifyDomain
        }
    }
`;

class ShopData extends React.Component {
    render() {
        return (
            <>
                <Query query={GET_SHOP_DATA}>
                    {( data, loading, error ) => {
                        if (loading) return <SkeletonPage>
                                                <Layout>
                                                    <Layout.Section>
                                                        <SkeletonBodyText />
                                                    </Layout.Section>
                                                    <Layout.Section secondary>
                                                        <SkeletonThumbnail size="large" />
                                                    </Layout.Section>
                                                </Layout>
                                            </SkeletonPage>
                        if (error) return <Card><p>{ error.message }</p></Card>
                        
                        return  <EmptyState
                                    heading={`Welcome, ${data.shop.name}`}
                                    secondaryAction={{content: 'Visit the store', url: data.shop.myshopifyDomain}}
                                    image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
                                >
                                    <p>Elena is the newest Shopify app for learning how to develop Shopify apps</p>
                                </EmptyState>
                    }}
                </Query>
            </>
        )
    }
}

export default ShopData;