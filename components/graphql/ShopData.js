import React from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import { Card } from '@shopify/polaris';

const GET_SHOP_DATA = gql`
    query Shop {
        shop {
            name
        }
    }
`;

class ShopData extends React.Component {
    render() {
        return (
            <>
                <Query query={GET_SHOP_DATA}>
                    {( data, loading, error ) => {
                        if (loading) return <Card><p>Loading...</p></Card>
                        if (error) return <Card><p>{ error.message }</p></Card>

                        return <Card><p>{ data.shop.name }</p></Card>
                    }}
                </Query>
            </>
        )
    }
}

export default ShopData;